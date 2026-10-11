import {
  RUNESMITH_TARGET,
  TIERS,
  type ImageRef,
  type LanguagePack,
  type ModerationEntry,
  type PluginRecord,
  type Publisher,
  type Tier,
  type VerifiedIndex,
  type VersionRecord,
} from "../hub/model.ts";
import { compareVersionText, parseRange, parseVersion } from "../hub/semver.ts";
import {
  effectivePluginState,
  effectiveVersionState,
  entriesForPlugin,
  entryTargetsVersion,
  isInstallable,
} from "../hub/states.ts";
import { apiRangeText, describeApiRange, supportedApis } from "./compat.ts";
import { HIGH_RISK_CAPABILITIES, slugify } from "./labels.ts";
import { compareLanguages, isEnglish, languageView, namedLanguage, type LanguageNames } from "./languages.ts";
import type {
  AdvisoryView,
  CapabilityView,
  DependencyView,
  FileLink,
  IconSet,
  LanguagePackView,
  LanguageView,
  ModerationNotice,
  PackTranslation,
  PluginRef,
  PluginStatus,
  PluginView,
  PublisherView,
  SearchDocument,
  SiteImage,
  TranslationTarget,
  VersionView,
} from "./types.ts";

export interface RunesmithRelease {
  readonly apiVersions: readonly string[];
  readonly oldestApi: string;
}

export interface ModelInputs {
  readonly index: VerifiedIndex;
  readonly installs: ReadonlyMap<string, number>;
  readonly image: (ref: ImageRef) => SiteImage | null;
  readonly avatar: (publisher: Publisher) => string | null;
  readonly runesmith: RunesmithRelease;
}

export interface SiteModel {
  readonly plugins: PluginView[];
  readonly publishers: PublisherView[];
  readonly advisories: AdvisoryView[];
  readonly languages: LanguageView[];
}

export const VISIBLE: ReadonlySet<PluginStatus> = new Set(["listed", "deprecated", "frozen"]);

function installable(plugin: PluginView): boolean {
  return (plugin.status === "listed" || plugin.status === "deprecated") && plugin.latest !== null;
}

function byTier(a: { readonly tier: Tier }, b: { readonly tier: Tier }): number {
  return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
}

function fileLink(download: VersionRecord["package"]): FileLink | null {
  const url = download?.urls.find((candidate) => candidate.startsWith("https://"));
  return download && url ? { url, length: download.length, sha256: download.sha256 } : null;
}

function repositoryAt(plugin: PluginRecord, commit: string, tree: boolean): string {
  const base = plugin.repository.url.replace(/\/+$/, "");
  const sub = plugin.repository.path && plugin.repository.path !== "." ? `/${plugin.repository.path.replace(/^\.\/|\/$/g, "")}` : "";
  return tree ? `${base}/tree/${commit}${sub}` : `${base}/commit/${commit}`;
}

function notice(entry: ModerationEntry | undefined): ModerationNotice {
  return {
    entryId: entry?.id ?? null,
    reason: entry?.reason ?? null,
    note: entry?.note ?? "",
    date: entry?.createdAt ?? null,
    advisoryUrl: entry?.advisory ?? null,
    remediation: entry?.remediation ?? null,
  };
}

class ModelBuilder {
  private readonly publishers: ReadonlyMap<string, Publisher>;
  private readonly records: ReadonlyMap<string, PluginRecord>;
  private readonly statuses = new Map<string, PluginStatus>();
  private readonly languages = new Map<string, LanguageView>();
  private readonly declaredNames = new Map<string, LanguageNames>();
  private readonly entries: readonly ModerationEntry[];
  private readonly inputs: ModelInputs;

  constructor(inputs: ModelInputs) {
    this.inputs = inputs;
    this.entries = inputs.index.moderation.entries;
    this.publishers = new Map(inputs.index.publishers.publishers.map((publisher) => [publisher.name, publisher]));
    this.records = new Map(inputs.index.plugins.map((plugin) => [plugin.id, plugin]));
    for (const plugin of inputs.index.plugins) {
      this.statuses.set(plugin.id, effectivePluginState(plugin, this.publishers.get(plugin.publisher), this.entries));
    }
    for (const plugin of [...inputs.index.plugins].sort(byTier).filter((candidate) => this.showsMedia(candidate.id))) {
      for (const pack of plugin.versions.flatMap((version) => version.languagePack ?? [])) {
        const key = pack.language.toLowerCase();
        this.declaredNames.set(key, this.declaredNames.get(key) ?? pack);
      }
    }
  }

