import { compareVersions, describeRange, minimumOf, parseRange, parseVersion, satisfies } from "../hub/semver.ts";

export function runsOn(rangeText: string, api: string, oldestApi: string): boolean {
  const range = parseRange(rangeText);
  const provided = parseVersion(api);
  const oldest = parseVersion(oldestApi);
  if (!range || !provided || !oldest) {
    return false;
  }
  const minimum = minimumOf(range);
  return satisfies(provided, range) && minimum !== null && compareVersions(minimum, oldest) >= 0;
}

export function apiRangeText(rangeText: string): string {
  const range = parseRange(rangeText);
  return range ? `Runesmith API ${describeRange(range)}` : `Runesmith API ${rangeText}`;
}
