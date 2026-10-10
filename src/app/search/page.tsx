import type { Metadata } from "next";
import { SearchView } from "@/components/search/search-view";
import { IndexUnavailable } from "@/components/site/index-unavailable";
import { RUNESMITH } from "@/config/runesmith";
import { searchDocuments } from "@/lib/site/build-model";
import { siteData } from "@/lib/site/data";

export const metadata: Metadata = { title: "Search plugins" };

export default function SearchPage() {
  const data = siteData();
  return (
    <>
      <h1 className="sr-only">Search plugins</h1>
      {data.status.available ? (
        <SearchView documents={searchDocuments(data.plugins)} categories={data.categories} apiVersions={RUNESMITH.apiVersions} />
      ) : (
        <IndexUnavailable />
      )}
    </>
  );
}
