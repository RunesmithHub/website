import Link from "next/link";
import type * as React from "react";
import { CompatLabel } from "@/components/hub/compat-label";
import { ReportMenu } from "@/components/hub/report-menu";
import { formatDate } from "@/lib/site/format";
import { platformsText, slugify } from "@/lib/site/labels";
import type { LanguageView, PluginView, VersionView } from "@/lib/site/types";

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-subtle-foreground mt-2.5 text-[11.5px]">{term}</dt>
      <dd className="m-0 text-[13px] break-words">{children}</dd>
    </>
  );
}

function LanguageName({ language }: { language: LanguageView }) {
  return (
    <>
      <span lang={language.tag}>{language.name}</span>
      {language.englishName !== language.name && ` (${language.englishName})`}
    </>
  );
}

export function PluginSidebar({ plugin, version, securityEmail }: { plugin: PluginView; version: VersionView | null; securityEmail: string | null }) {
  const repository = plugin.repository.url.replace(/^https:\/\//, "");
  const languages = version?.languages ?? [];
  const pack = version?.languagePack ?? null;
  return (
    <aside aria-label="About this plugin">
      <dl className="m-0 grid">
        <Row term="Source">
          <a href={version?.treeUrl ?? plugin.repository.url} rel="noopener noreferrer" className="text-link hover:underline">
            {repository}
          </a>
        </Row>
        {version?.license && <Row term="License">{version.license}</Row>}
        <Row term="Plugin ID">
          <span className="font-mono text-xs">{plugin.id}</span>
        </Row>
        <Row term="Categories">
          {plugin.categories.map((category, index) => (
            <span key={category}>
              {index > 0 && ", "}
              <Link href={`/categories/${slugify(category)}`} className="text-link hover:underline">
                {category}
              </Link>
            </span>
          ))}
        </Row>
        {version && (
          <Row term="Compatibility">
            <CompatLabel compatible={version.compatible} range={version.apiRange} />
            {version.compatible && <span className="text-subtle-foreground block text-xs">{version.apiText}</span>}
          </Row>
        )}
        <Row term="Platforms">{platformsText(version?.platforms ?? plugin.platforms)}</Row>
        {languages.length > 0 && (
          <Row term="Languages">
            {languages.map((language, index) => (
              <span key={language.tag}>
                {index > 0 && ", "}
                <LanguageName language={language} />
              </span>
            ))}
          </Row>
        )}
        {pack && (
          <Row term="Language pack">
            <LanguageName language={pack.language} />
          </Row>
        )}
        {pack && pack.targets.length > 0 && (
          <Row term="Translates">
            {pack.targets.map((target, index) => (
              <span key={target.id}>
                {index > 0 && ", "}
                {target.href ? (
                  <Link href={target.href} className="text-link hover:underline">
                    {target.name}
                  </Link>
                ) : (
                  target.name
                )}
              </span>
            ))}
          </Row>
        )}
        {plugin.translations.length > 0 && (
          <Row term="Language packs">
            {plugin.translations.map((translation) => (
              <span key={translation.language.tag} className="block">
                Also available in <span lang={translation.language.tag}>{translation.language.name}</span> through{" "}
                {translation.packs.map((translator, index) => (
                  <span key={translator.id}>
                    {index > 0 && ", "}
                    <Link href={`/plugins/${translator.id}`} className="text-link hover:underline">
                      {translator.name}
                    </Link>
                  </span>
                ))}
              </span>
            ))}
          </Row>
        )}
        {plugin.updatedAt && <Row term="Last updated">{formatDate(plugin.updatedAt)}</Row>}
        <Row term="Maintainers">
          {plugin.maintainers.map((login, index) => (
            <span key={login}>
              {index > 0 && ", "}
              <a href={`https://github.com/${login}`} rel="noopener noreferrer" className="text-link hover:underline">
                @{login}
              </a>
            </span>
          ))}
        </Row>
      </dl>
      <div className="mt-4">
        <ReportMenu pluginId={plugin.id} version={version?.version ?? plugin.latest} repositoryUrl={plugin.repository.url} securityEmail={securityEmail} />
      </div>
    </aside>
  );
}
