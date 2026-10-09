import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "my-4 flex gap-3 rounded-[10px] border px-[15px] py-[13px] text-[13.5px] [&>svg]:mt-[2px] [&>svg]:size-[18px] [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "bg-info-subtle border-info/40 [&>svg]:text-info",
        warning: "bg-warning-subtle border-warning/45 [&>svg]:text-warning",
        danger: "bg-destructive-subtle border-destructive/45 [&>svg]:text-destructive",
        success: "bg-success-subtle border-success/40 [&>svg]:text-success",
        accent: "bg-primary-subtle border-primary/40 [&>svg]:text-primary",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="note" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-body" className={cn("text-foreground min-w-0 space-y-1.5 [&_p]:m-0", className)} {...props} />;
}

export { Alert, AlertBody };
