import type * as React from "react";

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="text-link mb-2 text-xs font-semibold tracking-[0.08em] uppercase">{eyebrow}</div>}
      <h1 className="m-0 text-[22px] font-bold tracking-tight">{title}</h1>
      {children && <div className="text-muted-foreground mt-2 max-w-[760px] text-[14.5px]">{children}</div>}
    </div>
  );
}
