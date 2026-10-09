import { sha256Hex } from "./bytes.ts";
import { envelopePayload, parseEnvelope, verifyRole, type Envelope } from "./dsse.ts";
import { FormatError, parseJsonBytes } from "./json.ts";
import { LIMITS } from "./limits.ts";
import type { MetaReference, PluginRecord, RootPayload, SignedHeader, VerifiedIndex } from "./model.ts";
import { parseModeration, parsePlugin, parsePolicy, parsePublishers, parseRoot, parseSnapshot, parseTimestamp } from "./parse.ts";
import type { IndexSource } from "./source.ts";

export class VerificationError extends Error {
  override readonly name = "VerificationError";
}

export interface VerifyOptions {
  readonly source: IndexSource;
  readonly trustedRoot: Uint8Array;
  readonly now: Date;
}

const MAX_ROOT_STEPS = 1000;

async function required(source: IndexSource, relativePath: string, limit: number): Promise<Uint8Array> {
  const bytes = await source.read(relativePath, limit);
  if (!bytes) {
    throw new VerificationError(`${relativePath} is missing from ${source.description}`);
  }
  return bytes;
}

function checkExpiry(header: SignedHeader, what: string, now: Date): void {
  if (Date.parse(header.expires) <= now.getTime()) {
    throw new VerificationError(`${what} version ${header.version} expired at ${header.expires}`);
  }
}

async function checkReference(bytes: Uint8Array, reference: MetaReference, what: string): Promise<void> {
  if (bytes.length !== reference.length) {
    throw new VerificationError(`${what} is ${bytes.length} bytes, the signed length is ${reference.length}`);
  }
  if ((await sha256Hex(bytes)) !== reference.sha256) {
    throw new VerificationError(`${what} does not match its signed SHA-256`);
  }
}

async function selfSignedRoot(bytes: Uint8Array, what: string): Promise<[Envelope, RootPayload]> {
  const envelope = parseEnvelope(bytes, what);
  const root = parseRoot(envelopePayload(envelope, what), what);
  await verifyRole(envelope, root, "root", what);
  return [envelope, root];
}

async function updateRoot(source: IndexSource, trusted: RootPayload): Promise<RootPayload> {
  let current = trusted;
  for (let step = 0; step < MAX_ROOT_STEPS; step++) {
    const next = current.version + 1;
    const what = `root/${next}.json`;
    const bytes = await source.read(what, LIMITS.root);
    if (!bytes) {
      return current;
    }
    const [envelope, candidate] = await selfSignedRoot(bytes, what);
    await verifyRole(envelope, current, "root", `${what} (signed by root ${current.version})`);
    if (candidate.version !== next) {
      throw new VerificationError(`${what} declares version ${candidate.version}`);
    }
    current = candidate;
  }
  throw new VerificationError("the root chain is too long");
}

async function loadSigned<T extends SignedHeader>(
  bytes: Uint8Array,
  what: string,
  root: RootPayload,
  role: "timestamp" | "publish" | "moderation",
  parse: (value: unknown, path: string) => T,
): Promise<T> {
  const envelope = parseEnvelope(bytes, what);
  await verifyRole(envelope, root, role, what);
  return parse(envelopePayload(envelope, what), what);
}

async function loadPinned<T>(
  source: IndexSource,
  folder: string,
  reference: MetaReference,
  limit: number,
  what: string,
  parse: (bytes: Uint8Array, what: string) => T | Promise<T>,
): Promise<T> {
  if (reference.length > limit) {
    throw new VerificationError(`${what} is signed as ${reference.length} bytes, over the ${limit} byte limit`);
  }
  const bytes = await required(source, `${folder}/${reference.sha256}.json`, limit);
  await checkReference(bytes, reference, what);
  return parse(bytes, what);
}

function checkVersion(actual: number, reference: MetaReference, what: string): void {
  if (actual !== reference.version) {
    throw new VerificationError(`${what} has version ${actual}, the signed version is ${reference.version}`);
  }
}

function checkPlugin(record: PluginRecord, id: string, reference: MetaReference): PluginRecord {
  if (record.id !== id) {
    throw new VerificationError(`the plugin record pinned for ${id} is for ${record.id}`);
  }
  checkVersion(record.version, reference, `plugin record ${id}`);
  return record;
}

export async function loadVerifiedIndex({ source, trustedRoot, now }: VerifyOptions): Promise<VerifiedIndex> {
  try {
    const [, shipped] = await selfSignedRoot(trustedRoot, "trusted root");
    const root = await updateRoot(source, shipped);
    checkExpiry(root, "root", now);

    const timestamp = await loadSigned(await required(source, "timestamp.json", LIMITS.timestamp), "timestamp.json", root, "timestamp", parseTimestamp);
    checkExpiry(timestamp, "timestamp", now);

    const snapshot = await loadPinned(source, "snapshot", timestamp.snapshot, LIMITS.snapshot, "snapshot", (bytes, what) =>
      loadSigned(bytes, what, root, "publish", parseSnapshot),
    );
    checkVersion(snapshot.version, timestamp.snapshot, "snapshot");
    checkExpiry(snapshot, "snapshot", now);

    const moderation = await loadPinned(source, "moderation", timestamp.moderation, LIMITS.moderation, "moderation", (bytes, what) =>
      loadSigned(bytes, what, root, "moderation", parseModeration),
    );
    checkVersion(moderation.version, timestamp.moderation, "moderation");
    checkExpiry(moderation, "moderation", now);

    const plugins: PluginRecord[] = [];
    for (const [id, reference] of Object.entries(snapshot.plugins)) {
      const record = await loadPinned(source, "plugins", reference, LIMITS.plugin, `plugin record ${id}`, (bytes, what) =>
        parsePlugin(parseJsonBytes(bytes, what), what),
      );
      plugins.push(checkPlugin(record, id, reference));
    }

    const publishers = await loadPinned(source, "publishers", snapshot.publishers, LIMITS.publishers, "publisher list", (bytes, what) =>
      parsePublishers(parseJsonBytes(bytes, what), what),
    );
    checkVersion(publishers.version, snapshot.publishers, "publisher list");

    const policy = await loadPinned(source, "policy", snapshot.policy, LIMITS.policy, "policy", (bytes, what) =>
      parsePolicy(parseJsonBytes(bytes, what), what),
    );
    checkVersion(policy.version, snapshot.policy, "policy");

    return { root, timestamp, snapshot, moderation, plugins, publishers, policy };
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    if (error instanceof FormatError || (error instanceof Error && (error.name === "SignatureError" || error.name === "SourceError"))) {
      throw new VerificationError(error.message, { cause: error });
    }
    throw error;
  }
}
