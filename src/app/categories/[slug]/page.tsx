import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchView } from "@/components/search/search-view";
import { PageTitle } from "@/components/site/page-title";
import { RUNESMITH } from "@/config/runesmith";
import { searchDocuments } from "@/lib/site/build-model";
import { PLACEHOLDER, orPlaceholder, siteData } from "@/lib/site/data";

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return orPlaceholder(
    siteData().categories.map((category) => ({ slug: category.slug })),
    { slug: PLACEHOLDER },
  );
}

function category(slug: string) {
  return siteData().categories.find((candidate) => candidate.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: category((await params).slug)?.name ?? "Page not found" };
}

export default async function CategoryPage({ params }: Props) {
  const found = category((await params).slug);
  if (!found) {
    notFound();
  }
  const data = siteData();
  return (
    <>
      <PageTitle eyebrow="Category" title={found.name}>
        {found.count === 1 ? "1 plugin" : `${found.count} plugins`} in this category.
      </PageTitle>
      <SearchView
        documents={searchDocuments(data.plugins).filter((document) => document.categories.includes(found.name))}
        categories={data.categories}
        apiVersions={RUNESMITH.apiVersions}
        fixedCategory={found.name}
      />
    </>
  );
}
