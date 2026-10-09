"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { GUIDE_TOPICS } from "@/content/guide";
import { cn } from "@/lib/utils";

export function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [...GUIDE_TOPICS.map((topic) => ({ href: topic.slug ? `/publish/${topic.slug}` : "/publish", title: topic.title })), { href: "/publish/register", title: "Register a plugin" }];
  return (
    <div className="grid gap-7 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Publishing guide" className="lg:sticky lg:top-20 lg:self-start">
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0 lg:flex-col">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:bg-hover hover:text-foreground block rounded-[6px] px-2.5 py-[5px] text-[13px]",
                    active && "bg-primary-subtle text-foreground",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
