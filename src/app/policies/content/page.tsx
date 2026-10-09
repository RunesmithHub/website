import type { Metadata } from "next";
import { DocumentPage } from "@/components/site/document-page";
import { readContent } from "@/lib/content";

export const metadata: Metadata = { title: "Content policy" };

export default function ContentPolicyPage() {
  return <DocumentPage eyebrow="Policy" title="Content policy" source={readContent("policies/content.md")} />;
}
