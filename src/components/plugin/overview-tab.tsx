import { BookOpenIcon } from "lucide-react";
import { UntrustedMarkdown } from "@/components/hub/markdown";
import type { PluginView, VersionView } from "@/lib/site/types";

function readmeBase(version: VersionView): string {
  return `${version.treeUrl.replace("/tree/", "/blob/")}/`;
}

export function OverviewTab({ plugin, version }: { plugin: PluginView; version: VersionView | null }) {
  return (
    <div>
      {plugin.gallery.length > 0 && (
        <ul className="m-0 mb-4 grid list-none gap-2.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {plugin.gallery.map((item) => (
            <li key={item.large.src}>
              <figure className="m-0">
                <a href={item.large.src} className="block overflow-hidden rounded-[8px] border">
                  <img src={item.small.src} alt={item.caption} width={item.small.width} height={item.small.height} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                </a>
                <figcaption className="text-subtle-foreground mt-1 text-xs">{item.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      {version?.readme ? (
        <UntrustedMarkdown source={version.readme} base={readmeBase(version)} />
      ) : (
        <div className="prose-hub">
          <p>{plugin.summary}</p>
          {version && (
            <p className="flex items-center gap-2">
              <BookOpenIcon className="text-subtle-foreground size-4" aria-hidden />
              <a href={`${readmeBase(version)}README.md`} rel="noopener noreferrer">
                Read the README in the repository at {version.commit.slice(0, 7)}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
