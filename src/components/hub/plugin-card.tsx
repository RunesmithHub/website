import Link from "next/link";
import { formatCount } from "@/lib/site/format";
import type { PluginView } from "@/lib/site/types";
import { CompatLabel } from "./compat-label";
import { PluginIcon } from "./plugin-icon";
import { StateBadge } from "./state-badge";
import { TierBadge } from "./tier-badge";

export function PluginCard({ plugin }: { plugin: PluginView }) {
  return (
    <article className="bg-card hover:border-input hover:bg-popover relative flex gap-3 rounded-[10px] border p-3.5 transition-colors">
      <PluginIcon name={plugin.name} image={plugin.icon?.medium ?? null} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="m-0 text-sm font-semibold">
            <Link href={`/plugins/${plugin.id}`} className="text-foreground after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary">
              {plugin.name}
            </Link>
          </h3>
          <span className="relative z-10">
            <TierBadge tier={plugin.tier} />
          </span>
          {plugin.status === "frozen" && <StateBadge state="frozen" />}
          {plugin.status === "deprecated" && <StateBadge state="deprecated" />}
        </div>
        <p className="text-subtle-foreground m-0 text-xs">
          {plugin.publisherName}
          {plugin.installs !== null && ` · ${formatCount(plugin.installs)} installs`}
        </p>
        <p className="text-muted-foreground mt-1 mb-0 text-[12.5px] leading-snug">{plugin.summary}</p>
        {plugin.latest && <CompatLabel compatible={plugin.compatible} range={plugin.apiRange} className="mt-1.5" />}
      </div>
    </article>
  );
}
