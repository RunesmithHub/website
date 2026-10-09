import { ArchiveIcon, BanIcon, CheckIcon, ClockIcon, EyeIcon, PauseCircleIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VERSION_STATE_LABELS } from "@/lib/site/labels";
import type { VersionState } from "@/lib/site/types";

type BadgeState = VersionState | "deprecated";

const VARIANTS = {
  published: "success",
  review: "review",
  held: "neutral",
  yanked: "yanked",
  frozen: "frozen",
  blocked: "blocked",
  deleted: "neutral",
  deprecated: "neutral",
} as const;

function StateIcon({ state }: { state: BadgeState }) {
  switch (state) {
    case "published":
      return <CheckIcon aria-hidden />;
    case "review":
      return <EyeIcon aria-hidden />;
    case "held":
      return <ClockIcon aria-hidden />;
    case "frozen":
      return <PauseCircleIcon aria-hidden />;
    case "blocked":
      return <BanIcon aria-hidden />;
    case "deleted":
      return <Trash2Icon aria-hidden />;
    case "deprecated":
      return <ArchiveIcon aria-hidden />;
    case "yanked":
      return null;
  }
}

export function StateBadge({ state }: { state: BadgeState }) {
  return (
    <Badge variant={VARIANTS[state]}>
      <StateIcon state={state} />
      {state === "deprecated" ? "Deprecated" : VERSION_STATE_LABELS[state]}
    </Badge>
  );
}
