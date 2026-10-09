"use client";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { useEffect, useState } from "react";
import { PluginIcon } from "@/components/hub/plugin-icon";
import { StateBadge } from "@/components/hub/state-badge";
import { TierBadge } from "@/components/hub/tier-badge";
import { Alert, AlertBody } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REVIEW_TARGET_HOURS, TRIGGER_LABELS, parseDashboard, type Dashboard } from "@/lib/dashboard";
import { REASON_LABELS } from "@/lib/site/labels";
import type { ModerationReason, PluginRef } from "@/lib/site/types";
import { cn } from "@/lib/utils";

type Load = { state: "loading" } | { state: "failed" } | { state: "ready"; dashboard: Dashboard };

function hoursSince(iso: string | null, now: number): number {
  return iso ? Math.max(0, (now - Date.parse(iso)) / 3_600_000) : 0;
}

function age(hours: number): string {
  return hours >= 48 ? `${Math.floor(hours / 24)} days` : hours >= 1 ? `${Math.floor(hours)} hours` : "under an hour";
}

function timeLeft(iso: string | null, now: number): string {
  const minutes = iso ? Math.max(0, Math.round((Date.parse(iso) - now) / 60_000)) : 0;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function reasonText(reason: string): string {
  return REASON_LABELS[reason as ModerationReason] ?? reason;
}

function Linked({ url, children }: { url: string | null; children: React.ReactNode }) {
  return url ? (
    <a href={url} rel="noopener noreferrer" className="hover:underline">
      {children}
    </a>
  ) : (
    <>{children}</>
  );
}

function PluginName({ id, plugins }: { id: string; plugins: Readonly<Record<string, PluginRef>> }) {
  const plugin = plugins[id];
  return (
    <span className="inline-flex items-center gap-1.5">
      <PluginIcon name={plugin?.name ?? id} image={plugin?.icon ?? null} size="sm" className="size-5 rounded-[5px] text-[9px]" />
      {plugin ? (
        <Link href={`/plugins/${id}`} className="text-foreground font-semibold hover:underline">
          {plugin.name}
        </Link>
      ) : (
        <span className="text-foreground font-mono font-semibold">{id}</span>
      )}
    </span>
  );
}

function Stat({ value, label, alert = false }: { value: number; label: string; alert?: boolean }) {
  return (
    <Card className={cn("px-4 py-3", alert && value > 0 && "border-warning/50")}>
      <div className={cn("text-2xl font-bold", alert && value > 0 ? "text-warning-foreground" : "text-foreground")}>{value}</div>
      <div className="text-subtle-foreground text-xs">{label}</div>
    </Card>
  );
}

function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the dashboard" className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-[66px]" />
        ))}
      </div>
      <Skeleton className="h-[220px]" />
    </div>
  );
}

