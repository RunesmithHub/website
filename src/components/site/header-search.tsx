"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  if (pathname === "/") {
    return null;
  }
  return (
    <form
      role="search"
      className="relative hidden w-[220px] md:block"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
      }}
    >
      <SearchIcon className="text-subtle-foreground pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2" aria-hidden />
      <Input
        type="search"
        aria-label="Search plugins"
        placeholder="Search plugins"
        data-search-input="header"
        className="pl-8"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}
