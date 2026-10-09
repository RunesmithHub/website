import { CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { CapabilityList } from "@/components/hub/capability-list";
import { TierBadge } from "@/components/hub/tier-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { REASON_LABELS } from "@/lib/site/labels";
import type { AdvisoryView, PluginView, VersionView } from "@/lib/site/types";
import { reviewText } from "./versions-tab";

const TIER_TEXT = {
  official: "Published by Runesmith. Every version is read by an administrator before users get it.",
  verified: "A verified publisher. Every version is read by an administrator before users get it.",
  unverified: "Checked by machines only. Runesmith never updates it automatically and asks you to confirm before installing.",
} as const;

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-subtle-foreground">{term}</dt>
      <dd className="text-foreground m-0 min-w-0 break-words">{children}</dd>
    </>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="mt-5 mb-2 text-sm font-semibold">{children}</h3>;
}

export function SecurityTab({ plugin, version, advisories }: { plugin: PluginView; version: VersionView | null; advisories: readonly AdvisoryView[] }) {
  const hosts = version?.networkHosts ?? [];
  return (
    <div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Card>
          <CardTitle>Tier</CardTitle>
          <p className="text-muted-foreground m-0 text-[13px]">
            <TierBadge tier={plugin.tier} /> {TIER_TEXT[plugin.tier]}
          </p>
          <CardTitle className="mt-4">Review</CardTitle>
          <ul className="m-0 list-none p-0 text-[13px]">
            {plugin.versions.slice(0, 5).map((candidate) => (
              <li key={candidate.version} className="text-muted-foreground my-0.5">
                <span className="text-foreground font-mono">{candidate.version}</span>: {reviewText(candidate)}
              </li>
            ))}
          </ul>
        </Card>
        {version && (
          <Card>
            <CardTitle>Build provenance</CardTitle>
            <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              <Field term="Commit">
                <a href={version.commitUrl} rel="noopener noreferrer" className="text-link font-mono hover:underline">
                  {version.commit.slice(0, 12)}
                </a>
              </Field>
              <Field term="Reproducible">
                {version.build.reproducible ? (
                  <Badge variant="success">
                    <CheckIcon aria-hidden />
                    Two builds matched
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <XIcon aria-hidden />
                    Not confirmed
                  </Badge>
                )}
              </Field>
              <Field term="Build">
                {version.build.run.startsWith("https://") ? (
                  <a href={version.build.run} rel="noopener noreferrer" className="text-link hover:underline">
                    Build run
                  </a>
                ) : (
                  version.build.run
                )}{" "}
                <span className="text-subtle-foreground">with .NET SDK {version.build.sdk}</span>
              </Field>
              {version.reportUrl && (
                <Field term="Report">
                  <a href={version.reportUrl} rel="noopener noreferrer" className="text-link hover:underline">
                    Build and analysis
                  </a>
                </Field>
              )}
              <Field term="Attestation">
                {version.attestation ? (
                  <a href={version.attestation} rel="noopener noreferrer" className="text-link hover:underline">
                    View on GitHub
                  </a>
                ) : (
                  "None yet"
                )}
              </Field>
              <Field term="Contracts">
                <span className="font-mono text-xs">
                  {version.contracts.package} {version.contracts.packageVersion}
                </span>
              </Field>
            </dl>
          </Card>
        )}
      </div>

      <SectionHeading>Capabilities</SectionHeading>
      <CapabilityList capabilities={version?.capabilities ?? []} showDetection />
      {hosts.length > 0 && (
        <p className="text-muted-foreground mt-3 text-[13px]">
          <strong className="text-foreground">Network hosts:</strong> {hosts.map((host) => (host === "*" ? "hosts you choose" : host)).join(", ")}
        </p>
      )}

      {version && version.dependencies.length > 0 && (
        <>
          <SectionHeading>Dependencies</SectionHeading>
          <ul className="m-0 list-none p-0 text-[13px]">
            {version.dependencies.map((dependency) => (
              <li key={dependency.id} className="my-1 flex items-center gap-2">
                <Link href={`/plugins/${dependency.id}`} className="text-link hover:underline">
                  {dependency.name}
                </Link>
                {dependency.tier && <TierBadge tier={dependency.tier} />}
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionHeading>Advisories</SectionHeading>
      {advisories.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">None.</p>
      ) : (
        <ul className="m-0 list-none p-0 text-[13px]">
          {advisories.map((advisory) => (
            <li key={advisory.id} className="text-muted-foreground my-1">
              <Link href={`/advisories/${advisory.id}`} className="text-link hover:underline">
                {advisory.action === "block" ? "Blocked" : "Installs paused"}: {advisory.targetLabel}
              </Link>{" "}
              ({REASON_LABELS[advisory.reason]})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
