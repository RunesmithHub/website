import type { ModerationAction, ModerationReason, ReviewState, TargetKind, Tier, VersionState } from "../hub/model.ts";

export type { ModerationAction, ModerationReason, ReviewState, Tier, VersionState };

export type PluginStatus = "listed" | "deprecated" | "frozen" | "blocked" | "deleted";

export interface SiteImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface IconSet {
  readonly small: SiteImage;
  readonly medium: SiteImage;
  readonly large: SiteImage;
}

export interface ImagePair {
  readonly small: SiteImage;
  readonly large: SiteImage;
}

export interface GalleryItem extends ImagePair {
  readonly caption: string;
}

export interface FileLink {
  readonly url: string;
  readonly length: number;
  readonly sha256: string;
}

export interface CapabilityView {
  readonly id: string;
  readonly label: string;
  readonly reason: string;
  readonly detected: boolean;
  readonly highRisk: boolean;
}

export interface PluginRef {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier | null;
  readonly status: PluginStatus | null;
  readonly icon: SiteImage | null;
}

export interface DependencyView extends PluginRef {
  readonly range: string;
  readonly rangeText: string;
}

export interface VersionView {
  readonly version: string;
  readonly state: VersionState;
  readonly prerelease: boolean;
  readonly installable: boolean;
  readonly review: { readonly state: ReviewState; readonly at: string | null };
  readonly date: string | null;
  readonly holdUntil: string | null;
  readonly runesmithApi: string;
  readonly apiText: string;
  readonly compatible: boolean;
  readonly releaseNotes: string;
  readonly readme: string | null;
  readonly commit: string;
  readonly tag: string;
  readonly commitUrl: string;
  readonly treeUrl: string;
  readonly package: FileLink | null;
  readonly source: FileLink | null;
  readonly sbom: FileLink | null;
  readonly capabilities: readonly CapabilityView[];
  readonly networkHosts: readonly string[];
  readonly platforms: readonly string[];
  readonly dependencies: readonly DependencyView[];
  readonly build: { readonly run: string; readonly sdk: string; readonly reproducible: boolean };
  readonly attestation: string | null;
  readonly contracts: { readonly assembly: string; readonly package: string; readonly packageVersion: string };
  readonly needsReview: boolean;
  readonly advisoryIds: readonly number[];
  readonly license: string | null;
  readonly reportUrl: string | null;
  readonly yankReason: string | null;
}

export interface ModerationNotice {
  readonly entryId: number | null;
  readonly reason: ModerationReason | null;
  readonly note: string;
  readonly date: string | null;
  readonly advisoryUrl: string | null;
  readonly remediation: string | null;
}

export interface PluginView {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly publisherName: string;
  readonly tier: Tier;
  readonly status: PluginStatus;
  readonly summary: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly deprecated: { readonly reason: string; readonly replacement: PluginRef | null } | null;
  readonly repository: { readonly url: string; readonly path: string };
  readonly maintainers: readonly string[];
  readonly icon: IconSet | null;
  readonly banner: ImagePair | null;
  readonly gallery: readonly GalleryItem[];
  readonly installs: number | null;
  readonly updatedAt: string | null;
  readonly latest: string | null;
  readonly compatible: boolean;
  readonly capabilities: readonly string[];
  readonly platforms: readonly string[];
  readonly versions: readonly VersionView[];
  readonly dependents: readonly PluginRef[];
  readonly advisoryIds: readonly number[];
  readonly blocked: ModerationNotice | null;
  readonly frozen: ModerationNotice | null;
}

export interface PublisherView {
  readonly name: string;
  readonly displayName: string;
  readonly ownerLogin: string;
  readonly ownerType: "User" | "Organization";
  readonly state: "active" | "suspended" | "blocked";
  readonly verified: boolean;
  readonly verifiedAt: string | null;
  readonly avatar: string | null;
  readonly pluginIds: readonly string[];
}

export interface AdvisoryView {
  readonly id: number;
  readonly action: ModerationAction;
  readonly reason: ModerationReason;
  readonly note: string;
  readonly advisoryUrl: string | null;
  readonly remediation: string | null;
  readonly createdAt: string;
  readonly targetKind: TargetKind;
  readonly targetLabel: string;
  readonly plugin: PluginRef | null;
  readonly publisher: string | null;
  readonly range: string | null;
  readonly affectedVersions: readonly string[];
}

export interface CategoryView {
  readonly name: string;
  readonly slug: string;
  readonly count: number;
}

export interface CapabilityInfo {
  readonly id: string;
  readonly label: string;
}

export interface IndexStatus {
  readonly available: boolean;
  readonly reason: string | null;
  readonly verifiedAt: string;
  readonly timestampExpires: string | null;
  readonly snapshotVersion: number | null;
  readonly rootVersion: number | null;
}

export interface SiteData {
  readonly status: IndexStatus;
  readonly siteUrl: string;
  readonly indexUrl: string;
  readonly indexOrigin: string | null;
  readonly dashboardUrl: string | null;
  readonly securityEmail: string | null;
  readonly holdHours: number;
  readonly categories: readonly CategoryView[];
  readonly capabilities: readonly CapabilityInfo[];
  readonly plugins: readonly PluginView[];
  readonly publishers: readonly PublisherView[];
  readonly advisories: readonly AdvisoryView[];
  readonly featured: readonly string[];
}

export interface SearchDocument {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly publisherName: string;
  readonly tier: Tier;
  readonly status: PluginStatus;
  readonly summary: string;
  readonly categories: readonly string[];
  readonly capabilities: readonly string[];
  readonly platforms: readonly string[];
  readonly compatible: boolean;
  readonly installs: number;
  readonly updatedAt: string;
  readonly icon: string | null;
}

export interface SearchTerms {
  readonly terms: Readonly<Record<string, readonly (readonly [number, number])[]>>;
}
