"use client";

import { FlagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { REGISTRY } from "@/config/runesmith";

interface ReportMenuProps {
  readonly pluginId: string;
  readonly version: string | null;
  readonly repositoryUrl: string;
  readonly securityEmail: string | null;
}

function details(pluginId: string, version: string | null): string {
  return `Plugin: ${pluginId}\nVersion: ${version ?? ""}\nRunesmith version: \nOperating system: \n\nWhat happened:\n`;
}

function Item({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <DropdownMenuItem asChild>
      <a href={href} rel="noopener noreferrer">
        {title}
        <span className="text-subtle-foreground block text-[11.5px]">{hint}</span>
      </a>
    </DropdownMenuItem>
  );
}

export function ReportMenu({ pluginId, version, repositoryUrl, securityEmail }: ReportMenuProps) {
  const body = encodeURIComponent(details(pluginId, version));
  const subject = encodeURIComponent(`Security report: ${pluginId}${version ? ` ${version}` : ""}`);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid="report-button">
          <FlagIcon aria-hidden />
          Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <Item href={`${REGISTRY.url}/security/advisories/new`} title="It's malicious or a security risk" hint="Private report to Runesmith" />
        {securityEmail && (
          <Item href={`mailto:${securityEmail}?subject=${subject}&body=${body}`} title="Report by email instead" hint={`Private, to ${securityEmail}`} />
        )}
        <Item
          href={`${repositoryUrl.replace(/\/+$/, "")}/issues/new?title=${encodeURIComponent(`Broken: ${pluginId}`)}&body=${body}`}
          title="It's broken or doesn't work"
          hint="An issue in its repository"
        />
        <Item
          href={`${REGISTRY.url}/issues/new?template=policy.yml&title=${encodeURIComponent(`Policy: ${pluginId}`)}&body=${body}`}
          title="It breaks the rules"
          hint="A policy issue in the registry"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
