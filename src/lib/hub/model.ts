export const SUPPORTED_SPEC_VERSION = 1;

export const ROLE_NAMES = ["root", "publish", "moderation", "timestamp"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export interface PublicKey {
  readonly scheme: "ecdsa-p256-sha256";
  readonly public: string;
}

export interface Role {
  readonly keyids: readonly string[];
  readonly threshold: number;
}

export interface SignedHeader {
  readonly version: number;
  readonly expires: string;
}

export interface RootPayload extends SignedHeader {
  readonly keys: Readonly<Record<string, PublicKey>>;
  readonly roles: Readonly<Record<RoleName, Role>>;
}

export interface MetaReference {
  readonly version: number;
  readonly sha256: string;
  readonly length: number;
}

export interface FileReference {
  readonly sha256: string;
  readonly length: number;
}

export interface TimestampPayload extends SignedHeader {
  readonly snapshot: MetaReference;
  readonly moderation: MetaReference;
}

export interface SnapshotPayload extends SignedHeader {
  readonly plugins: Readonly<Record<string, MetaReference>>;
  readonly publishers: MetaReference;
  readonly policy: MetaReference;
}

export const MODERATION_ACTIONS = ["freeze", "block"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const MODERATION_REASONS = [
  "malicious",
  "compromised-account",
  "vulnerability",
  "broken",
  "policy",
  "legal",
  "developer-request",
] as const;
export type ModerationReason = (typeof MODERATION_REASONS)[number];

export const TARGET_KINDS = ["publisher", "plugin", "versions"] as const;
export type TargetKind = (typeof TARGET_KINDS)[number];

export interface ModerationTarget {
  readonly kind: TargetKind;
  readonly publisher?: string;
  readonly plugin?: string;
  readonly range?: string;
}

export interface ModerationEntry {
  readonly id: number;
  readonly target: ModerationTarget;
  readonly action: ModerationAction;
  readonly reason: ModerationReason;
  readonly note: string;
  readonly advisory?: string;
  readonly remediation?: string;
  readonly createdAt: string;
}

export interface ModerationPayload extends SignedHeader {
  readonly entries: readonly ModerationEntry[];
}

export const IMAGE_FORMATS = ["png", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export interface ImageRef {
  readonly url: string;
  readonly sha256: string;
  readonly length: number;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
}

export interface GalleryImage {
  readonly caption: string;
  readonly small: ImageRef;
  readonly large: ImageRef;
}

export const TIERS = ["official", "verified", "unverified"] as const;
export type Tier = (typeof TIERS)[number];

export const PLUGIN_STATES = ["listed", "deprecated", "frozen", "blocked", "deleted"] as const;
export type PluginState = (typeof PLUGIN_STATES)[number];

export const VERSION_STATES = ["review", "held", "published", "yanked", "frozen", "blocked", "deleted"] as const;
export type VersionState = (typeof VERSION_STATES)[number];

export const PUBLISHER_STATES = ["active", "suspended", "blocked"] as const;
export type PublisherState = (typeof PUBLISHER_STATES)[number];

export const REVIEW_STATES = ["automated", "reviewed"] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export interface Account {
  readonly id: number;
  readonly login: string;
}

export interface Download extends FileReference {
  readonly urls: readonly string[];
}

export interface Deprecation {
  readonly reason: string;
  readonly replacement?: string;
}

export interface DeclaredCapability {
  readonly id: string;
  readonly reason: string;
}

export interface Dependency {
  readonly id: string;
  readonly range: string;
}

export interface VersionRecord {
  readonly version: string;
  readonly state: VersionState;
  readonly review: { readonly state: ReviewState; readonly by?: number; readonly at?: string };
  readonly commit: string;
  readonly tag: string;
  readonly releaseAuthor: Account;
  readonly package?: Download;
  readonly source?: Download;
  readonly sbom?: Download;
  readonly contracts: {
    readonly assembly: string;
    readonly sha256: string;
    readonly package: string;
    readonly packageVersion: string;
  };
  readonly runesmithApi: string;
  readonly dependencies: readonly Dependency[];
  readonly capabilities: { readonly declared: readonly DeclaredCapability[]; readonly detected: readonly string[] };
  readonly networkHosts: readonly string[];
  readonly platforms: readonly string[];
  readonly analysis: { readonly verdict: "passed" | "review"; readonly triggers: readonly string[] };
  readonly build: { readonly run: string; readonly sdk: string; readonly reproducible: boolean };
  readonly attestation?: string;
  readonly releaseNotes: string;
  readonly readme?: string;
  readonly publishedAt?: string;
  readonly holdUntil?: string;
  readonly summary: string;
  readonly name: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly deprecated?: Deprecation;
  readonly license?: string;
  readonly reportUrl?: string;
  readonly yankReason?: string;
}

export interface PluginRecord {
  readonly version: number;
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly tier: Tier;
  readonly state: PluginState;
  readonly repository: { readonly id: number; readonly url: string; readonly path: string };
  readonly maintainers: readonly Account[];
  readonly summary: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly deprecated?: Deprecation;
  readonly icon: { readonly "64": ImageRef; readonly "128": ImageRef; readonly "256": ImageRef };
  readonly banner?: { readonly small: ImageRef; readonly large: ImageRef };
  readonly gallery: readonly GalleryImage[];
  readonly versions: readonly VersionRecord[];
}

export interface Publisher {
  readonly name: string;
  readonly displayName: string;
  readonly owner: { readonly id: number; readonly login: string; readonly type: "User" | "Organization" };
  readonly state: PublisherState;
  readonly verified: boolean;
  readonly verifiedAt?: string;
}

export interface PublishersPayload {
  readonly version: number;
  readonly publishers: readonly Publisher[];
}

export interface PolicyPayload {
  readonly version: number;
  readonly categories: readonly string[];
  readonly capabilities: Readonly<Record<string, { readonly label: string }>>;
  readonly oldestRunesmith: string | null;
  readonly mirrors: readonly string[];
  readonly holdHours: number;
  readonly featured: readonly string[];
}

export interface VerifiedIndex {
  readonly root: RootPayload;
  readonly timestamp: TimestampPayload;
  readonly snapshot: SnapshotPayload;
  readonly moderation: ModerationPayload;
  readonly plugins: readonly PluginRecord[];
  readonly publishers: PublishersPayload;
  readonly policy: PolicyPayload;
}
