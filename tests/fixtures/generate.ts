import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Hex, utf8 } from "../../src/lib/hub/bytes.ts";
import { compareVersionText } from "../../src/lib/hub/semver.ts";
import { API, CAPABILITY_LABELS, CATEGORIES, FEATURED, PLUGINS, PUBLISHERS, type SamplePlugin, type SampleVersion } from "./samples.ts";
import { generateKey, keyEntry, pem, signEnvelope, type FixtureKey } from "./signing.ts";

export type Tamper = "none" | "signature" | "hash" | "expired-timestamp" | "root-threshold";

export interface FixtureOptions {
  readonly now?: Date;
  readonly tamper?: Tamper;
}

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const DAY = 86_400_000;
const PACKAGES = "https://github.com/RunesmithHub/packages/releases/download";

function iso(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

function owner(name: string): number {
  return 41_000_000 + [...name].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) % 9_000_000;
}

interface Keys {
  readonly rootV1: readonly FixtureKey[];
  readonly rootV2: readonly FixtureKey[];
  readonly publish: FixtureKey;
  readonly moderation: FixtureKey;
  readonly timestampV1: FixtureKey;
  readonly timestamp: FixtureKey;
}

class Writer {
  readonly index: string;

  constructor(index: string) {
    this.index = index;
  }

