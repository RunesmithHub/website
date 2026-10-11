"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PluginIcon } from "@/components/hub/plugin-icon";
import { StateBadge } from "@/components/hub/state-badge";
import { TierBadge } from "@/components/hub/tier-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { compareResults, score, type SortOrder } from "@/lib/search/score";
import {
  ANY_API,
  EMPTY_STATE,
  languageOptions,
  matchesFilters,
  readState,
  selectedApi,
  selectedLanguage,
  writeState,
  type SearchState,
} from "@/lib/search/state";
import { formatCount, formatDate } from "@/lib/site/format";
import { CAPABILITY_FILTERS, PLATFORM_LABELS, TIER_LABELS } from "@/lib/site/labels";
import type { CategoryView, LanguageView, SearchDocument, SearchTerms, Tier } from "@/lib/site/types";

const ALL = "all";
const ANY_LANGUAGE = "";
const SORT_LABELS: Readonly<Record<SortOrder, string>> = {
  relevance: "Relevance",
  installs: "Most installed",
  updated: "Recently updated",
  name: "Name",
};

interface SearchViewProps {
  readonly documents: readonly SearchDocument[];
  readonly categories: readonly CategoryView[];
  readonly apiVersions: readonly string[];
  readonly languages: readonly LanguageView[];
  readonly fixedCategory?: string;
}

