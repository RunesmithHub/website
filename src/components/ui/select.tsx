import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, wrapperClassName, children, ...props }: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div data-slot="select" className={cn("relative", wrapperClassName)}>
      <select
        className={cn(
          "bg-muted border-input text-foreground h-8 w-full cursor-pointer appearance-none rounded-[6px] border pr-8 pl-[11px] text-[13px] outline-none",
          "focus-visible:border-primary focus-visible:ring-primary-subtle focus-visible:ring-[3px] focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="text-subtle-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" aria-hidden />
    </div>
  );
}

export { Select };
