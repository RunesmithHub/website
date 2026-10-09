"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const STORAGE_KEY = "hub-theme";
const listeners = new Set<() => void>();

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable; the choice then lasts for this page only.
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark" as Theme);
  const next: Theme = theme === "light" ? "dark" : "light";
  return (
    <Button variant="ghost" size="icon" aria-label={`Switch to the ${next} theme`} data-testid="theme-toggle" onClick={() => setTheme(next)}>
      {theme === "light" ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
    </Button>
  );
}
