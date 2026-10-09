import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-muted border-input text-foreground placeholder:text-subtle-foreground h-8 w-full min-w-0 rounded-[6px] border px-[11px] text-[13px] transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-primary focus-visible:ring-primary-subtle focus-visible:ring-[3px] focus-visible:outline-none",
        "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
