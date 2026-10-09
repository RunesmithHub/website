import { AlertTriangleIcon, ArchiveIcon, EyeIcon, PauseCircleIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertBody } from "@/components/ui/alert";
import type { PluginView, VersionView } from "@/lib/site/types";

export function PluginWarnings({ plugin, version }: { plugin: PluginView; version: VersionView | null }) {
  const newestInReview = plugin.tier !== "unverified" ? plugin.versions.find((candidate) => candidate.state === "review") : undefined;
  return (
    <div className="mx-[18px]">
      {plugin.tier === "unverified" && plugin.status !== "frozen" && (
        <Alert variant="warning" data-testid="unverified-warning">
          <AlertTriangleIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Unverified.</strong> Checked automatically. No person at Runesmith has read this code. Runesmith will ask you to confirm
              before installing.
            </p>
          </AlertBody>
        </Alert>
      )}
      {plugin.frozen && (
        <Alert variant="info" data-testid="frozen-notice">
          <PauseCircleIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Installs paused.</strong> New installs are paused while Runesmith looks into a report. If you have it installed, you can keep
              using it.
            </p>
            {plugin.frozen.note && <p className="text-muted-foreground">{plugin.frozen.note}</p>}
          </AlertBody>
        </Alert>
      )}
      {plugin.deprecated && (
        <Alert variant="accent" data-testid="deprecated-notice">
          <ArchiveIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Deprecated.</strong> {plugin.deprecated.reason || "No longer maintained."}{" "}
              {plugin.deprecated.replacement && (
                <>
                  Its developer suggests{" "}
                  <Link href={`/plugins/${plugin.deprecated.replacement.id}`} className="text-link hover:underline">
                    {plugin.deprecated.replacement.name}
                  </Link>{" "}
                  instead.
                </>
              )}
            </p>
          </AlertBody>
        </Alert>
      )}
      {version?.state === "yanked" && (
        <Alert variant="warning" data-testid="yanked-notice">
          <AlertTriangleIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Version {version.version} was withdrawn by its developer.</strong> It is installed only when you ask for this exact version.
              {plugin.latest && ` The newest version is ${plugin.latest}.`}
            </p>
            {version.yankReason && <p data-testid="yank-reason">Reason: {version.yankReason}</p>}
          </AlertBody>
        </Alert>
      )}
      {newestInReview && !version && (
        <p className="text-subtle-foreground mt-3 mb-0 flex items-center gap-1.5 text-[12.5px]">
          <EyeIcon className="size-3.5" aria-hidden />
          Version {newestInReview.version} is in review. It becomes available after Runesmith approves it.
        </p>
      )}
    </div>
  );
}
