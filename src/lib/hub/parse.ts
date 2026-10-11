import {
  FormatError,
  asObject,
  asString,
  optionalField,
  readArray,
  readBoolean,
  readEnum,
  readInteger,
  readNonNegative,
  readObject,
  readOptionalArray,
  readOptionalInteger,
  readOptionalObject,
  readOptionalString,
  readOptionalTime,
  readSha256,
  readString,
  readStringArray,
  readTime,
  type JsonObject,
} from "./json.ts";
import {
  IMAGE_FORMATS,
  MODERATION_ACTIONS,
  MODERATION_REASONS,
  PLUGIN_STATES,
  PUBLISHER_STATES,
  REVIEW_STATES,
  ROLE_NAMES,
  SUPPORTED_SPEC_VERSION,
  TARGET_KINDS,
  TIERS,
  VERSION_STATES,
  type Account,
  type Deprecation,
  type Download,
  type GalleryImage,
  type ImageRef,
  type LanguagePack,
  type MetaReference,
  type ModerationEntry,
  type ModerationPayload,
  type PluginRecord,
  type PolicyPayload,
  type PublicKey,
  type Publisher,
  type PublishersPayload,
  type Role,
  type RoleName,
  type RootPayload,
  type SignedHeader,
  type SnapshotPayload,
  type TimestampPayload,
  type VersionRecord,
} from "./model.ts";

function checkSpecVersion(source: JsonObject, path: string, required: boolean): void {
  const specVersion = required ? readInteger(source, "specVersion", path) : readOptionalInteger(source, "specVersion", path);
  if (specVersion !== undefined && (specVersion < 1 || specVersion > SUPPORTED_SPEC_VERSION)) {
    throw new FormatError(`${path}.specVersion ${specVersion} is not supported (this site supports ${SUPPORTED_SPEC_VERSION})`);
  }
}

function checkType(source: JsonObject, path: string, type: string): void {
  const actual = readString(source, "type", path);
  if (actual !== type) {
    throw new FormatError(`${path}.type is "${actual}", expected "${type}"`);
  }
}

function recordVersion(source: JsonObject, path: string): number {
  const version = readInteger(source, "version", path);
  if (version < 1) {
    throw new FormatError(`${path}.version must be at least 1`);
  }
  return version;
}

function signedHeader(value: unknown, path: string, type: string): [JsonObject, SignedHeader] {
  const source = asObject(value, path);
  checkSpecVersion(source, path, true);
  checkType(source, path, type);
  return [source, { version: recordVersion(source, path), expires: readTime(source, "expires", path) }];
}

function plainHeader(value: unknown, path: string, type: string): [JsonObject, number] {
  const source = asObject(value, path);
  checkSpecVersion(source, path, false);
  checkType(source, path, type);
  return [source, recordVersion(source, path)];
}

function metaReference(value: unknown, path: string): MetaReference {
  const source = asObject(value, path);
  return {
    version: recordVersion(source, path),
    sha256: readSha256(source, "sha256", path),
    length: readNonNegative(source, "length", path),
  };
}

function recordMap<T>(value: JsonObject, path: string, item: (element: unknown, path: string) => T): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, element] of Object.entries(value)) {
    result[key] = item(element, `${path}.${key}`);
  }
  return result;
}

function publicKey(value: unknown, path: string): PublicKey {
  const source = asObject(value, path);
  readEnum(source, "scheme", path, ["ecdsa-p256-sha256"]);
  return { scheme: "ecdsa-p256-sha256", public: readString(source, "public", path) };
}

function role(value: unknown, path: string): Role {
  const source = asObject(value, path);
  const keyids = readArray(source, "keyids", path, asString);
  const threshold = readInteger(source, "threshold", path);
  if (threshold < 1) {
    throw new FormatError(`${path}.threshold must be at least 1`);
  }
  return { keyids, threshold };
}

