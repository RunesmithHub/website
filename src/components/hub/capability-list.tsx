import { cn } from "@/lib/utils";
import type { CapabilityView } from "@/lib/site/types";
import { CapabilityIcon } from "./capability-icon";

export function CapabilityList({ capabilities, showDetection = false }: { capabilities: readonly CapabilityView[]; showDetection?: boolean }) {
  if (capabilities.length === 0) {
    return <p className="text-muted-foreground text-[13px]">None. It works only inside the editor, through the SDK.</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {capabilities.map((capability) => (
        <li key={capability.id} className="bg-muted rounded-[10px] border px-4 py-3">
          <div className={cn("flex items-center gap-2 font-semibold", capability.highRisk ? "text-destructive-foreground" : "text-foreground")}>
            <CapabilityIcon id={capability.id} className="size-4" />
            {capability.label}
            {capability.highRisk && <span className="text-[11.5px] font-semibold">High risk</span>}
          </div>
          <p className="text-muted-foreground my-1 text-[13px]">{capability.reason}</p>
          {showDetection && (
            <p className="text-subtle-foreground m-0 text-xs">
              {capability.detected ? "The analysis found code that uses it." : "Declared; the analysis found no direct use (it may go through the SDK)."}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
