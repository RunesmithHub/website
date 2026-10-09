import type * as React from "react";
import { GuideLayout } from "@/components/publish/guide-layout";

export default function PublishLayout({ children }: { children: React.ReactNode }) {
  return <GuideLayout>{children}</GuideLayout>;
}
