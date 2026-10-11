import assert from "node:assert/strict";
import { test } from "node:test";
import type { MetaReference, ModerationEntry, PluginRecord, Tier, VerifiedIndex } from "../../src/lib/hub/model.ts";
import { parsePlugin } from "../../src/lib/hub/parse.ts";
import { buildSiteModel, searchDocuments, searchKeywords, type SiteModel } from "../../src/lib/site/build-model.ts";
import type { PluginView } from "../../src/lib/site/types.ts";

const SHA = "0".repeat(64);
const EXPIRES = "2030-01-01T00:00:00Z";
const META: MetaReference = { version: 1, sha256: SHA, length: 1 };
const DUTCH = { language: "nl", name: "Nederlands", englishName: "Dutch" };

interface Sample {
  readonly id: string;
  readonly name?: string;
  readonly tier?: Tier;
  readonly state?: string;
  readonly languages?: readonly string[];
  readonly languagePack?: object;
}

function record(sample: Sample): PluginRecord {
  const image = { url: "https://hub.example/icon.png", sha256: SHA, length: 1, width: 64, height: 64, format: "png" };
  return parsePlugin({
    type: "plugin",
    version: 1,
    id: sample.id,
    name: sample.name ?? sample.id,
    publisher: "acme",
    tier: sample.tier ?? "unverified",
    state: "listed",
    repository: { id: 1, url: `https://github.com/acme/${sample.id}` },
    summary: "A plugin.",
    icon: { "64": image, "128": image, "256": image },
    versions: [
      {
        version: "1.0.0",
        state: sample.state ?? "published",
        review: { state: "automated" },
        commit: "a".repeat(40),
        tag: "v1.0.0",
        releaseAuthor: { id: 2, login: "acme-dev" },
        contracts: { assembly: "A.Contracts.dll", sha256: SHA, package: "A.Contracts", packageVersion: "1.0.0" },
        runesmithApi: ">=0.1.0 <0.2.0",
        capabilities: {},
        analysis: { verdict: "passed" },
        build: { run: "local", sdk: "10.0.401", reproducible: true },
        publishedAt: "2026-10-01T00:00:00Z",
        summary: "A plugin.",
        name: sample.name ?? sample.id,
        ...(sample.languages ? { languages: sample.languages } : {}),
        ...(sample.languagePack ? { languagePack: sample.languagePack } : {}),
      },
    ],
  });
}

function model(samples: readonly Sample[], entries: readonly ModerationEntry[] = []): SiteModel {
  const index: VerifiedIndex = {
    root: {
      version: 1,
      expires: EXPIRES,
      keys: {},
      roles: { root: { keyids: [], threshold: 1 }, publish: { keyids: [], threshold: 1 }, moderation: { keyids: [], threshold: 1 }, timestamp: { keyids: [], threshold: 1 } },
    },
    timestamp: { version: 1, expires: EXPIRES, snapshot: META, moderation: META },
    snapshot: { version: 1, expires: EXPIRES, plugins: {}, publishers: META, policy: META },
    moderation: { version: 1, expires: EXPIRES, entries },
    plugins: samples.map(record),
    publishers: { version: 1, publishers: [{ name: "acme", displayName: "Acme", owner: { id: 1, login: "acme", type: "Organization" }, state: "active", verified: false }] },
    policy: { version: 1, categories: [], capabilities: {}, oldestRunesmith: null, mirrors: [], holdHours: 24, featured: [] },
  };
  return buildSiteModel({ index, installs: new Map(), image: () => null, avatar: () => null, runesmith: { apiVersions: ["0.1.1", "0.1.0"], oldestApi: "0.1.0" } });
}

function plugin(site: SiteModel, id: string): PluginView {
  const found = site.plugins.find((candidate) => candidate.id === id);
  assert.ok(found, `${id} is in the model`);
  return found;
}

const GIT: Sample = { id: "acme.git", name: "Git", languages: ["nl", "en", "de"] };
const GITHUB: Sample = { id: "acme.github", name: "GitHub" };
const PACK: Sample = { id: "acme.dutch", name: "Dutch Language Pack", languagePack: { ...DUTCH, targets: ["runesmith", "acme.github", "acme.git", "ghost.plugin"] } };

test("the index record carries the languages of a version and of a language pack, and both are optional", () => {
  const [plain, localized, pack, bare] = [GITHUB, GIT, PACK, { id: "acme.bare", languagePack: DUTCH }].map((sample) => record(sample).versions[0]);
  assert.equal(plain?.languages, undefined);
  assert.equal(plain?.languagePack, undefined);
  assert.deepEqual(localized?.languages, ["nl", "en", "de"]);
  assert.deepEqual(pack?.languagePack, { ...DUTCH, targets: ["runesmith", "acme.github", "acme.git", "ghost.plugin"] });
  assert.deepEqual(bare?.languagePack, { ...DUTCH, targets: [] });
  assert.throws(() => record({ id: "acme.broken", languagePack: { language: "nl" } }), /languagePack\.name is required/);
});

