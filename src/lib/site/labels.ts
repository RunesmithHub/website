import type { ModerationReason, Tier, VersionState } from "./types.ts";

export const REASON_LABELS: Readonly<Record<ModerationReason, string>> = {
  malicious: "Malicious",
  "compromised-account": "Compromised account",
  vulnerability: "Vulnerability",
  broken: "Broken",
  policy: "Policy",
  legal: "Legal",
  "developer-request": "At the developer's request",
};

export const TIER_LABELS: Readonly<Record<Tier, string>> = {
  official: "Official",
  verified: "Verified",
  unverified: "Unverified",
};

export const TIER_DESCRIPTIONS: Readonly<Record<Tier, string>> = {
  official: "Published by Runesmith. Every version is reviewed.",
  verified: "A verified publisher. Every version is reviewed by Runesmith before you get it.",
  unverified: "Checked automatically. No person at Runesmith has read this code.",
};

export const VERSION_STATE_LABELS: Readonly<Record<VersionState, string>> = {
  published: "Published",
  review: "In review",
  held: "Held",
  yanked: "Yanked",
  frozen: "Installs paused",
  blocked: "Blocked",
  deleted: "Deleted",
};

export const PLATFORM_LABELS: Readonly<Record<string, string>> = {
  windows: "Windows",
  linux: "Linux",
  macos: "macOS",
};

export const HIGH_RISK_CAPABILITIES: ReadonlySet<string> = new Set(["native", "dynamic-code", "credentials", "process"]);

export const CAPABILITY_FILTERS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "network", label: "No network access" },
  { id: "process", label: "No external programs" },
  { id: "filesystem", label: "No files outside the project" },
  { id: "credentials", label: "No passwords or tokens" },
  { id: "native", label: "No native code" },
  { id: "dynamic-code", label: "No code loaded at run time" },
];

export function platformsText(platforms: readonly string[]): string {
  return platforms.length === 0 ? "Windows, Linux, macOS" : platforms.map((platform) => PLATFORM_LABELS[platform] ?? platform).join(", ");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
