import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-[7px] rounded-[6px] border text-[13px] font-semibold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-popover border-input text-foreground hover:bg-hover",
        primary: "bg-primary-fill text-primary-foreground hover:bg-primary-fill-hover border-transparent",
        ghost: "text-muted-foreground hover:bg-hover hover:text-foreground border-transparent bg-transparent",
        link: "text-link h-auto border-transparent p-0 underline-offset-2 hover:underline",
      },
      size: {
        default: "h-8 px-[13px]",
        sm: "h-[26px] px-[9px] text-xs",
        lg: "h-[38px] px-[18px] text-sm",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
