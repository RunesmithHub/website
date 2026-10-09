"use client";

import { XIcon } from "lucide-react";
import type * as React from "react";
import { createContext, use, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface DialogState {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly titleId: string;
  readonly descriptionId: string;
}

const DialogContext = createContext<DialogState | null>(null);

function useDialog(): DialogState {
  const state = use(DialogContext);
  if (!state) {
    throw new Error("Dialog parts must be inside a Dialog.");
  }
  return state;
}

function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();
  return <DialogContext value={{ open, setOpen: onOpenChange, titleId, descriptionId }}>{children}</DialogContext>;
}

function ModalSurface({ className, children, ...props }: Omit<React.ComponentProps<"dialog">, "open">) {
  const { open, setOpen, titleId, descriptionId } = useDialog();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === ref.current) {
          setOpen(false);
        }
      }}
      className={cn("bg-popover text-foreground border-input shadow-overlay backdrop:bg-scrim m-auto overflow-hidden border p-0", className)}
      {...props}
    >
      {children}
    </dialog>
  );
}

function CloseIcon() {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="text-muted-foreground hover:bg-hover hover:text-foreground absolute top-3 right-3 cursor-pointer rounded-[6px] p-1.5"
    >
      <XIcon className="size-4" aria-hidden />
      <span className="sr-only">Close</span>
    </button>
  );
}

function DialogContent({ className, children, ...props }: Omit<React.ComponentProps<"dialog">, "open">) {
  return (
    <ModalSurface className={cn("w-[min(520px,calc(100%-2rem))] rounded-[12px] open:animate-in open:fade-in-0 open:zoom-in-95", className)} {...props}>
      {children}
      <CloseIcon />
    </ModalSurface>
  );
}

function SheetContent({ className, children, ...props }: Omit<React.ComponentProps<"dialog">, "open">) {
  return (
    <ModalSurface
      className={cn("bg-card mr-0 h-dvh max-h-none w-[min(320px,85vw)] rounded-none border-y-0 border-r-0 p-4 open:animate-in open:slide-in-from-right", className)}
      {...props}
    >
      {children}
      <CloseIcon />
    </ModalSurface>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-[18px] pt-4 pr-12 pb-1.5", className)} {...props} />;
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-[18px] pt-2 pb-4", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("bg-card flex justify-end gap-2 border-t px-[18px] py-3", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return <h2 id={titleId} className={cn("text-foreground m-0 text-[15px] font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"div">) {
  const { descriptionId } = useDialog();
  return <div id={descriptionId} className={cn("text-muted-foreground text-[13px]", className)} {...props} />;
}

function DialogClose({ children }: { children: (close: () => void) => React.ReactNode }) {
  const { setOpen } = useDialog();
  return <>{children(() => setOpen(false))}</>;
}

export { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, SheetContent };
