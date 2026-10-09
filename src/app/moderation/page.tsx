import type { Metadata } from "next";
import { ModerationDashboard } from "@/components/dashboard/moderation-dashboard";
import { IndexUnavailable } from "@/components/site/index-unavailable";
import { PageTitle } from "@/components/site/page-title";
import { siteData } from "@/lib/site/data";
import type { PluginRef } from "@/lib/site/types";

export const metadata: Metadata = { title: "Moderation" };

export default function ModerationPage() {
  const data = siteData();
  const plugins: Record<string, PluginRef> = Object.fromEntries(
    data.plugins.map((plugin) => [plugin.id, { id: plugin.id, name: plugin.name, tier: plugin.tier, status: plugin.status, icon: plugin.icon?.small ?? null }]),
  );
  return (
    <>
      <PageTitle title="Moderation">
        What is waiting for review, what is in its hold, and what Runesmith has acted on. Each row links to the issue or pull request where it
        happens.
      </PageTitle>
      {data.dashboardUrl ? <ModerationDashboard url={data.dashboardUrl} plugins={plugins} /> : <IndexUnavailable />}
    </>
  );
}
