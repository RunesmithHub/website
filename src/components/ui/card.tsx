import type * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("bg-card rounded-[10px] border px-5 py-[18px]", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-foreground mb-2 text-sm font-semibold", className)} {...props} />;
}

export { Card, CardTitle };
