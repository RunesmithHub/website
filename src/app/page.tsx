import Link from "next/link";
import { FeaturedCard } from "@/components/hub/featured-card";
import { PluginCard } from "@/components/hub/plugin-card";
import { HomeSearch } from "@/components/search/home-search";
import { IndexUnavailable } from "@/components/site/index-unavailable";
import { SectionTitle } from "@/components/site/section-title";
import { listedPlugins, pluginsByIds, siteData } from "@/lib/site/data";

export default function HomePage() {
  const data = siteData();
  const plugins = listedPlugins();
  const official = plugins.filter((plugin) => plugin.tier === "official").slice(0, 6);
  const featured = pluginsByIds(data.featured).slice(0, 3);
  const recent = [...plugins].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 4);
  const popular = [...plugins].sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).slice(0, 4);
  return (
    <>
      <section className="py-7 text-center" aria-labelledby="hero-title">
        <h1 id="hero-title" className="m-0 mb-2 text-[30px] font-bold tracking-tight">
          Plugins for Runesmith
        </h1>
        <p className="text-muted-foreground mx-auto mt-0 mb-5 max-w-[520px]">
          Official, verified and community plugins, built from open source by the hub and signed.
        </p>
        <HomeSearch />
      </section>

      {!data.status.available ? (
        <IndexUnavailable />
      ) : (
        <>
          {official.length > 0 && (
            <section aria-labelledby="official">
              <SectionTitle id="official" href="/search?tier=official" linkLabel="See all">
                Official plugins
              </SectionTitle>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {official.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section aria-labelledby="featured">
              <SectionTitle id="featured">Featured</SectionTitle>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((plugin) => (
                  <FeaturedCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="categories">
            <SectionTitle id="categories">Categories</SectionTitle>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {data.categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="bg-card text-foreground hover:border-input flex items-center justify-between rounded-[8px] border px-3.5 py-[11px] text-[13px] font-medium"
                  >
                    {category.name}
                    <span className="text-subtle-foreground text-xs" aria-label={`${category.count} plugins`}>
                      {category.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-2 grid gap-x-3.5 lg:grid-cols-2">
            <section aria-labelledby="recent">
              <SectionTitle id="recent" href="/search?sort=updated" linkLabel="See all">
                Recently updated
              </SectionTitle>
              <div className="flex flex-col gap-2.5">
                {recent.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            </section>
            <section aria-labelledby="popular">
              <SectionTitle id="popular" href="/search?sort=installs" linkLabel="See all">
                Most installed
              </SectionTitle>
              <div className="flex flex-col gap-2.5">
                {popular.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
