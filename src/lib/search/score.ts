import type { SearchDocument, SearchTerms, Tier } from "../site/types.ts";
import { tokenize } from "./terms.ts";

const TIER_RANK: Readonly<Record<Tier, number>> = { official: 0, verified: 1, unverified: 2 };

export type SortOrder = "relevance" | "installs" | "updated" | "name";

export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

function nameScore(document: SearchDocument, query: string, token: string): number {
  const name = document.name.toLowerCase();
  if (name === query) {
    return 500;
  }
  const words = tokenize(name);
  if (words.some((word) => word.startsWith(token))) {
    return 120;
  }
  if (name.includes(token)) {
    return 80;
  }
  if (token.length >= 4 && words.some((word) => editDistance(word.slice(0, token.length + 1), token) <= 1 || editDistance(word, token) <= 1)) {
    return 50;
  }
  return 0;
}

function termScore(terms: SearchTerms | null, index: number, token: string): number {
  if (!terms) {
    return 0;
  }
  let best = 0;
  for (const [term, postings] of Object.entries(terms.terms)) {
    if (term === token || (token.length >= 3 && term.startsWith(token))) {
      const posting = postings.find(([document]) => document === index);
      if (posting) {
        best = Math.max(best, posting[1] * (term === token ? 10 : 7));
      }
    }
  }
  return best;
}

export function score(documents: readonly SearchDocument[], terms: SearchTerms | null, query: string): Map<string, number> {
  const normalized = query.trim().toLowerCase();
  const scores = new Map<string, number>();
  if (!normalized) {
    documents.forEach((document) => scores.set(document.id, 0));
    return scores;
  }
  const tokens = tokenize(normalized);
  documents.forEach((document, index) => {
    if (document.id === normalized) {
      scores.set(document.id, 1000);
      return;
    }
    let total = 0;
    for (const token of tokens.length ? tokens : [normalized]) {
      const best = Math.max(nameScore(document, normalized, token), termScore(terms, index, token), document.id.includes(token) ? 60 : 0);
      if (best === 0) {
        return;
      }
      total += best;
    }
    scores.set(document.id, total);
  });
  return scores;
}

export function compareResults(order: SortOrder, scores: ReadonlyMap<string, number>): (a: SearchDocument, b: SearchDocument) => number {
  return (a, b) => {
    switch (order) {
      case "installs":
        return b.installs - a.installs;
      case "updated":
        return b.updatedAt.localeCompare(a.updatedAt);
      case "name":
        return a.name.localeCompare(b.name);
      case "relevance":
        return (
          Number(a.status === "deprecated") - Number(b.status === "deprecated") ||
          (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
          TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
          b.installs - a.installs ||
          b.updatedAt.localeCompare(a.updatedAt)
        );
    }
  };
}
