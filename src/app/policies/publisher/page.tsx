import type { Metadata } from "next";
import { DocumentPage } from "@/components/site/document-page";
import { readContent } from "@/lib/content";

export const metadata: Metadata = { title: "Publisher policy" };

export default function PublisherPolicyPage() {
  return <DocumentPage eyebrow="Policy" title="Publisher policy" source={readContent("policies/publisher.md")} />;
}
