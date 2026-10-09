export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly (string | number)[];
}

export type Operator = "<" | "<=" | ">" | ">=" | "=";

export interface Comparator {
  readonly operator: Operator;
  readonly version: Version;
}

export type Range = readonly (readonly Comparator[])[];

const NUMBER = "0|[1-9]\\d*";
const IDENTIFIER = `(?:${NUMBER}|\\d*[a-zA-Z-][0-9a-zA-Z-]*)`;
const VERSION = new RegExp(`^(${NUMBER})\\.(${NUMBER})\\.(${NUMBER})(?:-(${IDENTIFIER}(?:\\.${IDENTIFIER})*))?$`);
const PARTIAL = new RegExp(`^(${NUMBER})(?:\\.(${NUMBER}))?$`);
const COMPARATOR = /^(\^|~|>=|<=|>|<|=)?(.+)$/;

export function parseVersion(text: string): Version | null {
  const match = VERSION.exec(text);
  if (!match) {
    return null;
  }
  const [major, minor, patch] = [match[1], match[2], match[3]].map(Number) as [number, number, number];
  if (![major, minor, patch].every(Number.isSafeInteger)) {
    return null;
  }
  const prerelease = match[4] ? match[4].split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part)) : [];
  return { major, minor, patch, prerelease };
}

export function formatVersion(version: Version): string {
  const core = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease.length ? `${core}-${version.prerelease.join(".")}` : core;
}

export function compareVersions(a: Version, b: Version): number {
  const core = a.major - b.major || a.minor - b.minor || a.patch - b.patch;
  if (core !== 0) {
    return Math.sign(core);
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return Math.sign(b.prerelease.length - a.prerelease.length);
  }
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index++) {
    const left = a.prerelease[index];
    const right = b.prerelease[index];
    if (left === undefined || right === undefined) {
      return left === undefined ? -1 : 1;
    }
    if (left === right) {
      continue;
    }
    if (typeof left === "number" && typeof right === "number") {
      return Math.sign(left - right);
    }
    if (typeof left === "number" || typeof right === "number") {
      return typeof left === "number" ? -1 : 1;
    }
    return left < right ? -1 : 1;
  }
  return 0;
}

export function compareVersionText(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) {
    return a.localeCompare(b);
  }
  return compareVersions(left, right);
}

function release(major: number, minor: number, patch: number): Version {
  return { major, minor, patch, prerelease: [] };
}

function parsePartial(text: string): Version | null {
  const full = parseVersion(text);
  if (full) {
    return full;
  }
  const match = PARTIAL.exec(text);
  return match ? release(Number(match[1]), Number(match[2] ?? 0), 0) : null;
}

function caret(version: Version): Comparator[] {
  const upper =
    version.major > 0
      ? release(version.major + 1, 0, 0)
      : version.minor > 0
        ? release(0, version.minor + 1, 0)
        : release(0, 0, version.patch + 1);
  return [{ operator: ">=", version }, { operator: "<", version: upper }];
}

function tilde(version: Version): Comparator[] {
  return [{ operator: ">=", version }, { operator: "<", version: release(version.major, version.minor + 1, 0) }];
}

function parseComparator(text: string): Comparator[] | null {
  const match = COMPARATOR.exec(text);
  if (!match) {
    return null;
  }
  const operator = match[1];
  const body = match[2] ?? "";
  const allowsPartial = operator === "^" || operator === "~" || operator === ">=";
  const version = allowsPartial ? parsePartial(body) : parseVersion(body);
  if (!version) {
    return null;
  }
  switch (operator) {
    case "^":
      return caret(version);
    case "~":
      return tilde(version);
    case undefined:
      return [{ operator: "=", version }];
    default:
      return [{ operator: operator as Operator, version }];
  }
}

export function parseRange(text: string): Range | null {
  if (text.trim() !== text || text.length === 0) {
    return null;
  }
  const sets: Comparator[][] = [];
  for (const setText of text.split(/ ?\|\| ?/)) {
    const parts = setText.split(" ");
    const set: Comparator[] = [];
    for (const part of parts) {
      const comparators = part.length > 0 ? parseComparator(part) : null;
      if (!comparators) {
        return null;
      }
      set.push(...comparators);
    }
    sets.push(set);
  }
  return sets;
}

function test(comparator: Comparator, version: Version): boolean {
  const order = compareVersions(version, comparator.version);
  switch (comparator.operator) {
    case "<":
      return order < 0;
    case "<=":
      return order <= 0;
    case ">":
      return order > 0;
    case ">=":
      return order >= 0;
    case "=":
      return order === 0;
  }
}

function sameCore(a: Version, b: Version): boolean {
  return a.major === b.major && a.minor === b.minor && a.patch === b.patch;
}

export function satisfies(version: Version, range: Range, includePrerelease = false): boolean {
  return range.some((set) => {
    if (!set.every((comparator) => test(comparator, version))) {
      return false;
    }
    if (version.prerelease.length === 0 || includePrerelease) {
      return true;
    }
    return set.some((comparator) => comparator.version.prerelease.length > 0 && sameCore(comparator.version, version));
  });
}

export function minimumOf(range: Range): Version | null {
  let lowest: Version | null = null;
  for (const set of range) {
    const lowers = set.filter((c) => c.operator === ">=" || c.operator === ">" || c.operator === "=").map((c) => c.version);
    if (lowers.length === 0) {
      return null;
    }
    const lower = lowers.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b));
    if (!lowest || compareVersions(lower, lowest) < 0) {
      lowest = lower;
    }
  }
  return lowest;
}

export function compatibilityLine(version: Version): string {
  if (version.major >= 1) {
    return `${version.major}`;
  }
  return version.minor >= 1 ? `0.${version.minor}` : `0.0.${version.patch}`;
}

export function describeRange(range: Range): string {
  return range
    .map((set) => {
      const [lower, upper] = set;
      if (set.length === 2 && lower?.operator === ">=" && upper?.operator === "<") {
        return `${formatVersion(lower.version)} to below ${formatVersion(upper.version)}`;
      }
      return set.map((comparator) => describeComparator(comparator)).join(" and ");
    })
    .join(", or ");
}

function describeComparator(comparator: Comparator): string {
  const version = formatVersion(comparator.version);
  switch (comparator.operator) {
    case ">=":
      return `${version} or later`;
    case ">":
      return `later than ${version}`;
    case "<":
      return `below ${version}`;
    case "<=":
      return `up to ${version}`;
    case "=":
      return `exactly ${version}`;
  }
}
