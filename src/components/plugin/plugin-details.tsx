import { siteData } from "@/lib/site/data";
import type { PluginView, VersionView } from "@/lib/site/types";
import { DependenciesTab } from "./dependencies-tab";
import { OverviewTab } from "./overview-tab";
import { PluginHeader } from "./plugin-header";
import { PluginSidebar } from "./plugin-sidebar";
import { PluginTabs } from "./plugin-tabs";
import { PluginWarnings } from "./plugin-warnings";
import { SecurityTab } from "./security-tab";
import { VersionsTab } from "./versions-tab";

export function defaultVersion(plugin: PluginView): VersionView | null {
  return plugin.versions.find((version) => version.version === plugin.latest) ?? plugin.versions[0] ?? null;
}

export function PluginDetails({ plugin }: { plugin: PluginView }) {
  const data = siteData();
  const version = defaultVersion(plugin);
  const advisories = data.advisories.filter((advisory) => plugin.advisoryIds.includes(advisory.id));
  return (
    <article>
      <PluginHeader plugin={plugin} version={null} />
      <PluginWarnings plugin={plugin} version={null} />
      <div className="mt-[22px] grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
        <PluginTabs
          tabs={[
            { id: "overview", label: "Overview", content: <OverviewTab plugin={plugin} version={version} /> },
            { id: "versions", label: "Versions", content: <VersionsTab plugin={plugin} /> },
            { id: "security", label: "Security", content: <SecurityTab plugin={plugin} version={version} advisories={advisories} /> },
            { id: "dependencies", label: "Dependencies", content: <DependenciesTab version={version} dependents={plugin.dependents} /> },
          ]}
        />
        <PluginSidebar plugin={plugin} version={version} securityEmail={data.securityEmail} />
      </div>
    </article>
  );
}
