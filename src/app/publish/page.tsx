import type { Metadata } from "next";
import { GuideArticle } from "@/components/publish/guide-article";

export const metadata: Metadata = { title: "Publish a plugin" };

export default function PublishPage() {
  return <GuideArticle slug="" />;
}