  language(tag: string): LanguageView {
    const key = tag.toLowerCase();
    const view = this.languages.get(key) ?? languageView(tag, this.declaredNames.get(key));
    this.languages.set(key, view);
    return view;
  }

  private languagePack(pack: LanguagePack): LanguagePackView {
    return {
      language: namedLanguage(this.language(pack.language).tag, { name: pack.name, englishName: pack.englishName }),
      targets: pack.targets.map((id) => this.target(id)),
    };
  }

  private target(id: string): TranslationTarget {
    if (id === RUNESMITH_TARGET) {
      return { id, name: "Runesmith", href: null };
    }
    const record = this.records.get(id);
    return record ? { id, name: record.name, href: `/plugins/${id}` } : { id, name: id, href: null };
  }

  translations(plugin: PluginView, plugins: readonly PluginView[]): PackTranslation[] {
    const packs = new Map<string, PluginView[]>();
    for (const pack of plugins) {
      const tag = pack.languagePack?.language.tag;
      const translates = pack.id !== plugin.id && installable(pack) && pack.languagePack?.targets.some((target) => target.id === plugin.id);
      if (tag && translates && !plugin.languages.some((language) => language.tag === tag)) {
        packs.set(tag, [...(packs.get(tag) ?? []), pack]);
      }
    }
    return [...packs]
      .map(([tag, translating]) => ({
        language: this.language(tag),
        packs: translating.sort((a, b) => byTier(a, b) || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).map((pack) => this.ref(pack.id)),
      }))
      .sort((a, b) => compareLanguages(a.language, b.language));
  }

  private status(id: string): PluginStatus | null {
    return this.statuses.get(id) ?? null;
  }

  private showsMedia(id: string): boolean {
    const status = this.status(id);
    return status !== null && VISIBLE.has(status);
  }

  private icon(plugin: PluginRecord): IconSet | null {
    if (!this.showsMedia(plugin.id)) {
      return null;
    }
    const small = this.inputs.image(plugin.icon["64"]);
    const medium = this.inputs.image(plugin.icon["128"]);
    const large = this.inputs.image(plugin.icon["256"]);
    return small && medium && large ? { small, medium, large } : null;
  }

  ref(id: string): PluginRef {
    const record = this.records.get(id);
    if (!record) {
      return { id, name: id, tier: null, status: null, icon: null };
    }
    const icon = this.showsMedia(id) ? this.inputs.image(record.icon["64"]) : null;
    return { id, name: record.name, tier: record.tier, status: this.status(id), icon };
  }

  private capabilities(version: VersionRecord): CapabilityView[] {
    const labels = this.inputs.index.policy.capabilities;
    return version.capabilities.declared.map((capability) => ({
      id: capability.id,
      label: labels[capability.id]?.label ?? capability.id,
      reason: capability.reason,
      detected: version.capabilities.detected.includes(capability.id),
      highRisk: HIGH_RISK_CAPABILITIES.has(capability.id),
    }));
  }

  private dependencies(version: VersionRecord): DependencyView[] {
    return version.dependencies.map((dependency) => {
      const range = parseRange(dependency.range);
      return {
        ...this.ref(dependency.id),
        range: dependency.range,
        rangeText: range ? describeApiRange(dependency.range) : dependency.range,
      };
    });
  }

  private version(plugin: PluginRecord, record: VersionRecord, media: boolean): VersionView {
    const publisher = this.publishers.get(plugin.publisher);
    const state = effectiveVersionState(plugin, record, publisher, this.entries);
    const blocked = state === "blocked";
    const { apiVersions, oldestApi } = this.inputs.runesmith;
    const apis = supportedApis(record.runesmithApi, apiVersions, oldestApi);
    return {
      version: record.version,
      state,
      prerelease: (parseVersion(record.version)?.prerelease.length ?? 0) > 0,
      installable: isInstallable(state),
      review: { state: record.review.state, at: record.review.at ?? null },
      date: record.publishedAt ?? record.review.at ?? null,
      holdUntil: record.holdUntil ?? null,
      runesmithApi: record.runesmithApi,
      apiText: apiRangeText(record.runesmithApi),
      apiRange: describeApiRange(record.runesmithApi),
      apis,
      compatible: apiVersions[0] !== undefined && apis.includes(apiVersions[0]),
      releaseNotes: record.releaseNotes,
      readme: media ? (record.readme ?? null) : null,
      commit: record.commit,
      tag: record.tag,
      commitUrl: repositoryAt(plugin, record.commit, false),
      treeUrl: repositoryAt(plugin, record.commit, true),
      package: blocked ? null : fileLink(record.package),
      source: fileLink(record.source),
      sbom: fileLink(record.sbom),
      capabilities: this.capabilities(record),
      networkHosts: record.networkHosts,
      platforms: record.platforms,
      dependencies: this.dependencies(record),
      build: record.build,
      attestation: record.attestation ?? null,
      contracts: { assembly: record.contracts.assembly, package: record.contracts.package, packageVersion: record.contracts.packageVersion },
      needsReview: record.analysis.verdict === "review",
      advisoryIds: this.entries.filter((entry) => entryTargetsVersion(entry, plugin, record.version)).map((entry) => entry.id),
      license: record.license ?? null,
      reportUrl: record.reportUrl?.startsWith("https://") ? record.reportUrl : null,
      yankReason: state === "yanked" ? (record.yankReason ?? null) : null,
      languages: record.languagePack ? [] : (record.languages ?? []).map((tag) => this.language(tag)).sort(compareLanguages),
      languagePack: record.languagePack ? this.languagePack(record.languagePack) : null,
    };
  }

