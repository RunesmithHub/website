import type { ModerationEntry, PluginRecord, PluginState, Publisher, VersionRecord, VersionState } from "./model.ts";
import { parseRange, parseVersion, satisfies } from "./semver.ts";

const VERSION_RANK: Readonly<Record<VersionState, number>> = {
  published: 0,
  yanked: 1,
  held: 2,
  review: 3,
  deleted: 4,
  frozen: 5,
  blocked: 6,
};

export type EffectivePluginState = PluginState;

function moreRestrictive(a: VersionState, b: VersionState): VersionState {
  return VERSION_RANK[b] > VERSION_RANK[a] ? b : a;
}

function fromPluginState(state: PluginState): VersionState {
  switch (state) {
    case "listed":
    case "deprecated":
      return "published";
    default:
      return state;
  }
}

function fromEntry(entry: ModerationEntry): VersionState {
  return entry.action === "block" ? "blocked" : "frozen";
}

export function entriesForPublisher(entries: readonly ModerationEntry[], publisher: string): ModerationEntry[] {
  return entries.filter((entry) => entry.target.kind === "publisher" && entry.target.publisher === publisher);
}

export function entriesForPlugin(entries: readonly ModerationEntry[], plugin: PluginRecord): ModerationEntry[] {
  return entries.filter(
    (entry) =>
      (entry.target.kind === "plugin" && entry.target.plugin === plugin.id) ||
      (entry.target.kind === "publisher" && entry.target.publisher === plugin.publisher),
  );
}

export function entryTargetsVersion(entry: ModerationEntry, plugin: PluginRecord, version: string): boolean {
  if (entry.target.kind !== "versions") {
    return entry.target.kind === "plugin" ? entry.target.plugin === plugin.id : entry.target.publisher === plugin.publisher;
  }
  if (entry.target.plugin !== plugin.id || !entry.target.range) {
    return false;
  }
  const range = parseRange(entry.target.range);
  const parsed = parseVersion(version);
  return range !== null && parsed !== null && satisfies(parsed, range, true);
}

export function effectivePluginState(
  plugin: PluginRecord,
  publisher: Publisher | undefined,
  entries: readonly ModerationEntry[],
): EffectivePluginState {
  let state: VersionState = fromPluginState(plugin.state);
  if (!publisher || publisher.state === "blocked") {
    state = "blocked";
  }
  for (const entry of entriesForPlugin(entries, plugin)) {
    state = moreRestrictive(state, fromEntry(entry));
  }
  if (state === "published") {
    return plugin.state === "deprecated" || plugin.deprecated ? "deprecated" : "listed";
  }
  return state === "blocked" || state === "frozen" || state === "deleted" ? state : "listed";
}

export function effectiveVersionState(
  plugin: PluginRecord,
  version: VersionRecord,
  publisher: Publisher | undefined,
  entries: readonly ModerationEntry[],
): VersionState {
  let state = moreRestrictive(version.state, fromPluginState(plugin.state));
  if (!publisher || publisher.state === "blocked") {
    state = "blocked";
  }
  for (const entry of entries) {
    if (entryTargetsVersion(entry, plugin, version.version)) {
      state = moreRestrictive(state, fromEntry(entry));
    }
  }
  return state;
}

export function isInstallable(state: VersionState): boolean {
  return state === "published" || state === "yanked";
}
