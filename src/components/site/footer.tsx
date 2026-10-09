import Link from "next/link";
import { REGISTRY } from "@/config/runesmith";
import { siteData } from "@/lib/site/data";
import { formatDate } from "@/lib/site/format";

const LINKS = [
  { href: "/publish", label: "Publishing guide" },
  { href: "/policies/publisher", label: "Publisher policy" },
  { href: "/policies/content", label: "Content policy" },
  { href: "/security", label: "Security" },
  { href: "/advisories", label: "Advisories" },
] as const;

export function SiteFooter() {
  const { status } = siteData();
  return (
    <footer className="text-subtle-foreground mt-16 border-t">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <a href={REGISTRY.url} rel="noopener noreferrer" className="hover:text-foreground">
            Registry on GitHub
          </a>
        </nav>
        <p className="m-0">
          {status.available
            ? `Built from the signed index on ${formatDate(status.verifiedAt)}, snapshot ${status.snapshotVersion ?? ""}.`
            : "The plugin index is not available yet."}
        </p>
      </div>
    </footer>
  );
}
