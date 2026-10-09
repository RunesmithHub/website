import type { Metadata } from "next";
import { AdvisoryCard } from "@/components/hub/advisory-card";
import { IndexUnavailable } from "@/components/site/index-unavailable";
import { PageTitle } from "@/components/site/page-title";
import { REGISTRY } from "@/config/runesmith";
import { siteData } from "@/lib/site/data";

export const metadata: Metadata = { title: "Advisories" };

export default function AdvisoriesPage() {
  const data = siteData();
  return (
    <>
      <PageTitle title="Advisories">
        Every active block and freeze, with its public note. Security advisories are also published in the{" "}
        <a href={`${REGISTRY.url}/security/advisories`} rel="noopener noreferrer" className="text-link hover:underline">
          registry repository
        </a>
        , where you can subscribe to them.
      </PageTitle>
      {!data.status.available ? (
        <IndexUnavailable />
      ) : data.advisories.length === 0 ? (
        <p className="text-muted-foreground">Nothing is blocked or frozen right now.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.advisories.map((advisory) => (
            <AdvisoryCard key={advisory.id} advisory={advisory} />
          ))}
        </div>
      )}
    </>
  );
}
