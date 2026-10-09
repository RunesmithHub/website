import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { RUNESMITH } from "../src/config/runesmith.ts";
import { DirectorySource, HttpSource, type IndexSource } from "../src/lib/hub/source.ts";
import { loadVerifiedIndex } from "../src/lib/hub/verify.ts";
import type { VerifiedIndex } from "../src/lib/hub/model.ts";
import { buildSiteModel, categoriesOf, searchDocuments, VISIBLE } from "../src/lib/site/build-model.ts";
import { buildTerms } from "../src/lib/search/terms.ts";
import type { PluginView, SiteData } from "../src/lib/site/types.ts";
import { AssetStore, downloadAvatar } from "./lib/assets.ts";
import { readConfig, type BuildConfig } from "./lib/config.ts";
import { readInstallCounts } from "./lib/stats.ts";

const config = readConfig();
const dataDir = path.join(config.dataRoot, ".hub");
const publicDir = path.join(config.dataRoot, "public", "hub");

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value)}\n`);
}

function unavailable(reason: string): SiteData {
  return {
    status: { available: false, reason, verifiedAt: new Date().toISOString(), timestampExpires: null, snapshotVersion: null, rootVersion: null },
    siteUrl: config.siteUrl,
    indexUrl: config.indexUrl,
    indexOrigin: null,
    dashboardUrl: null,
    securityEmail: config.securityEmail,
    holdHours: 24,
    categories: [],
    capabilities: [],
    plugins: [],
    publishers: [],
    advisories: [],
    featured: [],
  };
}

function featured(index: VerifiedIndex, plugins: readonly PluginView[]): string[] {
  const visible = plugins.filter((plugin) => VISIBLE.has(plugin.status) && plugin.banner);
  const chosen = index.policy.featured.filter((id) => visible.some((plugin) => plugin.id === id));
  if (chosen.length > 0) {
    return chosen;
  }
  return [...visible].sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).slice(0, 3).map((plugin) => plugin.id);
}

async function available(settings: BuildConfig, trustedRootPath: string): Promise<SiteData> {
  const source: IndexSource = settings.indexDir ? new DirectorySource(settings.indexDir) : new HttpSource(settings.indexUrl);
  const remote = settings.indexDir === null;
  console.log(`Verifying the index from ${source.description}`);
  const index = await loadVerifiedIndex({ source, trustedRoot: new Uint8Array(await readFile(trustedRootPath)), now: new Date() });

  const imageDir = path.join(publicDir, "img");
  await mkdir(imageDir, { recursive: true });
  const assets = new AssetStore(source, imageDir, "/hub/img", remote);
  const preview = buildSiteModel({ index, installs: new Map(), image: () => null, avatar: () => null, runesmith: RUNESMITH });
  for (const plugin of index.plugins) {
    const view = preview.plugins.find((candidate) => candidate.id === plugin.id);
    if (!view || !VISIBLE.has(view.status)) {
      continue;
    }
    const refs = [plugin.icon["64"], plugin.icon["128"], plugin.icon["256"]];
    if (plugin.banner) {
      refs.push(plugin.banner.small, plugin.banner.large);
    }
    plugin.gallery.forEach((item) => refs.push(item.small, item.large));
    for (const ref of refs) {
      await assets.add(ref);
    }
  }

  const avatars = new Map<string, string>();
  if (remote) {
    for (const publisher of index.publishers.publishers) {
      const avatar = publisher.state === "blocked" ? null : await downloadAvatar(publisher, path.join(publicDir, "avatars"), "/hub/avatars");
      if (avatar) {
        avatars.set(publisher.name, avatar);
      }
    }
  }

  const model = buildSiteModel({
    index,
    installs: await readInstallCounts(source),
    image: (ref) => assets.get(ref),
    avatar: (publisher) => avatars.get(publisher.name) ?? null,
    runesmith: RUNESMITH,
  });

  const documents = searchDocuments(model.plugins);
  const keywords = new Map(model.plugins.map((plugin) => [plugin.id, plugin.keywords]));
  await writeJson(
    path.join(publicDir, "search", "terms.json"),
    buildTerms(documents.map((document) => ({ document, keywords: keywords.get(document.id) ?? [] }))),
  );

  let dashboardUrl: string | null = new URL("dashboard.json", source.baseUrl).href;
  if (!remote) {
    const dashboard = await source.read("dashboard.json", 1024 * 1024);
    dashboardUrl = dashboard ? "/hub/dashboard.json" : null;
    if (dashboard) {
      await writeFile(path.join(publicDir, "dashboard.json"), dashboard);
    }
  }

  return {
    status: {
      available: true,
      reason: null,
      verifiedAt: new Date().toISOString(),
      timestampExpires: index.timestamp.expires,
      snapshotVersion: index.snapshot.version,
      rootVersion: index.root.version,
    },
    siteUrl: settings.siteUrl,
    indexUrl: remote ? source.baseUrl.href : settings.indexUrl,
    indexOrigin: remote ? source.baseUrl.origin : null,
    dashboardUrl,
    securityEmail: settings.securityEmail,
    holdHours: index.policy.holdHours,
    categories: categoriesOf(index.policy.categories, model.plugins),
    capabilities: Object.entries(index.policy.capabilities).map(([id, value]) => ({ id, label: value.label })),
    plugins: model.plugins,
    publishers: model.publishers,
    advisories: model.advisories,
    featured: featured(index, model.plugins),
  };
}

async function main(): Promise<void> {
  await rm(publicDir, { recursive: true, force: true });
  await mkdir(publicDir, { recursive: true });
  let data: SiteData;
  if (!config.trustedRootPath) {
    if (config.indexConfigured) {
      throw new Error("An index is configured but there is no trusted root (trust/root.json or HUB_TRUST_ROOT).");
    }
    console.log("No trusted root and no index configured: building the site without plugin data.");
    data = unavailable("The plugin index is not available yet.");
  } else {
    data = await available(config, config.trustedRootPath);
    const visible = data.plugins.filter((plugin) => VISIBLE.has(plugin.status)).length;
    console.log(`Verified: root ${data.status.rootVersion}, snapshot ${data.status.snapshotVersion}, ${visible} listed plugins.`);
  }
  await writeJson(path.join(dataDir, "site.json"), data);
}

main().catch((error: unknown) => {
  console.error(`The index could not be verified, so the site was not built.\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
