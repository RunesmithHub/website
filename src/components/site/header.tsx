import { DownloadIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RUNESMITH } from "@/config/runesmith";
import { HeaderSearch } from "./header-search";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="text-foreground flex items-center gap-2.5 font-bold">
          <img src="/brand/runesmith-64.png" alt="" width={24} height={24} className="size-6" />
          Runesmith Hub
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </nav>
        <span className="flex-1" />
        <HeaderSearch />
        <ThemeToggle />
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <a href={RUNESMITH.downloadUrl} rel="noopener noreferrer">
            <DownloadIcon aria-hidden />
            Download Runesmith
          </a>
        </Button>
        <MobileNav />
      </div>
    </header>
  );
}
