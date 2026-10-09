import type { SearchDocument, SearchTerms } from "../site/types.ts";

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9#+]+/)
    .filter((token) => token.length >= 2);
}

export interface TermSource {
  readonly document: SearchDocument;
  readonly keywords: readonly string[];
}

const WEIGHTS = { keywords: 4, categories: 3, publisher: 2, summary: 2 } as const;

export function buildTerms(sources: readonly TermSource[]): SearchTerms {
  const terms: Record<string, [number, number][]> = {};
  sources.forEach(({ document, keywords }, index) => {
    const best = new Map<string, number>();
    const add = (text: string, weight: number): void => {
      for (const token of tokenize(text)) {
        best.set(token, Math.max(best.get(token) ?? 0, weight));
      }
    };
    keywords.forEach((keyword) => add(keyword, WEIGHTS.keywords));
    document.categories.forEach((category) => add(category, WEIGHTS.categories));
    add(`${document.publisher} ${document.publisherName}`, WEIGHTS.publisher);
    add(document.summary, WEIGHTS.summary);
    for (const [token, weight] of best) {
      (terms[token] ??= []).push([index, weight]);
    }
  });
  return { terms };
}
