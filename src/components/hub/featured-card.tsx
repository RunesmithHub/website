import Link from "next/link";
import type { PluginView } from "@/lib/site/types";
import { TierBadge } from "./tier-badge";

export function FeaturedCard({ plugin }: { plugin: PluginView }) {
  return (
    <article className="bg-card hover:border-input relative overflow-hidden rounded-[12px] border transition-colors">
      <div className="relative h-[120px] overflow-hidden" data-over-image="">
        {plugin.banner && (
          <img src={plugin.banner.small.src} alt="" width={plugin.banner.small.width} height={plugin.banner.small.height} className="size-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <h3 className="absolute bottom-3 left-3.5 m-0 text-lg font-bold text-white drop-shadow">
          <Link href={`/plugins/${plugin.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary">
            {plugin.name}
          </Link>
        </h3>
      </div>
      <div className="px-3.5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="relative z-10">
            <TierBadge tier={plugin.tier} />
          </span>
          <span className="text-subtle-foreground text-[12.5px]">{plugin.publisherName}</span>
        </div>
        <p className="text-muted-foreground mt-1.5 mb-0 text-[12.5px]">{plugin.summary}</p>
      </div>
    </article>
  );
}
