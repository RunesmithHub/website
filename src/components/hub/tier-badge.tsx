"use client";

import { AlertTriangleIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TIER_DESCRIPTIONS, TIER_LABELS } from "@/lib/site/labels";
import type { Tier } from "@/lib/site/types";

function TierIcon({ tier }: { tier: Tier }) {
  switch (tier) {
    case "official":
      return <img src="/brand/runesmith-64.png" alt="" width={13} height={13} className="rounded-[3px]" />;
    case "verified":
      return <ShieldCheckIcon aria-hidden />;
    case "unverified":
      return <AlertTriangleIcon aria-hidden />;
  }
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={tier} tabIndex={0} aria-description={TIER_DESCRIPTIONS[tier]} className="cursor-default">
          <TierIcon tier={tier} />
          {TIER_LABELS[tier]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{TIER_DESCRIPTIONS[tier]}</TooltipContent>
    </Tooltip>
  );
}
