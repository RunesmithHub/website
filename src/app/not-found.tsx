import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[560px] py-16 text-center">
      <p className="text-link m-0 text-xs font-semibold tracking-[0.08em] uppercase">404</p>
      <h1 className="mt-2 mb-2 text-[24px] font-bold">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground">The address may be mistyped, or the plugin may no longer be on the hub.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="primary">
          <Link href="/">Go to the home page</Link>
        </Button>
        <Button asChild>
          <Link href="/search">Search plugins</Link>
        </Button>
      </div>
    </div>
  );
}
