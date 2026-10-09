import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-full border border-transparent px-2 align-middle text-[11.5px] font-semibold whitespace-nowrap [&_img]:size-[13px] [&_svg]:size-[13px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        official: "bg-primary-fill text-primary-foreground",
        verified: "bg-success-subtle text-success-foreground border-success/35",
        unverified: "border-warning text-warning-foreground bg-transparent",
        frozen: "bg-info-subtle text-info-foreground",
        blocked: "bg-destructive-subtle text-destructive-foreground",
        neutral: "bg-hover text-muted-foreground",
        yanked: "bg-hover text-subtle-foreground line-through",
        review: "bg-primary-subtle text-link",
        success: "bg-success-subtle text-success-foreground",
        warning: "bg-warning-subtle text-warning-foreground",
        danger: "bg-destructive-subtle text-destructive-foreground",
        info: "bg-info-subtle text-info-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
