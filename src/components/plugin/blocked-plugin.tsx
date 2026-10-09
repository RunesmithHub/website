import { BanIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertBody } from "@/components/ui/alert";
import { formatDate } from "@/lib/site/format";
import { REASON_LABELS } from "@/lib/site/labels";
import type { PluginView } from "@/lib/site/types";

export function BlockedPlugin({ plugin }: { plugin: PluginView }) {
  const notice = plugin.blocked;
  return (
    <div className="mx-auto max-w-[640px] py-6" data-testid="blocked-plugin">
      <div className="text-subtle-foreground font-mono text-[12.5px]">{plugin.id}</div>
      <h1 className="mt-1 mb-4 text-2xl font-bold">{plugin.name}</h1>
      <Alert variant="danger" className="px-[18px] py-[18px]">
        <BanIcon aria-hidden />
        <AlertBody className="space-y-2">
          <p>
            <strong>Blocked by Runesmith</strong>
          </p>
          <p>
            Reason: {notice?.reason ? REASON_LABELS[notice.reason] : "Not stated"}.{notice?.date && ` Blocked on ${formatDate(notice.date)}.`}
          </p>
          {notice?.note && <p>{notice.note}</p>}
          <p className="flex flex-wrap gap-x-4">
            {notice?.entryId !== null && notice?.entryId !== undefined && (
              <Link href={`/advisories/${notice.entryId}`} className="text-link hover:underline">
                Moderation notice {notice.entryId}
              </Link>
            )}
            {notice?.advisoryUrl && (
              <a href={notice.advisoryUrl} rel="noopener noreferrer" className="text-link hover:underline">
                Security advisory
              </a>
            )}
          </p>
        </AlertBody>
      </Alert>
      <h2 className="mt-6 mb-2 text-base font-semibold">If you have it installed</h2>
      <p className="text-muted-foreground">
        Runesmith has already disabled it and moved it to quarantine at its last check. {notice?.remediation ?? "Remove it from the plugin manager."}
      </p>
    </div>
  );
}
