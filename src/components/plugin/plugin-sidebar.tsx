import Link from "next/link";
import type * as React from "react";
import { CompatLabel } from "@/components/hub/compat-label";
import { ReportMenu } from "@/components/hub/report-menu";
import { formatDate } from "@/lib/site/format";
import { platformsText, slugify } from "@/lib/site/labels";
import type { PluginView, VersionView } from "@/lib/site/types";

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-subtle-foreground mt-2.5 text-[11.5px]">{term}</dt>
      <dd className="m-0 text-[13px] break-words">{children}</dd>
    </>
  );
}

export function PluginSidebar({ plugin, version, securityEmail }: { plugin: PluginView; version: VersionView | null; securityEmail: string | null }) {
  const repository = plugin.repository.url.replace(/^https:\/\//, "");
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
