import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VersionDetails } from "@/components/plugin/version-details";
import { VISIBLE } from "@/lib/site/build-model";
import { PLACEHOLDER, findPlugin, orPlaceholder, siteData } from "@/lib/site/data";

interface Props {
  readonly params: Promise<{ id: string; version: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { id: string; version: string }[] {
  return orPlaceholder(
    siteData()
      .plugins.filter((plugin) => VISIBLE.has(plugin.status))
      .flatMap((plugin) => plugin.versions.filter((version) => version.state !== "deleted").map((version) => ({ id: plugin.id, version: version.version }))),
    { id: PLACEHOLDER, version: PLACEHOLDER },
  );
}

async function resolve(params: Props["params"]) {
  const { id, version } = await params;
  const plugin = findPlugin(id);
  const record = plugin?.versions.find((candidate) => candidate.version === decodeURIComponent(version));
  return plugin && record && VISIBLE.has(plugin.status) ? { plugin, record } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve(params);
  return { title: found ? `${found.plugin.name} ${found.record.version}` : "Page not found" };
}

export default async function VersionPage({ params }: Props) {
  const found = await resolve(params);
  if (!found) {
    notFound();
  }
  return <VersionDetails plugin={found.plugin} version={found.record} />;
}
