import Link from "next/link";
import { TrustedMarkdown } from "@/components/hub/markdown";
import { GUIDE_TOPICS } from "@/content/guide";
import { readContent } from "@/lib/content";

export function GuideArticle({ slug }: { slug: string }) {
  const index = GUIDE_TOPICS.findIndex((topic) => topic.slug === slug);
  const topic = GUIDE_TOPICS[index];
  const previous = GUIDE_TOPICS[index - 1];
  const next = GUIDE_TOPICS[index + 1];
  const href = (target: { slug: string }): string => (target.slug ? `/publish/${target.slug}` : "/publish");
  return (
    <article className="max-w-[780px]">
      <div className="text-link mb-2 text-xs font-semibold tracking-[0.08em] uppercase">Publishing guide</div>
      <h1 className="mt-0 mb-4 text-[22px] font-bold">{slug ? topic?.title : "Publish a plugin"}</h1>
      <TrustedMarkdown source={readContent(`publish/${slug || "introduction"}.md`)} />
      <nav aria-label="Guide pages" className="mt-12 flex justify-between gap-4 border-t pt-6">
        {previous ? (
          <Link href={href(previous)} className="bg-card hover:border-input rounded-[10px] border px-4 py-3 text-[13px]">
            <span className="text-subtle-foreground block text-xs">Previous</span>
            {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={href(next)} className="bg-card hover:border-input rounded-[10px] border px-4 py-3 text-right text-[13px]">
            <span className="text-subtle-foreground block text-xs">Next</span>
            {next.title}
          </Link>
        ) : (
          <Link href="/publish/register" className="bg-card hover:border-input rounded-[10px] border px-4 py-3 text-right text-[13px]">
            <span className="text-subtle-foreground block text-xs">Next</span>
            Register a plugin
          </Link>
        )}
      </nav>
    </article>
  );
}