export function parseRoot(value: unknown, path = "root"): RootPayload {
  const [source, header] = signedHeader(value, path, "root");
  const keys = recordMap(readObject(source, "keys", path), `${path}.keys`, publicKey);
  const rolesSource = readObject(source, "roles", path);
  const roles = Object.fromEntries(
    ROLE_NAMES.map((name) => [name, role(rolesSource[name], `${path}.roles.${name}`)]),
  ) as Record<RoleName, Role>;
  return { ...header, keys, roles };
}

export function parseTimestamp(value: unknown, path = "timestamp"): TimestampPayload {
  const [source, header] = signedHeader(value, path, "timestamp");
  return {
    ...header,
    snapshot: metaReference(source.snapshot, `${path}.snapshot`),
    moderation: metaReference(source.moderation, `${path}.moderation`),
  };
}

export function parseSnapshot(value: unknown, path = "snapshot"): SnapshotPayload {
  const [source, header] = signedHeader(value, path, "snapshot");
  return {
    ...header,
    plugins: recordMap(readObject(source, "plugins", path), `${path}.plugins`, metaReference),
    publishers: metaReference(source.publishers, `${path}.publishers`),
    policy: metaReference(source.policy, `${path}.policy`),
  };
}

function remediation(source: JsonObject, path: string): string | undefined {
  const value = optionalField(source, "remediation");
  if (value === undefined || typeof value === "string") {
    return value;
  }
  const object = asObject(value, `${path}.remediation`);
  const text = readOptionalString(object, "text", `${path}.remediation`) ?? readOptionalString(object, "note", `${path}.remediation`);
  const version = readOptionalString(object, "version", `${path}.remediation`);
  return text ?? (version ? `Update to ${version} or later.` : undefined);
}

function moderationEntry(value: unknown, path: string): ModerationEntry {
  const source = asObject(value, path);
  const targetSource = readObject(source, "target", path);
  const targetPath = `${path}.target`;
  const kind = readEnum(targetSource, "kind", targetPath, TARGET_KINDS);
  const target = {
    kind,
    publisher: readOptionalString(targetSource, "publisher", targetPath),
    plugin: readOptionalString(targetSource, "plugin", targetPath),
    range: readOptionalString(targetSource, "range", targetPath),
  };
  if ((kind === "publisher" && !target.publisher) || (kind !== "publisher" && !target.plugin) || (kind === "versions" && !target.range)) {
    throw new FormatError(`${targetPath} is incomplete for kind "${kind}"`);
  }
  return {
    id: readInteger(source, "id", path),
    target,
    action: readEnum(source, "action", path, MODERATION_ACTIONS),
    reason: readEnum(source, "reason", path, MODERATION_REASONS),
    note: readOptionalString(source, "note", path) ?? "",
    advisory: readOptionalString(source, "advisory", path),
    remediation: remediation(source, path),
    createdAt: readTime(source, "createdAt", path),
  };
}

export function parseModeration(value: unknown, path = "moderation"): ModerationPayload {
  const [source, header] = signedHeader(value, path, "moderation");
  return { ...header, entries: readOptionalArray(source, "entries", path, moderationEntry) };
}

function image(value: unknown, path: string): ImageRef {
  const source = asObject(value, path);
  return {
    url: readString(source, "url", path),
    sha256: readSha256(source, "sha256", path),
    length: readNonNegative(source, "length", path),
    width: readNonNegative(source, "width", path),
    height: readNonNegative(source, "height", path),
    format: readEnum(source, "format", path, IMAGE_FORMATS),
  };
}

function account(value: unknown, path: string): Account {
  const source = asObject(value, path);
  return { id: readInteger(source, "id", path), login: readString(source, "login", path) };
}

function download(value: unknown, path: string): Download {
  const source = asObject(value, path);
  return {
    urls: readArray(source, "urls", path, asString),
    sha256: readSha256(source, "sha256", path),
    length: readNonNegative(source, "length", path),
  };
}

