import Link from "next/link";
import { UntrustedMarkdown } from "@/components/hub/markdown";
import { StateBadge } from "@/components/hub/state-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/site/format";
import type { PluginView, VersionView } from "@/lib/site/types";
import { cn } from "@/lib/utils";
import { FileLinks } from "./file-links";

export function reviewText(version: VersionView): string {
  if (version.state === "review") {
    return "Waiting for review";
  }
  return version.review.state === "reviewed" ? `Reviewed${version.review.at ? ` on ${formatDate(version.review.at)}` : ""}` : "Checked automatically";
}

function dateText(version: VersionView): string {
  if (version.state === "held" && version.holdUntil) {
    return `Available on ${formatDate(version.holdUntil)}`;
  }
  return formatDate(version.date);
}

export function VersionsTab({ plugin }: { plugin: PluginView }) {
  const shown = plugin.versions.filter((version) => version.state !== "deleted");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Review</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Runs on</TableHead>
          <TableHead>Files</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shown.map((version) => (
          <TableRow key={version.version}>
            <TableCell className="min-w-[180px]">
              <Link
                href={`/plugins/${plugin.id}/versions/${version.version}`}
                className={cn("text-foreground font-mono font-semibold hover:underline", version.state === "yanked" && "line-through")}
              >
                {version.version}
              </Link>
              {version.releaseNotes && version.state !== "blocked" && (
                <UntrustedMarkdown source={version.releaseNotes} base={`${version.treeUrl.replace("/tree/", "/blob/")}/`} className="mt-1 text-xs [&_p]:my-1" />
              )}
            </TableCell>
            <TableCell>
              <StateBadge state={version.state} />
            </TableCell>
            <TableCell className="text-xs">{reviewText(version)}</TableCell>
            <TableCell className="text-xs whitespace-nowrap">{dateText(version)}</TableCell>
            <TableCell className="text-xs">{version.apiText}</TableCell>
            <TableCell className="text-xs">{version.installable || version.state === "frozen" ? <FileLinks version={version} /> : null}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
