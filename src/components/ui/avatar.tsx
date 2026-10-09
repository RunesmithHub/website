"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root className={cn("relative flex size-16 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn("bg-primary-subtle text-link flex size-full items-center justify-center font-bold", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
