import Link from "next/link";
import { InstallButton } from "@/components/hub/install-button";
import { PluginIcon } from "@/components/hub/plugin-icon";
import { StateBadge } from "@/components/hub/state-badge";
import { TierBadge } from "@/components/hub/tier-badge";
import { formatCount } from "@/lib/site/format";
import type { PluginView } from "@/lib/site/types";
import { cn } from "@/lib/utils";
import { canInstall, installOptions } from "./install-options";

export function PluginHeader({ plugin, version }: { plugin: PluginView; version: string | null }) {
  const selected = plugin.versions.find((candidate) => candidate.version === version);
  const installable = canInstall(plugin) && (!selected || selected.installable);
  const defaultVersion = selected?.installable ? selected.version : plugin.latest;
  return (
    <header>
      {plugin.banner ? (
        <div className="relative -mb-6 h-[150px] overflow-hidden rounded-[12px] border">
          <img
            src={plugin.banner.large.src}
            alt=""
            width={plugin.banner.large.width}
            height={plugin.banner.large.height}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="h-3" />
      )}
      <div className="relative flex flex-wrap items-end gap-[18px] px-[18px]">
        <PluginIcon name={plugin.name} image={plugin.icon?.large ?? null} size="xl" className={cn(plugin.banner && "border-background border-4")} />
        <div className="min-w-0 pb-1">
          <h1 className="m-0 text-2xl font-bold tracking-tight">{plugin.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link href={`/publishers/${plugin.publisher}`} className="text-link hover:underline">
              {plugin.publisherName}
            </Link>
            <TierBadge tier={plugin.tier} />
            {plugin.status === "frozen" && <StateBadge state="frozen" />}
            {plugin.status === "deprecated" && <StateBadge state="deprecated" />}
            <span className="text-subtle-foreground">
              {plugin.installs !== null && `${formatCount(plugin.installs)} installs · `}
              <span className="font-mono">{selected?.version ?? plugin.latest ?? plugin.versions[0]?.version ?? ""}</span>
            </span>
          </div>
        </div>
        {installable && defaultVersion && (
          <div className="ml-auto pb-1">
            <InstallButton
              pluginId={plugin.id}
              pluginName={plugin.name}
              publisherName={plugin.publisherName}
              tier={plugin.tier}
              options={installOptions(plugin)}
              defaultVersion={defaultVersion}
              capabilities={(selected ?? plugin.versions.find((candidate) => candidate.version === plugin.latest))?.capabilities ?? []}
            />
          </div>
        )}
      </div>
      <p className="text-foreground mx-[18px] mt-3 mb-0 text-[14.5px]">{plugin.summary}</p>
    </header>
  );
}
