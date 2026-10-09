import { BanIcon, PauseCircleIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PluginCard } from "@/components/hub/plugin-card";
import { SectionTitle } from "@/components/site/section-title";
import { Alert, AlertBody } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PLACEHOLDER, findPublisher, orPlaceholder, pluginsByIds, siteData } from "@/lib/site/data";
import { formatDate, initials } from "@/lib/site/format";

interface Props {
  readonly params: Promise<{ name: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { name: string }[] {
  return orPlaceholder(
    siteData().publishers.map((publisher) => ({ name: publisher.name })),
    { name: PLACEHOLDER },
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const publisher = findPublisher((await params).name);
  return { title: publisher ? publisher.displayName : "Page not found" };
}

export default async function PublisherPage({ params }: Props) {
  const publisher = findPublisher((await params).name);
  if (!publisher) {
    notFound();
  }
  const blocked = publisher.state === "blocked";
  const plugins = blocked ? [] : pluginsByIds(publisher.pluginIds);
  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-16">
          {publisher.avatar && !blocked && <AvatarImage src={publisher.avatar} alt="" />}
          <AvatarFallback className="text-xl">{initials(publisher.displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="m-0 text-[22px] font-bold">{publisher.displayName}</h1>
          <div className="text-subtle-foreground flex flex-wrap items-center gap-2 text-[12.5px]">
            {publisher.verified && !blocked && (
              <Badge variant="verified">
                <ShieldCheckIcon aria-hidden />
                Verified publisher
              </Badge>
            )}
            <span>
              GitHub {publisher.ownerType === "Organization" ? "organization" : "user"}{" "}
              <a href={`https://github.com/${publisher.ownerLogin}`} rel="noopener noreferrer" className="text-link hover:underline">
                @{publisher.ownerLogin}
              </a>
            </span>
            <span className="font-mono">{publisher.name}</span>
            {publisher.verifiedAt && !blocked && <span>Verified since {formatDate(publisher.verifiedAt)}</span>}
          </div>
        </div>
      </div>
      {publisher.verified && !blocked && (
        <p className="text-muted-foreground mt-4 max-w-[760px]">
          A verified publisher: its GitHub account is established, its repositories protect their default branch and release tags, releases are
          immutable, maintainers use two-factor authentication, it has a security contact, and Runesmith reviews every version before you get it.
        </p>
      )}
      {publisher.state === "suspended" && (
        <Alert variant="info">
          <PauseCircleIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Suspended.</strong> This publisher cannot release new versions for now. Published versions stay available.
            </p>
          </AlertBody>
        </Alert>
      )}
      {blocked && (
        <Alert variant="danger" data-testid="blocked-publisher">
          <BanIcon aria-hidden />
          <AlertBody>
            <p>
              <strong>Blocked by Runesmith.</strong> Every plugin and version from this publisher is blocked. See the{" "}
              <Link href="/advisories" className="text-link hover:underline">
                advisories
              </Link>{" "}
              for details.
            </p>
          </AlertBody>
        </Alert>
      )}
      {!blocked && (
        <section aria-labelledby="plugins">
          <SectionTitle id="plugins">Plugins</SectionTitle>
          {plugins.length > 0 ? (
            <div className="grid gap-3.5 md:grid-cols-2">
              {plugins.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No plugins are listed yet.</p>
          )}
        </section>
      )}
    </>
  );
}
