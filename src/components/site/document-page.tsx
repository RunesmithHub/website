import { TrustedMarkdown } from "@/components/hub/markdown";
import { PageTitle } from "./page-title";

export function DocumentPage({ eyebrow, title, source }: { eyebrow?: string; title: string; source: string }) {
  return (
    <article className="max-w-[780px]">
      <PageTitle eyebrow={eyebrow} title={title} />
      <TrustedMarkdown source={source} />
    </article>
  );
}