  plugin(plugin: PluginRecord): PluginView {
    const status = this.status(plugin.id) ?? "blocked";
    const media = VISIBLE.has(status);
    const publisher = this.publishers.get(plugin.publisher);
    const versions = [...plugin.versions]
      .sort((a, b) => compareVersionText(b.version, a.version))
      .map((record) => this.version(plugin, record, media));
    const published = versions.filter((version) => version.state === "published");
    const latest = published.find((version) => !version.prerelease) ?? published[0] ?? null;
    const current = latest ?? versions.find((version) => version.state === "frozen" || version.state === "yanked") ?? null;
    const dates = published.map((version) => version.date).filter((date): date is string => date !== null);
    const pluginEntries = entriesForPlugin(this.entries, plugin);
    const blockEntry = pluginEntries.find((entry) => entry.action === "block");
    const freezeEntry = pluginEntries.find((entry) => entry.action === "freeze");
    const deprecation = plugin.deprecated;
    return {
      id: plugin.id,
      name: plugin.name,
      publisher: plugin.publisher,
      publisherName: publisher?.displayName ?? plugin.publisher,
      tier: plugin.tier,
      status,
      summary: plugin.summary,
      categories: plugin.categories,
      keywords: plugin.keywords,
      deprecated:
        status === "deprecated" && deprecation
          ? { reason: deprecation.reason, replacement: deprecation.replacement ? this.ref(deprecation.replacement) : null }
          : status === "deprecated"
            ? { reason: "", replacement: null }
            : null,
      repository: { url: plugin.repository.url, path: plugin.repository.path },
      maintainers: plugin.maintainers.map((maintainer) => maintainer.login),
      icon: this.icon(plugin),
      banner: media && plugin.banner ? this.pair(plugin.banner) : null,
      gallery: media
        ? plugin.gallery.flatMap((item) => {
            const pair = this.pair(item);
            return pair ? [{ caption: item.caption, ...pair }] : [];
          })
        : [],
      installs: this.inputs.installs.get(plugin.id) ?? null,
      updatedAt: dates.sort().at(-1) ?? null,
      latest: latest?.version ?? null,
      compatible: published.some((version) => version.compatible) || (current?.compatible ?? false),
      apis: this.inputs.runesmith.apiVersions.filter((api) => published.some((version) => version.apis.includes(api)) || (current?.apis.includes(api) ?? false)),
      apiRange: current?.apiRange ?? null,
      capabilities: current ? current.capabilities.map((capability) => capability.id) : [],
      platforms: current?.platforms ?? [],
      languages: current?.languages ?? [],
      languagePack: current?.languagePack ?? null,
      translations: [],
      versions,
      dependents: this.dependents(plugin.id),
      advisoryIds: this.entries
        .filter((entry) => pluginEntries.includes(entry) || (entry.target.kind === "versions" && entry.target.plugin === plugin.id))
        .map((entry) => entry.id),
      blocked: status === "blocked" ? notice(blockEntry) : null,
      frozen: status === "frozen" ? notice(freezeEntry) : null,
    };
  }

  private pair(source: { small: ImageRef; large: ImageRef }): { small: SiteImage; large: SiteImage } | null {
    const small = this.inputs.image(source.small);
    const large = this.inputs.image(source.large);
    return small && large ? { small, large } : null;
  }

  private dependents(id: string): PluginRef[] {
    return this.inputs.index.plugins
      .filter((other) => other.id !== id && this.showsMedia(other.id))
      .filter((other) => other.versions.some((version) => version.dependencies.some((dependency) => dependency.id === id)))
      .map((other) => this.ref(other.id));
  }

