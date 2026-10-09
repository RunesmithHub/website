import { BanIcon, ClockIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { StateBadge } from "@/components/hub/state-badge";
import { UntrustedMarkdown } from "@/components/hub/markdown";
import { Alert, AlertBody } from "@/components/ui/alert";
import { siteData } from "@/lib/site/data";
import { formatDate } from "@/lib/site/format";
import { REASON_LABELS } from "@/lib/site/labels";
import type { PluginView, VersionView } from "@/lib/site/types";
import { DependenciesTab } from "./dependencies-tab";
import { FileLinks } from "./file-links";
import { PluginHeader } from "./plugin-header";
import { PluginSidebar } from "./plugin-sidebar";
import { PluginTabs } from "./plugin-tabs";
import { PluginWarnings } from "./plugin-warnings";
import { SecurityTab } from "./security-tab";
import { reviewText } from "./versions-tab";

function StateNotice({ version, holdHours }: { version: VersionView; holdHours: number }) {
  const advisories = siteData().advisories.filter((advisory) => version.advisoryIds.includes(advisory.id));
  if (version.state === "blocked") {
    const advisory = advisories.find((candidate) => candidate.action === "block");
    return (
      <Alert variant="danger" data-testid="blocked-version">
        <BanIcon aria-hidden />
        <AlertBody>
          <p>
            <strong>Version {version.version} is blocked.</strong> {advisory ? `Reason: ${REASON_LABELS[advisory.reason]}. ${advisory.note}` : ""}
          </p>
          {advisory?.remediation && <p>{advisory.remediation}</p>}
          {advisory && (
            <p>
              <Link href={`/advisories/${advisory.id}`} className="text-link hover:underline">
                Read the notice
              </Link>
            </p>
          )}
        </AlertBody>
      </Alert>
    );
  }
  if (version.state === "held") {
    return (
      <Alert variant="info">
        <ClockIcon aria-hidden />
        <AlertBody>
          <p>
            <strong>Available on {formatDate(version.holdUntil)}.</strong> New versions of unverified plugins wait {holdHours} hours after passing
            the automated checks.
          </p>
        </AlertBody>
      </Alert>
    );
  }
  if (version.state === "review") {
    return (
      <Alert variant="accent">
        <EyeIcon aria-hidden />
        <AlertBody>
          <p>
            <strong>In review.</strong> An administrator reads this version before it becomes available.
          </p>
        </AlertBody>
      </Alert>
    );
  }
  return null;
}

export function VersionDetails({ plugin, version }: { plugin: PluginView; version: VersionView }) {
  const data = siteData();
  const advisories = data.advisories.filter((advisory) => version.advisoryIds.includes(advisory.id));
  const base = `${version.treeUrl.replace("/tree/", "/blob/")}/`;
  const blocked = version.state === "blocked";
  const overview = (
    <div>
      <dl className="bg-card m-0 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 rounded-[10px] border px-5 py-4 text-[13px]">
        <dt className="text-subtle-foreground">State</dt>
        <dd className="m-0">
          <StateBadge state={version.state} />
        </dd>
        <dt className="text-subtle-foreground">Review</dt>
        <dd className="text-foreground m-0">{reviewText(version)}</dd>
        <dt className="text-subtle-foreground">Published</dt>
        <dd className="text-foreground m-0">{formatDate(version.date) || "Not yet"}</dd>
        <dt className="text-subtle-foreground">Runs on</dt>
        <dd className="text-foreground m-0">{version.apiText}</dd>
        <dt className="text-subtle-foreground">Tag</dt>
        <dd className="m-0 font-mono text-xs">
          <a href={version.commitUrl} rel="noopener noreferrer" className="text-link hover:underline">
            {version.tag} ({version.commit.slice(0, 7)})
          </a>
        </dd>
        {!blocked && (version.installable || version.state === "frozen") && (
          <>
            <dt className="text-subtle-foreground">Files</dt>
            <dd className="m-0">
              <FileLinks version={version} />
            </dd>
          </>
        )}
      </dl>
      {version.releaseNotes && !blocked && (
        <>
          <h2 className="mt-6 mb-2 text-base font-semibold">Release notes</h2>
          <UntrustedMarkdown source={version.releaseNotes} base={base} />
        </>
      )}
      {version.readme && !blocked && (
        <>
          <h2 className="mt-6 mb-2 text-base font-semibold">README</h2>
          <UntrustedMarkdown source={version.readme} base={base} />
        </>
      )}
    </div>
  );
  return (
    <article>
      <PluginHeader plugin={plugin} version={version.version} />
      <PluginWarnings plugin={plugin} version={version} />
      <div className="mx-[18px]">
        <StateNotice version={version} holdHours={data.holdHours} />
      </div>
      <nav aria-label="Breadcrumb" className="text-subtle-foreground mx-[18px] mt-4 text-[12.5px]">
        <Link href={`/plugins/${plugin.id}`} className="text-link hover:underline">
          {plugin.name}
        </Link>{" "}
        / <Link href={`/plugins/${plugin.id}#versions`} className="text-link hover:underline">Versions</Link> / {version.version}
      </nav>
      <div className="mt-4 grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
        <PluginTabs
          tabs={[
            { id: "overview", label: `Version ${version.version}`, content: overview },
            { id: "security", label: "Security", content: <SecurityTab plugin={plugin} version={version} advisories={advisories} /> },
            { id: "dependencies", label: "Dependencies", content: <DependenciesTab version={version} dependents={plugin.dependents} /> },
          ]}
        />
        <PluginSidebar plugin={plugin} version={version} securityEmail={data.securityEmail} />
      </div>
    </article>
  );
}
