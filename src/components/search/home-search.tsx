"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  return (
    <form
      role="search"
      className="relative mx-auto max-w-[560px]"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
      }}
    >
      <SearchIcon className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2" aria-hidden />
      <input
        type="search"
        aria-label="Search plugins"
        placeholder="Search plugins"
        data-search-input="home"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="bg-muted border-primary ring-primary-subtle text-foreground placeholder:text-subtle-foreground h-[46px] w-full rounded-[10px] border pr-12 pl-[42px] text-[15px] ring-4 outline-none"
      />
      <kbd className="text-muted-foreground border-input bg-popover pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-[4px] border border-b-2 px-1.5 py-px text-[11px] font-semibold">
        /
      </kbd>
    </form>
  );
}