  async write(relative: string, bytes: Uint8Array): Promise<void> {
    const file = path.join(this.index, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  async pinned(folder: string, bytes: Uint8Array, version: number): Promise<{ version: number; sha256: string; length: number }> {
    const sha256 = await sha256Hex(bytes);
    await this.write(`${folder}/${sha256}.json`, bytes);
    return { version, sha256, length: bytes.length };
  }

  async image(name: string, width: number, height: number): Promise<object> {
    const bytes = new Uint8Array(await readFile(path.join(ASSETS, name)));
    const format = name.endsWith(".png") ? "png" : "webp";
    const sha256 = await sha256Hex(bytes);
    await this.write(`assets/${sha256}.${format}`, bytes);
    return { url: `http://localhost:8080/assets/${sha256}.${format}`, sha256, length: bytes.length, width, height, format };
  }
}

function rootPayload(version: number, roots: readonly FixtureKey[], keys: Keys, timestamp: FixtureKey, expires: string): object {
  const all = [...roots, keys.publish, keys.moderation, timestamp];
  return {
    specVersion: 1,
    type: "root",
    version,
    expires,
    keys: Object.fromEntries(all.map((key) => [key.keyid, keyEntry(key)])),
    roles: {
      root: { keyids: roots.map((key) => key.keyid), threshold: 2 },
      publish: { keyids: [keys.publish.keyid], threshold: 1 },
      moderation: { keyids: [keys.moderation.keyid], threshold: 1 },
      timestamp: { keyids: [timestamp.keyid], threshold: 1 },
    },
  };
}

function download(id: string, version: string, file: string, length: number): object {
  return { urls: [`${PACKAGES}/${id}-${version}/${file}`], sha256: "0".repeat(48) + length.toString(16).padStart(16, "0"), length };
}

function versionRecord(plugin: SamplePlugin, sample: SampleVersion, now: Date): object {
  const at = new Date(now.getTime() - sample.daysAgo * DAY - 3 * 3_600_000);
  const published = sample.state !== "review" && sample.state !== "held";
  const commit = (plugin.id + sample.version).split("").map((c) => c.charCodeAt(0).toString(16)).join("").padEnd(40, "a").slice(0, 40);
  const [publisher = ""] = plugin.id.split(".");
  return {
    version: sample.version,
    state: sample.state,
    review: sample.reviewed ? { state: "reviewed", by: 59077048, at: iso(at) } : { state: "automated" },
    commit,
    tag: `v${sample.version}`,
    releaseAuthor: { id: owner(publisher) + 1, login: `${publisher}-dev` },
    ...(published
      ? {
          package: download(plugin.id, sample.version, `${plugin.id}-${sample.version}.rsplugin`, 182_000 + sample.daysAgo * 113),
          source: download(plugin.id, sample.version, `${plugin.id}-${sample.version}-source.tar.gz`, 96_000 + sample.daysAgo * 71),
          sbom: download(plugin.id, sample.version, `${plugin.id}-${sample.version}.cdx.json`, 8_400 + sample.daysAgo),
          publishedAt: iso(at),
        }
      : {}),
    contracts: {
      assembly: `${plugin.name.replace(/[^A-Za-z]/g, "")}.Contracts.dll`,
      sha256: "c".repeat(64),
      package: `RunesmithHub.${plugin.id}.Contracts`,
      packageVersion: sample.version,
    },
    runesmithApi: sample.api ?? API,
    dependencies: plugin.dependencies ?? [],
    capabilities: { declared: plugin.capabilities, detected: plugin.capabilities.map((capability) => capability.id) },
    networkHosts: plugin.hosts ?? [],
    platforms: plugin.platforms ?? [],
    analysis: { verdict: sample.reviewed || sample.state === "review" ? "review" : "passed", triggers: [] },
    build: { run: `https://github.com/RunesmithHub/registry/actions/runs/${1_000_000 + sample.daysAgo}`, sdk: "10.0.401", reproducible: true },
    ...(published ? { attestation: `https://github.com/RunesmithHub/packages/attestations/${1_000 + sample.daysAgo}` } : {}),
    releaseNotes: sample.notes ?? "",
    ...(sample.readme ? { readme: sample.readme } : {}),
    ...(sample.state === "held" ? { holdUntil: iso(new Date(now.getTime() + 17 * 3_600_000)) } : {}),
    summary: plugin.summary,
    name: plugin.name,
    categories: plugin.categories,
    keywords: plugin.keywords,
    ...(plugin.deprecated ? { deprecated: plugin.deprecated } : {}),
    license: plugin.license,
    reportUrl: `https://github.com/RunesmithHub/registry/issues/${300 + sample.daysAgo}`,
    ...(sample.yankReason ? { yankReason: sample.yankReason } : {}),
    ...(plugin.languages ? { languages: plugin.languages } : {}),
    ...(plugin.languagePack ? { languagePack: plugin.languagePack } : {}),
  };
}

async function pluginRecord(writer: Writer, plugin: SamplePlugin, now: Date): Promise<object> {
  const [publisher = ""] = plugin.id.split(".");
  const icon = Object.fromEntries(
    await Promise.all([64, 128, 256].map(async (size) => [String(size), await writer.image(`icon-${plugin.icon}-${size}.png`, size, size)])),
  );
  const banner = plugin.banner
    ? { "640": await writer.image(`banner-${plugin.id}-640.webp`, 640, 320), "1280": await writer.image(`banner-${plugin.id}-1280.webp`, 1280, 640) }
    : undefined;
  const gallery = [];
  for (const [index, shot] of (plugin.gallery ?? []).entries()) {
    gallery.push({
      caption: index === 0 ? `${plugin.name} beside the editor` : "Settings and the status bar",
      "640": await writer.image(`shot-${shot}-640.webp`, 640, 400),
      "1280": await writer.image(`shot-${shot}-1280.webp`, 1280, 800),
    });
  }
  const versions = [...plugin.versions].sort((a, b) => compareVersionText(b.version, a.version));
  return {
    specVersion: 1,
    type: "plugin",
    version: 3,
    id: plugin.id,
    name: plugin.name,
    publisher,
    tier: plugin.tier,
    state: plugin.state,
    repository: { id: owner(plugin.id), url: `https://github.com/${PUBLISHERS.find((p) => p.name === publisher)?.login ?? publisher}/${plugin.id.split(".")[1]}`, path: "." },
    maintainers: [{ id: owner(publisher) + 1, login: `${publisher}-dev` }],
    summary: plugin.summary,
    categories: plugin.categories,
    keywords: plugin.keywords,
    ...(plugin.deprecated ? { deprecated: plugin.deprecated } : {}),
    icon,
    ...(banner ? { banner } : {}),
    gallery,
    versions: versions.map((sample) => versionRecord(plugin, sample, now)),
  };
}

function moderationEntries(now: Date): object[] {
  const daysAgo = (days: number): string => iso(new Date(now.getTime() - days * DAY));
  return [
    {
      id: 7,
      target: { kind: "publisher", publisher: "fastcode" },
      action: "block",
      reason: "malicious",
      note: "Read browser cookie stores and sent them to a chat webhook.",
      advisory: "https://github.com/RunesmithHub/registry/security/advisories/GHSA-r7xq-2m4v-9c3h",
      remediation: "Remove it, then change the passwords for sites you were signed in to in your browser.",
      createdAt: daysAgo(20),
    },
    {
      id: 6,
      target: { kind: "versions", plugin: "harbor.issues", range: ">=1.3.1 <1.3.2" },
      action: "block",
      reason: "vulnerability",
      note: "Depended on a compromised version of a logging library.",
      remediation: "Update to 1.3.2 or later.",
      createdAt: daysAgo(10),
    },
    {
      id: 8,
      target: { kind: "plugin", plugin: "pixel.icons" },
      action: "freeze",
      reason: "compromised-account",
      note: "New installs are paused while Runesmith looks into a report.",
      createdAt: daysAgo(1),
    },
  ];
}

function dashboard(now: Date): object {
  const hoursAgo = (hours: number): string => iso(new Date(now.getTime() - hours * 3_600_000));
  return {
    generatedAt: hoursAgo(0.2),
    reviewQueue: [
      { plugin: "harbor.issues", version: "1.4.0", tier: "verified", triggers: ["tier"], since: hoursAgo(26), trackingIssue: 498 },
      { plugin: "cobalt.docker", version: "0.4.0", tier: "unverified", triggers: ["build-logic"], since: hoursAgo(98), trackingIssue: 471 },
      { plugin: "runesmith.csharp", version: "0.1.7", tier: "official", triggers: ["tier"], since: hoursAgo(3), trackingIssue: 503 },
    ],
    held: [{ plugin: "lumen.todo", version: "1.1.0", tier: "unverified", since: hoursAgo(7), holdUntil: iso(new Date(now.getTime() + 17 * 3_600_000)), trackingIssue: 501 }],
    rejected: [
      { plugin: "atlas.rest", version: "0.6.1", reason: "Undeclared network use", at: hoursAgo(50), trackingIssue: 480 },
      { plugin: "northwind.charts", version: "2.2.0-beta.0", reason: "Contracts changed without a major version", at: hoursAgo(120), trackingIssue: 466 },
    ],
    actions: [
      { action: "freeze", target: "pixel.icons", reason: "compromised-account", at: hoursAgo(24), trackingIssue: 500 },
      { action: "block", target: "harbor.issues@>=1.3.1 <1.3.2", reason: "vulnerability", at: hoursAgo(240), trackingIssue: 489 },
      { action: "block", target: "publisher:fastcode", reason: "malicious", at: hoursAgo(480), trackingIssue: 452 },
    ],
    auditFlags: [
      { plugin: "tide.formatter", kind: "Verified requirement", note: "Default branch protection was turned off.", trackingIssue: 502 },
      { plugin: "cobalt.docker", kind: "Ownership", note: "Repository transferred to another owner.", trackingIssue: 499 },
    ],
    reports: [
      { plugin: "pixel.icons", open: 3, trackingIssue: 497 },
      { plugin: "atlas.rest", open: 1, trackingIssue: 495 },
    ],
  };
}

async function writeKeys(directory: string, keys: Keys): Promise<void> {
  await mkdir(directory, { recursive: true });
  const named: [string, FixtureKey][] = [
    ...keys.rootV2.map((key, index): [string, FixtureKey] => [`root-${index + 1}`, key]),
    ["publish", keys.publish],
    ["moderation", keys.moderation],
    ["timestamp", keys.timestamp],
  ];
  for (const [name, key] of named) {
    await writeFile(path.join(directory, `${name}.pem`), pem(key));
  }
}

export async function generateFixture(directory: string, options: FixtureOptions = {}): Promise<{ index: string; trustedRoot: string }> {
  const now = options.now ?? new Date();
  const tamper = options.tamper ?? "none";
  await rm(directory, { recursive: true, force: true });
  const index = path.join(directory, "index");
  const writer = new Writer(index);

  const [r1, r2, r3, r4] = await Promise.all([generateKey(), generateKey(), generateKey(), generateKey()]);
  if (!r1 || !r2 || !r3 || !r4) {
    throw new Error("key generation failed");
  }
  const keys: Keys = {
    rootV1: [r1, r2, r3],
    rootV2: [r1, r2, r4],
    publish: await generateKey(),
    moderation: await generateKey(),
    timestampV1: await generateKey(),
    timestamp: await generateKey(),
  };
  const yearAhead = iso(new Date(now.getTime() + 365 * DAY));
  await writer.write("root/1.json", await signEnvelope(rootPayload(1, keys.rootV1, keys, keys.timestampV1, yearAhead), [r1, r2]));
  const rootV2Signers = tamper === "root-threshold" ? [r1, r4] : [r1, r2, r4];
  await writer.write("root/2.json", await signEnvelope(rootPayload(2, keys.rootV2, keys, keys.timestamp, yearAhead), rootV2Signers));

  const pluginRefs: Record<string, object> = {};
  for (const plugin of PLUGINS) {
    const bytes = utf8(JSON.stringify(await pluginRecord(writer, plugin, now)));
    const reference = await writer.pinned("plugins", bytes, 3);
    if (tamper === "hash" && plugin.id === "harbor.issues") {
      const altered = utf8(new TextDecoder().decode(bytes).replace("Harbor Issues", "Harbor Issuez"));
      await writer.write(`plugins/${reference.sha256}.json`, altered);
    }
    pluginRefs[plugin.id] = reference;
  }
  const publishers = utf8(
    JSON.stringify({
      specVersion: 1,
      type: "publishers",
      version: 4,
      publishers: PUBLISHERS.map((publisher) => ({
        name: publisher.name,
        displayName: publisher.displayName,
        owner: { id: owner(publisher.name), login: publisher.login, type: publisher.type },
        state: publisher.state,
        verified: publisher.verified,
        ...(publisher.verified ? { verifiedAt: iso(new Date(now.getTime() - 120 * DAY)) } : {}),
      })),
    }),
  );
  const policy = utf8(
    JSON.stringify({
      specVersion: 1,
      type: "policy",
      version: 2,
      categories: CATEGORIES,
      capabilities: Object.fromEntries(Object.entries(CAPABILITY_LABELS).map(([id, label]) => [id, { label }])),
      oldestRunesmith: "0.1.0",
      mirrors: [],
      holdHours: 24,
      featured: FEATURED,
    }),
  );
  const snapshotPayload = {
    specVersion: 1,
    type: "snapshot",
    version: 12,
    expires: iso(new Date(now.getTime() + 90 * DAY)),
    plugins: pluginRefs,
    publishers: await writer.pinned("publishers", publishers, 4),
    policy: await writer.pinned("policy", policy, 2),
  };
  const snapshot = await writer.pinned("snapshot", await signEnvelope(snapshotPayload, [keys.publish]), 12);
  const moderationPayload = {
    specVersion: 1,
    type: "moderation",
    version: 5,
    expires: iso(new Date(now.getTime() + 90 * DAY)),
    entries: moderationEntries(now),
  };
  const moderation = await writer.pinned("moderation", await signEnvelope(moderationPayload, [keys.moderation]), 5);
  const timestampExpires = tamper === "expired-timestamp" ? new Date(now.getTime() - 3_600_000) : new Date(now.getTime() + 3 * DAY);
  const timestampPayload = { specVersion: 1, type: "timestamp", version: 40, expires: iso(timestampExpires), snapshot, moderation };
  let timestamp = await signEnvelope(timestampPayload, [keys.timestamp]);
  if (tamper === "signature") {
    const envelope = JSON.parse(new TextDecoder().decode(timestamp)) as { signatures: { sig: string }[] };
    const first = envelope.signatures[0];
    if (first) {
      first.sig = `${first.sig.startsWith("A") ? "B" : "A"}${first.sig.slice(1)}`;
    }
    timestamp = utf8(JSON.stringify(envelope));
  }
  await writer.write("timestamp.json", timestamp);
  await writer.write("dashboard.json", utf8(JSON.stringify(dashboard(now), null, 2)));
  await writer.write(
    "stats.json",
    utf8(JSON.stringify({ generatedAt: iso(now), installs: Object.fromEntries(PLUGINS.map((plugin) => [plugin.id, plugin.installs])) })),
  );
  await writeKeys(path.join(directory, "keys"), keys);
  return { index, trustedRoot: path.join(index, "root", "1.json") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory = "tests/fixtures/.generated/default", tamperArgument] = process.argv.slice(2);
  const tamper = (tamperArgument?.replace("--tamper=", "") ?? "none") as Tamper;
  const result = await generateFixture(path.resolve(directory), { tamper });
  console.log(`Fixture index: ${result.index}\nTrusted root: ${result.trustedRoot}`);
}
