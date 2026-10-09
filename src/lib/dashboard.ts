import type { Tier } from "./site/types.ts";

export interface QueueItem {
  readonly plugin: string;
  readonly version: string;
  readonly tier: Tier | null;
  readonly triggers: readonly string[];
  readonly since: string | null;
  readonly url: string | null;
}

export interface HeldItem {
  readonly plugin: string;
  readonly version: string;
  readonly until: string | null;
  readonly url: string | null;
}

export interface RejectedItem {
  readonly plugin: string;
  readonly version: string;
  readonly reason: string;
  readonly at: string | null;
  readonly url: string | null;
}

export interface ActionItem {
  readonly action: string;
  readonly target: string;
  readonly reason: string;
  readonly at: string | null;
  readonly url: string | null;
}

export interface FlagItem {
  readonly plugin: string;
  readonly kind: string;
  readonly note: string;
  readonly url: string | null;
}

export interface ReportItem {
  readonly plugin: string;
  readonly count: number;
  readonly url: string | null;
}

export interface Dashboard {
  readonly generatedAt: string | null;
  readonly reviewQueue: readonly QueueItem[];
  readonly held: readonly HeldItem[];
  readonly rejected: readonly RejectedItem[];
  readonly actions: readonly ActionItem[];
  readonly auditFlags: readonly FlagItem[];
  readonly reports: readonly ReportItem[];
}

type Fields = Readonly<Record<string, unknown>>;

function text(source: Fields, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function optionalText(source: Fields, key: string): string | null {
  const value = text(source, key);
  return value ? value : null;
}

const ISSUES = "https://github.com/RunesmithHub/registry/issues/";

function httpsUrl(source: Fields, key: string): string | null {
  const value = text(source, key);
  if (value.startsWith("https://")) {
    return value;
  }
  const issue = source.trackingIssue;
  return typeof issue === "number" && Number.isSafeInteger(issue) && issue > 0 ? `${ISSUES}${issue}` : null;
}

function list<T>(source: Fields, key: string, read: (item: Fields) => T | null): T[] {
  const value = source[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }
    const parsed = read(item as Fields);
    return parsed ? [parsed] : [];
  });
}

const TIERS: readonly string[] = ["official", "verified", "unverified"];

export function parseDashboard(value: unknown): Dashboard {
  const source: Fields = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Fields) : {};
  return {
    generatedAt: optionalText(source, "generatedAt"),
    reviewQueue: list(source, "reviewQueue", (item) => {
      const tier = text(item, "tier");
      const triggers = Array.isArray(item.triggers) ? item.triggers.filter((trigger): trigger is string => typeof trigger === "string") : [];
      return text(item, "plugin")
        ? {
            plugin: text(item, "plugin"),
            version: text(item, "version"),
            tier: TIERS.includes(tier) ? (tier as Tier) : null,
            triggers,
            since: optionalText(item, "since"),
            url: httpsUrl(item, "url"),
          }
        : null;
    }),
    held: list(source, "held", (item) =>
      text(item, "plugin") ? { plugin: text(item, "plugin"), version: text(item, "version"), until: optionalText(item, "until") ?? optionalText(item, "holdUntil"), url: httpsUrl(item, "url") } : null,
    ),
    rejected: list(source, "rejected", (item) =>
      text(item, "plugin")
        ? { plugin: text(item, "plugin"), version: text(item, "version"), reason: text(item, "reason"), at: optionalText(item, "at"), url: httpsUrl(item, "url") }
        : null,
    ),
    actions: list(source, "actions", (item) =>
      text(item, "target")
        ? { action: text(item, "action"), target: text(item, "target"), reason: text(item, "reason"), at: optionalText(item, "at"), url: httpsUrl(item, "url") }
        : null,
    ),
    auditFlags: list(source, "auditFlags", (item) =>
      text(item, "plugin") ? { plugin: text(item, "plugin"), kind: text(item, "kind"), note: text(item, "note"), url: httpsUrl(item, "url") } : null,
    ),
    reports: list(source, "reports", (item) => {
      const count = typeof item.count === "number" ? item.count : item.open;
      return text(item, "plugin") && typeof count === "number" && count > 0
        ? { plugin: text(item, "plugin"), count, url: httpsUrl(item, "url") }
        : null;
    }),
  };
}

export const TRIGGER_LABELS: Readonly<Record<string, string>> = {
  "first-version": "First version",
  "capability-added": "Gains a capability",
  "dynamic-code": "Loads or generates code at run time",
  "native-code": "Adds native code",
  "new-nuget-package": "Uses a NuGet package new to the hub",
  "maintainers-changed": "Maintainers changed",
  heuristic: "A review rule matched",
  "build-logic": "Build logic runs commands",
  "size-growth": "Package grew more than five times",
  "release-author": "Released by someone who isn't a maintainer",
  "name-changed": "Display name changed",
  "previous-restricted": "Previous version was blocked or frozen",
  tier: "Every version of this tier is reviewed",
};

export const REVIEW_TARGET_HOURS = 72;
