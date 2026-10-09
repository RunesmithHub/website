import type { Metadata } from "next";
import { DocumentPage } from "@/components/site/document-page";
import { readContent } from "@/lib/content";
import { siteData } from "@/lib/site/data";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  const email = siteData().securityEmail;
  const contact = email ? `[${email}](mailto:${email})` : "use GitHub's private vulnerability reporting above.";
  return <DocumentPage eyebrow="Security" title="Report a security problem" source={readContent("security.md").replace("{{email}}", contact)} />;
}