function deprecation(source: JsonObject, path: string): Deprecation | undefined {
  const value = readOptionalObject(source, "deprecated", path);
  if (!value) {
    return undefined;
  }
  return {
    reason: readString(value, "reason", `${path}.deprecated`),
    replacement: readOptionalString(value, "replacement", `${path}.deprecated`),
  };
}

function attestation(source: JsonObject, path: string): string | undefined {
  const value = optionalField(source, "attestation");
  if (value === undefined || typeof value === "string") {
    return value;
  }
  return readOptionalString(asObject(value, `${path}.attestation`), "url", `${path}.attestation`);
}

function languages(source: JsonObject, path: string): string[] | undefined {
  return optionalField(source, "languages") === undefined ? undefined : readStringArray(source, "languages", path);
}

function languagePack(source: JsonObject, path: string): LanguagePack | undefined {
  const value = readOptionalObject(source, "languagePack", path);
  if (!value) {
    return undefined;
  }
  const packPath = `${path}.languagePack`;
  return {
    language: readString(value, "language", packPath),
    name: readString(value, "name", packPath),
    englishName: readString(value, "englishName", packPath),
    targets: readStringArray(value, "targets", packPath),
  };
}

function versionRecord(value: unknown, path: string): VersionRecord {
  const source = asObject(value, path);
  const review = readObject(source, "review", path);
  const contracts = readObject(source, "contracts", path);
  const capabilities = readObject(source, "capabilities", path);
  const analysis = readObject(source, "analysis", path);
  const build = readObject(source, "build", path);
  const optionalDownload = (key: string): Download | undefined => {
    const field = optionalField(source, key);
    return field === undefined ? undefined : download(field, `${path}.${key}`);
  };
  return {
    version: readString(source, "version", path),
    state: readEnum(source, "state", path, VERSION_STATES),
    review: {
      state: readEnum(review, "state", `${path}.review`, REVIEW_STATES),
      by: readOptionalInteger(review, "by", `${path}.review`),
      at: readOptionalTime(review, "at", `${path}.review`),
    },
    commit: readString(source, "commit", path),
    tag: readString(source, "tag", path),
    releaseAuthor: account(source.releaseAuthor, `${path}.releaseAuthor`),
    package: optionalDownload("package"),
    source: optionalDownload("source"),
    sbom: optionalDownload("sbom"),
    contracts: {
      assembly: readString(contracts, "assembly", `${path}.contracts`),
      sha256: readSha256(contracts, "sha256", `${path}.contracts`),
      package: readString(contracts, "package", `${path}.contracts`),
      packageVersion: readString(contracts, "packageVersion", `${path}.contracts`),
    },
    runesmithApi: readString(source, "runesmithApi", path),
    dependencies: readOptionalArray(source, "dependencies", path, (element, itemPath) => {
      const dependency = asObject(element, itemPath);
      return { id: readString(dependency, "id", itemPath), range: readString(dependency, "range", itemPath) };
    }),
    capabilities: {
      declared: readOptionalArray(capabilities, "declared", `${path}.capabilities`, (element, itemPath) => {
        const capability = asObject(element, itemPath);
        return { id: readString(capability, "id", itemPath), reason: readString(capability, "reason", itemPath) };
      }),
      detected: readStringArray(capabilities, "detected", `${path}.capabilities`),
    },
    networkHosts: readStringArray(source, "networkHosts", path),
    platforms: readStringArray(source, "platforms", path),
    analysis: {
      verdict: readEnum(analysis, "verdict", `${path}.analysis`, ["passed", "review"]),
      triggers: readStringArray(analysis, "triggers", `${path}.analysis`),
    },
    build: {
      run: readString(build, "run", `${path}.build`),
      sdk: readString(build, "sdk", `${path}.build`),
      reproducible: readBoolean(build, "reproducible", `${path}.build`),
    },
    attestation: attestation(source, path),
    releaseNotes: readOptionalString(source, "releaseNotes", path) ?? "",
    readme: readOptionalString(source, "readme", path),
    publishedAt: readOptionalTime(source, "publishedAt", path),
    holdUntil: readOptionalTime(source, "holdUntil", path),
    summary: readString(source, "summary", path),
    name: readString(source, "name", path),
    categories: readStringArray(source, "categories", path),
    keywords: readStringArray(source, "keywords", path),
    deprecated: deprecation(source, path),
    license: readOptionalString(source, "license", path),
    reportUrl: readOptionalString(source, "reportUrl", path),
    yankReason: readOptionalString(source, "yankReason", path),
    languages: languages(source, path),
    languagePack: languagePack(source, path),
  };
}