  publisher(publisher: Publisher, plugins: readonly PluginView[]): PublisherView {
    return {
      name: publisher.name,
      displayName: publisher.displayName,
      ownerLogin: publisher.owner.login,
      ownerType: publisher.owner.type,
      state: publisher.state,
      verified: publisher.verified,
      verifiedAt: publisher.verifiedAt ?? null,
      avatar: this.inputs.avatar(publisher),
      pluginIds: plugins.filter((plugin) => plugin.publisher === publisher.name && VISIBLE.has(plugin.status)).map((plugin) => plugin.id),
    };
  }

  advisory(entry: ModerationEntry): AdvisoryView {
    const plugin = entry.target.plugin ? this.records.get(entry.target.plugin) : undefined;
    const publisher = entry.target.publisher ? this.publishers.get(entry.target.publisher) : undefined;
    const affected = plugin
      ? plugin.versions
          .filter((version) => entryTargetsVersion(entry, plugin, version.version))
          .map((version) => version.version)
          .sort((a, b) => compareVersionText(b, a))
      : [];
    const label =
      entry.target.kind === "publisher"
        ? `Every plugin by ${publisher?.displayName ?? entry.target.publisher ?? ""}`
        : entry.target.kind === "versions"
          ? `${plugin?.name ?? entry.target.plugin ?? ""} ${entry.target.range ?? ""}`
          : (plugin?.name ?? entry.target.plugin ?? "");
    return {
      id: entry.id,
      action: entry.action,
      reason: entry.reason,
      note: entry.note,
      advisoryUrl: entry.advisory ?? null,
      remediation: entry.remediation ?? null,
      createdAt: entry.createdAt,
      targetKind: entry.target.kind,
      targetLabel: label.trim(),
      plugin: entry.target.plugin ? this.ref(entry.target.plugin) : null,
      publisher: entry.target.publisher ?? null,
      range: entry.target.range ?? null,
      affectedVersions: affected,
    };
  }
}

export function buildSiteModel(inputs: ModelInputs): SiteModel {
  const builder = new ModelBuilder(inputs);
  const built = inputs.index.plugins.map((plugin) => builder.plugin(plugin));
  const plugins = built.map((plugin) => ({ ...plugin, translations: builder.translations(plugin, built) })).sort((a, b) => a.name.localeCompare(b.name));
  const tags = new Set(plugins.filter((plugin) => VISIBLE.has(plugin.status)).flatMap(availableLanguages));
  const languages = [...tags].filter((tag) => !isEnglish(tag)).map((tag) => builder.language(tag)).sort(compareLanguages);
  const publishers = inputs.index.publishers.publishers
    .map((publisher) => builder.publisher(publisher, plugins))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const advisories = [...inputs.index.moderation.entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((entry) => builder.advisory(entry));
  return { plugins, publishers, advisories, languages };
}

/** The tags of the languages a plugin can be used in: its own, those language packs add, and the one it adds as a pack. */
export function availableLanguages(plugin: PluginView): string[] {
  const pack = plugin.languagePack ? [plugin.languagePack.language] : [];
  return [...new Set([...plugin.languages, ...plugin.translations.map((translation) => translation.language), ...pack].map((language) => language.tag))];
}

export function categoriesOf(names: readonly string[], plugins: readonly PluginView[]): { name: string; slug: string; count: number }[] {
  return names.map((name) => ({
    name,
    slug: slugify(name),
    count: plugins.filter((plugin) => VISIBLE.has(plugin.status) && plugin.categories.includes(name)).length,
  }));
}

/** The words search finds a plugin by: its keywords and, for a language pack, what it is and the names of its language. */
export function searchKeywords(plugin: PluginView): string[] {
  const pack = plugin.languagePack?.language;
  return pack ? [...plugin.keywords, "language pack", pack.name, pack.englishName] : [...plugin.keywords];
}

export function searchDocuments(plugins: readonly PluginView[]): SearchDocument[] {
  return plugins
    .filter((plugin) => VISIBLE.has(plugin.status))
    .map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      publisher: plugin.publisher,
      publisherName: plugin.publisherName,
      tier: plugin.tier,
      status: plugin.status,
      summary: plugin.summary,
      categories: plugin.categories,
      capabilities: plugin.capabilities,
      platforms: plugin.platforms,
      apis: plugin.apis,
      languages: availableLanguages(plugin),
      languagePack: plugin.languagePack !== null,
      installs: plugin.installs ?? 0,
      updatedAt: plugin.updatedAt ?? "",
      icon: plugin.icon?.small.src ?? null,
    }));
}
