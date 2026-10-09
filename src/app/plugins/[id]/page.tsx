import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockedPlugin } from "@/components/plugin/blocked-plugin";
import { DeletedPlugin } from "@/components/plugin/deleted-plugin";
import { PluginDetails } from "@/components/plugin/plugin-details";
import { PLACEHOLDER, findPlugin, orPlaceholder, siteData } from "@/lib/site/data";

interface Props {
  readonly params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return orPlaceholder(
    siteData().plugins.map((plugin) => ({ id: plugin.id })),
    { id: PLACEHOLDER },
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plugin = findPlugin((await params).id);
  if (!plugin) {
    return { title: "Page not found" };
  }
  return { title: plugin.name, description: plugin.status === "blocked" ? undefined : plugin.summary };
}

export default async function PluginPage({ params }: Props) {
  const plugin = findPlugin((await params).id);
  if (!plugin) {
    notFound();
  }
  switch (plugin.status) {
    case "blocked":
      return <BlockedPlugin plugin={plugin} />;
    case "deleted":
      return <DeletedPlugin plugin={plugin} />;
    default:
      return <PluginDetails plugin={plugin} />;
  }
}
