import type * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("bg-hover animate-pulse rounded-[6px]", className)} {...props} />;
}

export { Skeleton };
