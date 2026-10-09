"use client";

import { AlertTriangleIcon, CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertBody } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { RUNESMITH } from "@/config/runesmith";
import type { CapabilityView, Tier } from "@/lib/site/types";
import { cn } from "@/lib/utils";
import { CapabilityIcon } from "./capability-icon";

export interface InstallOption {
  readonly version: string;
  readonly yanked: boolean;
  readonly prerelease: boolean;
}

interface InstallButtonProps {
  readonly pluginId: string;
  readonly pluginName: string;
  readonly publisherName: string;
  readonly tier: Tier;
  readonly options: readonly InstallOption[];
  readonly defaultVersion: string;
  readonly capabilities: readonly CapabilityView[];
}

export function installLink(pluginId: string, version: string | null): string {
  return `runesmith://hub/plugin/${pluginId}${version ? `?version=${encodeURIComponent(version)}` : ""}`;
}

function optionLabel(option: InstallOption): string {
  return `${option.version}${option.yanked ? " (yanked)" : option.prerelease ? " (pre-release)" : ""}`;
}

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="bg-muted text-foreground rounded border px-1.5 py-px font-mono text-xs">{id}</code>
      <Button
        size="sm"
        onClick={() => {
          void navigator.clipboard.writeText(id).then(() => setCopied(true));
        }}
      >
        {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        {copied ? "Copied" : "Copy ID"}
      </Button>
    </div>
  );
}

export function InstallButton({ pluginId, pluginName, publisherName, tier, options, defaultVersion, capabilities }: InstallButtonProps) {
  const [version, setVersion] = useState(defaultVersion);
  const [warning, setWarning] = useState(false);
  const [opened, setOpened] = useState(false);
  const selected = options.find((option) => option.version === version);
  const href = installLink(pluginId, version === defaultVersion ? null : version);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Popover open={opened} onOpenChange={setOpened}>
        <PopoverAnchor asChild>
          <div className="flex">
            <Button asChild variant="primary" size="lg" className="rounded-r-none">
              <a
                href={href}
                data-testid="install-button"
                onClick={(event) => {
                  if (tier === "unverified") {
                    event.preventDefault();
                    setWarning(true);
                    return;
                  }
                  setOpened(true);
                }}
              >
                <ExternalLinkIcon aria-hidden />
                Open in Runesmith
              </a>
            </Button>
            <Select
              aria-label="Version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="h-[38px] min-w-[104px] rounded-l-none border-l-0"
            >
              {options.map((option) => (
                <option key={option.version} value={option.version}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </PopoverAnchor>
        <PopoverContent data-testid="install-popover" aria-label="Runesmith should open now">
          <p className="text-foreground m-0 font-semibold">Runesmith should open now</p>
          <p className="text-muted-foreground mt-1 mb-0 text-[12.5px]">
            Nothing happened?{" "}
            <a href={RUNESMITH.downloadUrl} rel="noopener noreferrer" className="text-link hover:underline">
              Download Runesmith
            </a>
            , then search for it in the plugin manager.
          </p>
          <CopyId id={pluginId} />
        </PopoverContent>
      </Popover>
      {selected?.yanked && (
        <p className="text-warning-foreground m-0 max-w-[300px] text-right text-xs" data-testid="yanked-warning">
          {version} was withdrawn by its developer. Runesmith installs it only because you asked for this exact version.
        </p>
      )}

      <Dialog open={warning} onOpenChange={setWarning}>
        <DialogContent data-testid="unverified-dialog">
          <DialogHeader>
            <DialogTitle>{pluginName} is unverified</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Alert variant="warning" className="mt-0 mb-3">
              <AlertTriangleIcon aria-hidden />
              <AlertBody>
                <DialogDescription className="text-foreground">
                  {pluginName} hasn&apos;t been reviewed by Runesmith. Its code was checked automatically, but no person has read it. Plugins can
                  access everything you can: your files, your projects and your accounts. Install it only if you trust {publisherName}.
                </DialogDescription>
              </AlertBody>
            </Alert>
            {capabilities.length > 0 && (
              <>
                <h3 className="text-subtle-foreground mt-0 mb-1.5 text-[11.5px] font-semibold tracking-wide uppercase">What it can do</h3>
                <ul className="m-0 mb-3 flex list-none flex-col gap-1.5 p-0">
                  {capabilities.map((capability) => (
                    <li key={capability.id} className="flex gap-2 text-[13px]">
                      <CapabilityIcon id={capability.id} className={cn("mt-[3px] size-4 shrink-0", capability.highRisk ? "text-destructive-foreground" : "text-muted-foreground")} />
                      <span>
                        <span className={cn("font-semibold", capability.highRisk ? "text-destructive-foreground" : "text-foreground")}>{capability.label}.</span>{" "}
                        <span className="text-muted-foreground">{capability.reason}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="text-subtle-foreground m-0 text-[12.5px]">Runesmith will warn you again before installing.</p>
          </DialogBody>
          <DialogFooter>
            <DialogClose>{(close) => <Button onClick={close}>Cancel</Button>}</DialogClose>
            <Button asChild variant="primary">
              <a
                href={href}
                data-testid="continue-button"
                onClick={() => {
                  setWarning(false);
                  setOpened(true);
                }}
              >
                Continue to Runesmith
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
