import { readFileSync } from "node:fs";
import path from "node:path";
import { VISIBLE } from "./build-model.ts";
import type { AdvisoryView, PluginView, PublisherView, SiteData } from "./types.ts";

let cached: SiteData | null = null;

export function siteData(): SiteData {
  if (!cached) {
    const file = path.join(process.cwd(), ".hub", "site.json");
    try {
      cached = JSON.parse(readFileSync(file, "utf8")) as SiteData;
    } catch {
      throw new Error("Missing .hub/site.json. Run `node scripts/prepare-data.ts` (pnpm build and pnpm dev do this).");
    }
  }
  return cached;
}

export const PLACEHOLDER = "_";

export function listedPlugins(): PluginView[] {
  return siteData().plugins.filter((plugin) => VISIBLE.has(plugin.status));
}

export function findPlugin(id: string): PluginView | undefined {
  return siteData().plugins.find((plugin) => plugin.id === id);
}

export function findPublisher(name: string): PublisherView | undefined {
  return siteData().publishers.find((publisher) => publisher.name === name);
}

export function findAdvisory(id: number): AdvisoryView | undefined {
  return siteData().advisories.find((advisory) => advisory.id === id);
}

export function pluginsByIds(ids: readonly string[]): PluginView[] {
  const plugins = siteData().plugins;
  return ids.flatMap((id) => plugins.filter((plugin) => plugin.id === id));
}

export function orPlaceholder<T>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder];
}