export function ModerationDashboard({ url, plugins }: { url: string; plugins: Readonly<Record<string, PluginRef>> }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store", credentials: "omit" })
      .then((response) => (response.ok ? (response.json() as Promise<unknown>) : Promise.reject(new Error(String(response.status)))))
      .then((value) => {
        if (!cancelled) {
          setLoad({ state: "ready", dashboard: parseDashboard(value) });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoad({ state: "failed" });
        }
      });
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [url]);

  if (load.state === "loading") {
    return <Loading />;
  }
  if (load.state === "failed") {
    return (
      <Alert variant="warning">
        <AlertTriangleIcon aria-hidden />
        <AlertBody>
          <p>The dashboard could not be loaded. It is published hourly next to the index; try again in a few minutes.</p>
        </AlertBody>
      </Alert>
    );
  }
  const { dashboard } = load;
  const queue = [...dashboard.reviewQueue].sort((a, b) => (a.since ?? "").localeCompare(b.since ?? ""));
  const overdue = queue.filter((item) => hoursSince(item.since, now) > REVIEW_TARGET_HOURS).length;
  const openReports = dashboard.reports.reduce((total, report) => total + report.count, 0);

  return (
    <div data-testid="dashboard">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-subtle-foreground m-0 text-[12.5px]">
          {dashboard.generatedAt ? `Updated ${age(hoursSince(dashboard.generatedAt, now))} ago from the registry.` : "Updated from the registry."} Public and
          read-only.
        </p>
        <Badge>
          <RefreshCwIcon aria-hidden />
          Hourly
        </Badge>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat value={queue.length} label="In review" />
        <Stat value={overdue} label="Past the 3-day target" alert />
        <Stat value={dashboard.held.length} label="Held" />
        <Stat value={dashboard.auditFlags.length} label="Audit flags" />
        <Stat value={openReports} label="Open public reports" />
      </div>
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5">
          <Table aria-label="Review queue">
            <TableHeader>
              <TableRow>
                <TableHead>Review queue, oldest first</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Nothing is waiting for review.</TableCell>
                </TableRow>
              )}
              {queue.map((item) => {
                const hours = hoursSince(item.since, now);
                return (
                  <TableRow key={`${item.plugin}@${item.version}`}>
                    <TableCell>
                      <PluginName id={item.plugin} plugins={plugins} />{" "}
                      <Linked url={item.url}>
                        <span className="font-mono text-xs">{item.version}</span>
                      </Linked>
                    </TableCell>
                    <TableCell>{item.tier && <TierBadge tier={item.tier} />}</TableCell>
                    <TableCell className="text-xs">{item.triggers.map((trigger) => TRIGGER_LABELS[trigger] ?? "A review rule matched").join(", ")}</TableCell>
                    <TableCell className={cn("text-xs whitespace-nowrap", hours > REVIEW_TARGET_HOURS && "text-warning-foreground font-semibold")}>{age(hours)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Table aria-label="Held versions">
            <TableHeader>
              <TableRow>
                <TableHead>Held</TableHead>
                <TableHead>Available in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.held.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2}>No versions are in their hold.</TableCell>
                </TableRow>
              )}
              {dashboard.held.map((item) => (
                <TableRow key={`${item.plugin}@${item.version}`}>
                  <TableCell>
                    <PluginName id={item.plugin} plugins={plugins} />{" "}
                    <Linked url={item.url}>
                      <span className="font-mono text-xs">{item.version}</span>
                    </Linked>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{timeLeft(item.until, now)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Table aria-label="Recent actions">
            <TableHeader>
              <TableRow>
                <TableHead>Recent actions</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.actions.map((item) => (
                <TableRow key={`${item.target}-${item.at ?? ""}`}>
                  <TableCell>
                    <Linked url={item.url}>
                      <span className="text-foreground font-mono text-xs">{item.target}</span>
                    </Linked>
                    <div className="text-subtle-foreground text-xs">{item.at?.slice(0, 10)}</div>
                  </TableCell>
                  <TableCell>
                    {item.action === "block" ? <StateBadge state="blocked" /> : item.action === "freeze" ? <StateBadge state="frozen" /> : <Badge>{item.action}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{reasonText(item.reason)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle>Audit flags</CardTitle>
            {dashboard.auditFlags.length === 0 && <p className="text-muted-foreground m-0 text-[13px]">None.</p>}
            {dashboard.auditFlags.map((flag) => (
              <div key={`${flag.plugin}-${flag.kind}`} className="border-b py-2 last:border-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <PluginName id={flag.plugin} plugins={plugins} />
                  <Badge variant="warning" className="h-[18px]">
                    {flag.kind}
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-1 text-[12.5px]">
                  <Linked url={flag.url}>{flag.note}</Linked>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitle>Rejected recently</CardTitle>
            {dashboard.rejected.length === 0 && <p className="text-muted-foreground m-0 text-[13px]">None.</p>}
            {dashboard.rejected.map((item) => (
              <div key={`${item.plugin}@${item.version}`} className="flex flex-wrap items-center gap-1.5 py-1.5 text-[13px]">
                <PluginName id={item.plugin} plugins={plugins} />
                <Linked url={item.url}>
                  <span className="font-mono text-xs">{item.version}</span>
                </Linked>
                <span className="text-subtle-foreground ml-auto text-xs">{item.reason}</span>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitle>Open public reports</CardTitle>
            {dashboard.reports.map((item) => (
              <div key={item.plugin} className="flex items-center gap-1.5 py-1.5 text-[13px]">
                <PluginName id={item.plugin} plugins={plugins} />
                <span className="ml-auto">
                  <Linked url={item.url}>
                    <Badge>{item.count}</Badge>
                  </Linked>
                </span>
              </div>
            ))}
            <p className="text-subtle-foreground mt-2 mb-0 text-xs">Private reports are not shown.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
