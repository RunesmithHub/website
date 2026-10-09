import Link from "next/link";
import type * as React from "react";

export function SectionTitle({ id, children, href, linkLabel }: { id: string; children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mt-8 mb-3 flex items-baseline justify-between">
      <h2 id={id} className="m-0 text-[15px] font-semibold">
        {children}
      </h2>
      {href && (
        <Link href={href} className="text-link text-[12.5px] hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