function sizedPair(value: JsonObject, path: string): { small: ImageRef; large: ImageRef } {
  return { small: image(value["640"], `${path}.640`), large: image(value["1280"], `${path}.1280`) };
}

export function parsePlugin(value: unknown, path = "plugin"): PluginRecord {
  const [source, version] = plainHeader(value, path, "plugin");
  const repository = readObject(source, "repository", path);
  const icon = readObject(source, "icon", path);
  const banner = readOptionalObject(source, "banner", path);
  return {
    version,
    id: readString(source, "id", path),
    name: readString(source, "name", path),
    publisher: readString(source, "publisher", path),
    tier: readEnum(source, "tier", path, TIERS),
    state: readEnum(source, "state", path, PLUGIN_STATES),
    repository: {
      id: readInteger(repository, "id", `${path}.repository`),
      url: readString(repository, "url", `${path}.repository`),
      path: readOptionalString(repository, "path", `${path}.repository`) ?? ".",
    },
    maintainers: readOptionalArray(source, "maintainers", path, account),
    summary: readString(source, "summary", path),
    categories: readStringArray(source, "categories", path),
    keywords: readStringArray(source, "keywords", path),
    deprecated: deprecation(source, path),
    icon: {
      "64": image(icon["64"], `${path}.icon.64`),
      "128": image(icon["128"], `${path}.icon.128`),
      "256": image(icon["256"], `${path}.icon.256`),
    },
    banner: banner ? sizedPair(banner, `${path}.banner`) : undefined,
    gallery: readOptionalArray(source, "gallery", path, (element, itemPath): GalleryImage => {
      const item = asObject(element, itemPath);
      return { caption: readString(item, "caption", itemPath), ...sizedPair(item, itemPath) };
    }),
    versions: readArray(source, "versions", path, versionRecord),
  };
}

function publisher(value: unknown, path: string): Publisher {
  const source = asObject(value, path);
  const owner = readObject(source, "owner", path);
  return {
    name: readString(source, "name", path),
    displayName: readString(source, "displayName", path),
    owner: {
      id: readInteger(owner, "id", `${path}.owner`),
      login: readString(owner, "login", `${path}.owner`),
      type: readEnum(owner, "type", `${path}.owner`, ["User", "Organization"]),
    },
    state: readEnum(source, "state", path, PUBLISHER_STATES),
    verified: readBoolean(source, "verified", path),
    verifiedAt: readOptionalTime(source, "verifiedAt", path),
  };
}

export function parsePublishers(value: unknown, path = "publishers"): PublishersPayload {
  const [source, version] = plainHeader(value, path, "publishers");
  return { version, publishers: readArray(source, "publishers", path, publisher) };
}

export function parsePolicy(value: unknown, path = "policy"): PolicyPayload {
  const [source, version] = plainHeader(value, path, "policy");
  const capabilities = readOptionalObject(source, "capabilities", path) ?? {};
  const oldest = optionalField(source, "oldestRunesmith");
  return {
    version,
    categories: readArray(source, "categories", path, asString),
    capabilities: recordMap(capabilities, `${path}.capabilities`, (element, itemPath) => ({
      label: readString(asObject(element, itemPath), "label", itemPath),
    })),
    oldestRunesmith: oldest === undefined ? null : asString(oldest, `${path}.oldestRunesmith`),
    mirrors: readStringArray(source, "mirrors", path),
    holdHours: readOptionalInteger(source, "holdHours", path) ?? 24,
    featured: readStringArray(source, "featured", path),
  };
}
