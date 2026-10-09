"use client";

import { useEffect } from "react";

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function SearchShortcut() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) {
        return;
      }
      const inputs = [...document.querySelectorAll<HTMLInputElement>("[data-search-input]")];
      const target = inputs.find((input) => input.dataset.searchInput !== "header") ?? inputs.find((input) => input.offsetParent !== null);
      if (target) {
        event.preventDefault();
        target.focus();
        target.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return null;
}
