import { BanIcon, PauseCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { affectedText } from "@/components/hub/advisory-card";
import { Alert, AlertBody } from "@/components/ui/alert";
import { PLACEHOLDER, findAdvisory, orPlaceholder, siteData } from "@/lib/site/data";
import { formatDate } from "@/lib/site/format";
import { REASON_LABELS } from "@/lib/site/labels";

interface Props {
  readonly params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return orPlaceholder(
    siteData().advisories.map((advisory) => ({ id: String(advisory.id) })),
    { id: PLACEHOLDER },
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const advisory = findAdvisory(Number((await params).id));
  return { title: advisory ? `Notice ${advisory.id}: ${advisory.targetLabel}` : "Page not found" };
}

export default async function AdvisoryPage({ params }: Props) {
  const advisory = findAdvisory(Number((await params).id));
  if (!advisory) {
    notFound();
  }
  const block = advisory.action === "block";
  const publisher = advisory.publisher ? siteData().publishers.find((candidate) => candidate.name === advisory.publisher) : undefined;
  return (
    <div className="mx-auto max-w-[720px]">
      <nav aria-label="Breadcrumb" className="text-subtle-foreground mb-3 text-[12.5px]">
        <Link href="/advisories" className="text-link hover:underline">
          Advisories
        </Link>{" "}
        / No. {advisory.id}
      </nav>
      <h1 className="m-0 text-[22px] font-bold">{advisory.targetLabel}</h1>
      <Alert variant={block ? "danger" : "info"}>
        {block ? <BanIcon aria-hidden /> : <PauseCircleIcon aria-hidden />}
        <AlertBody>
          <p>
            <strong>{block ? "Blocked" : "Installs paused"}</strong> on {formatDate(advisory.createdAt)}. Reason: {REASON_LABELS[advisory.reason]}.
          </p>
          {advisory.note && <p>{advisory.note}</p>}
        </AlertBody>
      </Alert>
      <dl className="bg-card m-0 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded-[10px] border px-5 py-4 text-[13px]">
        <dt className="text-subtle-foreground">Affects</dt>
        <dd className="text-foreground m-0">
          {affectedText(advisory)}
          {advisory.plugin && (
            <>
              {" of "}
              <Link href={`/plugins/${advisory.plugin.id}`} className="text-link hover:underline">
                {advisory.plugin.name}
              </Link>
            </>
          )}
          {publisher && (
            <>
              {" from "}
              <Link href={`/publishers/${publisher.name}`} className="text-link hover:underline">
                {publisher.displayName}
              </Link>
            </>
          )}
        </dd>
        <dt className="text-subtle-foreground">What to do</dt>
        <dd className="text-foreground m-0">{advisory.remediation ?? (block ? "Remove it." : "Nothing. You can keep using it.")}</dd>
        {advisory.advisoryUrl && (
          <>
            <dt className="text-subtle-foreground">Security advisory</dt>
            <dd className="m-0">
              <a href={advisory.advisoryUrl} rel="noopener noreferrer" className="text-link break-all hover:underline">
                {advisory.advisoryUrl}
              </a>
            </dd>
          </>
        )}
      </dl>
      <h2 className="mt-6 mb-2 text-base font-semibold">What Runesmith does</h2>
      <p className="text-muted-foreground">
        {block
          ? "At its next check, Runesmith disables what this notice covers, moves it to quarantine and tells you why. Plugins that depend on it are disabled with it."
          : "Runesmith stops offering new installs and updates of what this notice covers. If you have it installed, it keeps running and Runesmith shows a notice."}
      </p>
    </div>
  );
}
