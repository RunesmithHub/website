import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/publish/guide-article";
import { GUIDE_TOPICS } from "@/content/guide";

interface Props {
  readonly params: Promise<{ topic: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { topic: string }[] {
  return GUIDE_TOPICS.filter((topic) => topic.slug).map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  return { title: GUIDE_TOPICS.find((candidate) => candidate.slug === topic)?.title ?? "Publishing guide" };
}

export default async function GuideTopicPage({ params }: Props) {
  const { topic } = await params;
  if (!GUIDE_TOPICS.some((candidate) => candidate.slug === topic && topic)) {
    notFound();
  }
  return <GuideArticle slug={topic} />;
}
