"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PluginTab {
  readonly id: string;
  readonly label: string;
  readonly content: React.ReactNode;
}

export function PluginTabs({ tabs }: { tabs: readonly PluginTab[] }) {
  const first = tabs[0]?.id ?? "";
  const [active, setActive] = useState(first);
  useEffect(() => {
    const fromHash = (): void => {
      const hash = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === hash)) {
        setActive(hash);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);
  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        setActive(value);
        window.history.replaceState(null, "", value === first ? window.location.pathname : `#${value}`);
      }}
    >
      <TabsList aria-label="Plugin details">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} forceMount>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
