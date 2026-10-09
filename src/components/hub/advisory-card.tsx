import Link from "next/link";
import { StateBadge } from "@/components/hub/state-badge";
import { formatDate } from "@/lib/site/format";
import { REASON_LABELS } from "@/lib/site/labels";
import type { AdvisoryView } from "@/lib/site/types";

export function affectedText(advisory: AdvisoryView): string {
  if (advisory.targetKind === "versions") {
    return advisory.affectedVersions.length > 0 ? `Versions ${advisory.affectedVersions.join(", ")}` : `Versions ${advisory.range ?? ""}`;
  }
  return advisory.targetKind === "publisher" ? "Every plugin and version" : "All versions";
}

export function AdvisoryCard({ advisory }: { advisory: AdvisoryView }) {
  return (
    <article className="bg-card relative rounded-[10px] border px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <StateBadge state={advisory.action === "block" ? "blocked" : "frozen"} />
          <h2 className="m-0 text-sm font-semibold">
            <Link href={`/advisories/${advisory.id}`} className="text-foreground after:absolute after:inset-0 hover:underline">
              {advisory.targetLabel}
            </Link>
          </h2>
          <span className="text-subtle-foreground text-xs">{affectedText(advisory)}</span>
        </div>
        <span className="text-subtle-foreground text-xs">
          No. {advisory.id} · {formatDate(advisory.createdAt)}
        </span>
      </div>
      <p className="text-muted-foreground mt-2 mb-1 text-[13px]">
        <strong className="text-foreground">{REASON_LABELS[advisory.reason]}.</strong> {advisory.note}
      </p>
      <p className="text-muted-foreground m-0 text-[13px]">
        <strong className="text-foreground">What to do:</strong>{" "}
        {advisory.remediation ?? (advisory.action === "freeze" ? "Nothing. You can keep using it." : "Remove it.")}
      </p>
    </article>
  );
}
