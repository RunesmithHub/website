import { CheckIcon, XIcon } from "lucide-react";
import { RUNESMITH } from "@/config/runesmith";
import { cn } from "@/lib/utils";

export function CompatLabel({ compatible, className }: { compatible: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11.5px]", compatible ? "text-success-foreground" : "text-subtle-foreground", className)}>
      {compatible ? <CheckIcon className="size-3" aria-hidden /> : <XIcon className="size-3" aria-hidden />}
      {compatible ? `Works with Runesmith ${RUNESMITH.version}` : `Needs a different Runesmith than ${RUNESMITH.version}`}
    </span>
  );
}
