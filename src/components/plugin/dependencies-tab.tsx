import Link from "next/link";
import { PluginIcon } from "@/components/hub/plugin-icon";
import { TierBadge } from "@/components/hub/tier-badge";
import type { PluginRef, VersionView } from "@/lib/site/types";

function PluginRow({ plugin, detail }: { plugin: PluginRef; detail?: string }) {
  return (
    <li className="hover:bg-hover relative flex items-center gap-3 border-b px-1 py-2.5">
      <PluginIcon name={plugin.name} image={plugin.icon} size="sm" />
      <Link href={`/plugins/${plugin.id}`} className="text-foreground font-semibold after:absolute after:inset-0">
        {plugin.name}
      </Link>
      {plugin.tier && (
        <span className="relative z-10">
          <TierBadge tier={plugin.tier} />
        </span>
      )}
      {detail && <span className="text-subtle-foreground font-mono text-xs">{detail}</span>}
    </li>
  );
}

export function DependenciesTab({ version, dependents }: { version: VersionView | null; dependents: readonly PluginRef[] }) {
  const dependencies = version?.dependencies ?? [];
  return (
    <div>
      <h3 className="mt-0 mb-2 text-sm font-semibold">Depends on</h3>
      {dependencies.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {dependencies.map((dependency) => (
            <PluginRow key={dependency.id} plugin={dependency} detail={`${dependency.range} (${dependency.rangeText})`} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-[13px]">Nothing. It needs only Runesmith.</p>
      )}
      <h3 className="mt-6 mb-2 text-sm font-semibold">Used by</h3>
      {dependents.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {dependents.map((dependent) => (
            <PluginRow key={dependent.id} plugin={dependent} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-[13px]">No plugins depend on it.</p>
      )}
    </div>
  );
}
