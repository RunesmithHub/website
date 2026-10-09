"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/search", label: "Plugins", match: ["/search", "/plugins", "/categories", "/publishers"] },
  { href: "/publish", label: "Publish", match: ["/publish"] },
  { href: "/advisories", label: "Advisories", match: ["/advisories"] },
  { href: "/moderation", label: "Moderation", match: ["/moderation"] },
] as const;

export function NavLinks({ vertical = false }: { vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:bg-hover hover:text-foreground rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium",
              active && "bg-hover text-foreground",
              vertical && "block py-2 text-sm",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
