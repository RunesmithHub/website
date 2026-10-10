import { CheckIcon, XIcon } from "lucide-react";
import { LATEST_API } from "@/config/runesmith";
import { cn } from "@/lib/utils";

export function CompatLabel({ compatible, range, className }: { compatible: boolean; range: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11.5px]", compatible ? "text-success-foreground" : "text-subtle-foreground", className)}>
      {compatible ? <CheckIcon className="size-3" aria-hidden /> : <XIcon className="size-3" aria-hidden />}
      {compatible ? `Works with plugin API ${LATEST_API}` : range ? `Needs plugin API ${range}` : `Needs a plugin API other than ${LATEST_API}`}
    </span>
  );
}
