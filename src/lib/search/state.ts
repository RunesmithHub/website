import type { SortOrder } from "./score.ts";
import type { SearchDocument, Tier } from "../site/types.ts";

export interface SearchState {
  readonly query: string;
  readonly tiers: readonly Tier[];
  readonly category: string;
  readonly api: string;
  readonly without: readonly string[];
  readonly platform: string;
  readonly sort: SortOrder;
}

export const EMPTY_STATE: SearchState = { query: "", tiers: [], category: "", api: "", without: [], platform: "", sort: "relevance" };

const TIERS: readonly Tier[] = ["official", "verified", "unverified"];
const SORTS: readonly SortOrder[] = ["relevance", "installs", "updated", "name"];

export const ANY_API = "any";

function list(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? "").split(",").filter(Boolean);
}

export function readState(search: string): SearchState {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") as SortOrder | null;
  return {
    query: params.get("q") ?? "",
    tiers: list(params, "tier").filter((tier): tier is Tier => (TIERS as readonly string[]).includes(tier)),
    category: params.get("category") ?? "",
    api: params.get("api") ?? "",
    without: list(params, "without"),
    platform: params.get("platform") ?? "",
    sort: sort && SORTS.includes(sort) ? sort : "relevance",
  };
}

export function writeState(state: SearchState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.tiers.length) params.set("tier", state.tiers.join(","));
  if (state.category) params.set("category", state.category);
  if (state.api) params.set("api", state.api);
  if (state.without.length) params.set("without", state.without.join(","));
  if (state.platform) params.set("platform", state.platform);
  if (state.sort !== "relevance") params.set("sort", state.sort);
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** The API version to filter by: unknown or empty values mean the latest, null means any. */
export function selectedApi(state: SearchState, apiVersions: readonly string[]): string | null {
  if (state.api === ANY_API) {
    return null;
  }
  return apiVersions.includes(state.api) ? state.api : (apiVersions[0] ?? null);
}

export function matchesFilters(document: SearchDocument, state: SearchState, categoryName: string | null, api: string | null): boolean {
  return (
    (state.tiers.length === 0 || state.tiers.includes(document.tier)) &&
    (!categoryName || document.categories.includes(categoryName)) &&
    (api === null || document.apis.includes(api)) &&
    state.without.every((capability) => !document.capabilities.includes(capability)) &&
    (!state.platform || document.platforms.length === 0 || document.platforms.includes(state.platform))
  );
}