test("a version lists the languages of its translations with English first", () => {
  const git = plugin(model([GIT]), "acme.git");
  assert.deepEqual(git.versions[0]?.languages.map((language) => language.label), ["English", "Deutsch (German)", "Nederlands (Dutch)"]);
  assert.deepEqual(git.languages, git.versions[0]?.languages);
  assert.equal(git.languagePack, null);
});

test("a plugin that lists no languages has none", () => {
  const site = model([GITHUB]);
  const github = plugin(site, "acme.github");
  assert.deepEqual(github.versions[0]?.languages, []);
  assert.equal(github.versions[0]?.languagePack, null);
  assert.deepEqual(github.translations, []);
  assert.deepEqual(site.languages, []);
  assert.deepEqual(searchDocuments(site.plugins).map((document) => [document.languages, document.languagePack]), [[[], false]]);
});

test("a language pack names its language as it declares and links the plugins it translates", () => {
  const declared = { language: "nl", name: "Hollands", englishName: "Hollandic", targets: ["runesmith", "acme.github", "ghost.plugin"] };
  const pack = plugin(model([GITHUB, { ...PACK, languagePack: declared }]), "acme.dutch").versions[0];
  assert.equal(pack?.languagePack?.language.label, "Hollands (Hollandic)");
  assert.deepEqual(pack?.languagePack?.targets, [
    { id: "runesmith", name: "Runesmith", href: null },
    { id: "acme.github", name: "GitHub", href: "/plugins/acme.github" },
    { id: "ghost.plugin", name: "ghost.plugin", href: null },
  ]);
  assert.deepEqual(pack?.languages, []);
});

test("a plugin a language pack translates is also available in its language, unless it carries that language itself", () => {
  const site = model([GIT, GITHUB, PACK]);
  const [translation] = plugin(site, "acme.github").translations;
  assert.equal(plugin(site, "acme.github").translations.length, 1);
  assert.equal(translation?.language.label, "Nederlands (Dutch)");
  assert.deepEqual(translation?.packs.map((pack) => [pack.id, pack.name]), [["acme.dutch", "Dutch Language Pack"]]);
  assert.deepEqual(plugin(site, "acme.git").translations, []);
  assert.deepEqual(plugin(site, "acme.dutch").translations, []);
});

test("the official language pack of a language comes first", () => {
  const official: Sample = { id: "acme.nederlands", name: "Nederlands", tier: "official", languagePack: { ...DUTCH, targets: ["acme.github"] } };
  const [translation] = plugin(model([GITHUB, PACK, official]), "acme.github").translations;
  assert.deepEqual(translation?.packs.map((pack) => pack.id), ["acme.nederlands", "acme.dutch"]);
});

test("a language pack that cannot be installed adds no language", () => {
  const frozen: ModerationEntry = { id: 1, target: { kind: "plugin", plugin: "acme.dutch" }, action: "freeze", reason: "broken", note: "", createdAt: "2026-10-02T00:00:00Z" };
  assert.deepEqual(plugin(model([GITHUB, PACK], [frozen]), "acme.github").translations, []);
  assert.deepEqual(plugin(model([GITHUB, { ...PACK, state: "review" }]), "acme.github").translations, []);
});

test("search knows the languages a plugin can be used in and which plugins are language packs", () => {
  const site = model([GIT, GITHUB, PACK, { id: "acme.plain" }]);
  const documents = new Map(searchDocuments(site.plugins).map((document) => [document.id, document]));
  assert.deepEqual(documents.get("acme.git")?.languages, ["en", "de", "nl"]);
  assert.deepEqual(documents.get("acme.github")?.languages, ["nl"]);
  assert.deepEqual(documents.get("acme.dutch")?.languages, ["nl"]);
  assert.deepEqual(documents.get("acme.plain")?.languages, []);
  assert.deepEqual([...documents.values()].filter((document) => document.languagePack).map((document) => document.id), ["acme.dutch"]);
  assert.deepEqual(site.languages.map((language) => language.label), ["Deutsch (German)", "Nederlands (Dutch)"]);
});

test("search finds a language pack by the names of its language", () => {
  const site = model([GIT, PACK]);
  assert.deepEqual(searchKeywords(plugin(site, "acme.dutch")), ["language pack", "Nederlands", "Dutch"]);
  assert.deepEqual(searchKeywords(plugin(site, "acme.git")), []);
});

test("a language the runtime cannot name takes the names its language pack declares", () => {
  const klingon = { id: "acme.klingon", languagePack: { language: "qaa", name: "tlhIngan Hol", englishName: "Klingon", targets: ["acme.github"] } };
  const site = model([GITHUB, klingon]);
  assert.deepEqual(site.languages.map((language) => language.label), ["tlhIngan Hol (Klingon)"]);
  assert.equal(plugin(site, "acme.github").translations[0]?.language.name, "tlhIngan Hol");
});
