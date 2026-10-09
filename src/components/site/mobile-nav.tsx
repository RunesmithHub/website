"use client";

import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }
  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open the menu" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <MenuIcon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent>
          <DialogTitle className="mb-2 text-sm">Runesmith Hub</DialogTitle>
          <nav aria-label="Main" className="flex flex-col">
            <NavLinks vertical />
          </nav>
        </SheetContent>
      </Dialog>
    </>
  );
}