function useSearchState(): [SearchState, (next: SearchState, push: boolean) => void] {
  const [state, setState] = useState<SearchState>(EMPTY_STATE);
  useEffect(() => {
    const sync = (): void => setState(readState(window.location.search));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const update = useCallback((next: SearchState, push: boolean) => {
    setState(next);
    const url = `${window.location.pathname}${writeState(next)}`;
    if (push) {
      window.history.pushState(null, "", url);
    } else {
      window.history.replaceState(null, "", url);
    }
  }, []);
  return [state, update];
}

function useTerms(active: boolean): SearchTerms | null {
  const [terms, setTerms] = useState<SearchTerms | null>(null);
  useEffect(() => {
    if (!active || terms) {
      return;
    }
    let cancelled = false;
    fetch("/hub/search/terms.json")
      .then((response) => (response.ok ? (response.json() as Promise<SearchTerms>) : null))
      .then((loaded) => {
        if (!cancelled && loaded) {
          setTerms(loaded);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [active, terms]);
  return terms;
}

function toggle<T>(values: readonly T[], value: T, on: boolean): T[] {
  return on ? [...values.filter((item) => item !== value), value] : values.filter((item) => item !== value);
}

function FilterHeading({ children }: { children: string }) {
  return <h3 className="text-subtle-foreground mt-4 mb-1.5 text-[11.5px] font-semibold tracking-wide uppercase">{children}</h3>;
}

function CheckRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="my-1.5 flex items-start gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <label htmlFor={id} className="text-muted-foreground cursor-pointer text-[13px]">
        {label}
      </label>
    </div>
  );
}

function Result({ document, latestApi }: { document: SearchDocument; latestApi: string }) {
  return (
    <li className="hover:bg-hover relative flex gap-3.5 border-b px-1 py-3.5">
      <PluginIcon name={document.name} image={document.icon ? { src: document.icon, width: 64, height: 64 } : null} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="m-0 text-sm font-semibold">
            <Link href={`/plugins/${document.id}`} className="text-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary">
              {document.name}
            </Link>
          </h2>
          <span className="relative z-10">
            <TierBadge tier={document.tier} />
          </span>
          {document.status === "frozen" && <StateBadge state="frozen" />}
          {document.status === "deprecated" && <StateBadge state="deprecated" />}
          <span className="text-subtle-foreground font-mono text-xs">{document.id}</span>
        </div>
        <p className="text-muted-foreground m-0 text-[13px]">{document.summary}</p>
        <p className="text-subtle-foreground mt-1 mb-0 flex flex-wrap gap-x-3 text-xs">
          <span>{document.publisherName}</span>
          <span>{formatCount(document.installs)} installs</span>
          {document.updatedAt && <span>Updated {formatDate(document.updatedAt)}</span>}
          {document.languagePack && <span>Language pack</span>}
          {!document.apis.includes(latestApi) && <span>Not for plugin API {latestApi}</span>}
        </p>
      </div>
    </li>
  );
}

export function SearchView({ documents, categories, apiVersions, languages, fixedCategory }: SearchViewProps) {
  const [state, update] = useSearchState();
  const latestApi = apiVersions[0] ?? "";
  const api = selectedApi(state, apiVersions);
  const terms = useTerms(state.query.trim().length > 0);
  const categoryName = fixedCategory ?? categories.find((category) => category.slug === state.category)?.name ?? null;
  const languageChoices = useMemo(() => languageOptions(documents, languages), [documents, languages]);
  const language = selectedLanguage(state, languageChoices);
  const hasLanguagePacks = documents.some((document) => document.languagePack);
  const results = useMemo(() => {
    const scores = score(documents, terms, state.query);
    return documents
      .filter((document) => scores.has(document.id) && matchesFilters(document, state, categoryName, api, language))
      .sort(compareResults(state.sort, scores));
  }, [documents, terms, state, categoryName, api, language]);
  const set = (patch: Partial<SearchState>, push = true): void => update({ ...state, ...patch }, push);
  const filtered = writeState({ ...state, query: "", sort: "relevance" }) !== "";

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside aria-label="Filters">
        <FilterHeading>Tier</FilterHeading>
        {(Object.keys(TIER_LABELS) as Tier[]).map((tier) => (
          <CheckRow
            key={tier}
            id={`tier-${tier}`}
            label={TIER_LABELS[tier]}
            checked={state.tiers.includes(tier)}
            onChange={(on) => set({ tiers: toggle(state.tiers, tier, on) })}
          />
        ))}
        {!fixedCategory && (
          <>
            <FilterHeading>Category</FilterHeading>
            <Select aria-label="Category" value={state.category || ALL} onChange={(event) => set({ category: event.target.value === ALL ? "" : event.target.value })}>
              <option value={ALL}>All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </>
        )}
        <FilterHeading>Compatibility</FilterHeading>
        <Select
          aria-label="Works with plugin API"
          value={api ?? ANY_API}
          onChange={(event) => set({ api: event.target.value === latestApi ? "" : event.target.value })}
        >
          {apiVersions.map((version) => (
            <option key={version} value={version}>
              {version === latestApi ? `Plugin API ${version} (latest)` : `Plugin API ${version}`}
            </option>
          ))}
          <option value={ANY_API}>Any plugin API</option>
        </Select>
        <FilterHeading>Capabilities</FilterHeading>
        {CAPABILITY_FILTERS.map((capability) => (
          <CheckRow
            key={capability.id}
            id={`without-${capability.id}`}
            label={capability.label}
            checked={state.without.includes(capability.id)}
            onChange={(on) => set({ without: toggle(state.without, capability.id, on) })}
          />
        ))}
        <FilterHeading>Platform</FilterHeading>
        <Select aria-label="Platform" value={state.platform || ALL} onChange={(event) => set({ platform: event.target.value === ALL ? "" : event.target.value })}>
          <option value={ALL}>Any platform</option>
          {Object.entries(PLATFORM_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        {(languageChoices.length > 0 || hasLanguagePacks) && <FilterHeading>Language</FilterHeading>}
        {languageChoices.length > 0 && (
          <Select aria-label="Language" value={language ?? ANY_LANGUAGE} onChange={(event) => set({ language: event.target.value })}>
            <option value={ANY_LANGUAGE}>Any language</option>
            {languageChoices.map((choice) => (
              <option key={choice.tag} value={choice.tag}>
                {choice.label}
              </option>
            ))}
          </Select>
        )}
        {hasLanguagePacks && (
          <CheckRow id="type-language-pack" label="Language packs only" checked={state.languagePacks} onChange={(on) => set({ languagePacks: on })} />
        )}
        {filtered && (
          <Button variant="link" className="mt-4 text-xs" onClick={() => update({ ...EMPTY_STATE, query: state.query, sort: state.sort }, true)}>
            Clear filters
          </Button>
        )}
      </aside>

      <section aria-label="Results">
        <div className="flex flex-wrap gap-2.5">
          <div role="search" className="relative min-w-[220px] flex-1">
            <SearchIcon className="text-subtle-foreground pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2" aria-hidden />
            <Input
              type="search"
              aria-label="Search plugins"
              placeholder="Search plugins"
              data-search-input="page"
              className="pl-8"
              value={state.query}
              onChange={(event) => set({ query: event.target.value }, false)}
            />
          </div>
          <Select aria-label="Sort by" wrapperClassName="w-[170px]" value={state.sort} onChange={(event) => set({ sort: event.target.value as SortOrder })}>
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((order) => (
              <option key={order} value={order}>
                {SORT_LABELS[order]}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-subtle-foreground mt-3 mb-1 text-[12.5px]" aria-live="polite" data-testid="result-count">
          {results.length === 1 ? "1 plugin" : `${results.length} plugins`}
        </p>
        {results.length > 0 ? (
          <ul className="m-0 list-none p-0" data-testid="results">
            {results.map((document) => (
              <Result key={document.id} document={document} latestApi={latestApi} />
            ))}
          </ul>
        ) : (
          <p className="text-subtle-foreground">No plugins match. Try fewer filters.</p>
        )}
      </section>
    </div>
  );
}
