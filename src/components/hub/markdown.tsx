import type * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);
const UNTRUSTED_REL = "nofollow ugc noopener noreferrer";

export function resolveLink(url: string, base: string): string | null {
  const trimmed = url.trim();
  if (trimmed.startsWith("#")) {
    return trimmed;
  }
  try {
    const resolved = new URL(trimmed, base);
    return ALLOWED_PROTOCOLS.has(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
  }
}

function untrustedComponents(base: string): Components {
  const link = (href: string | undefined, children: React.ReactNode): React.ReactNode => {
    const target = href ? resolveLink(href, base) : null;
    if (!target) {
      return <span data-removed-link="">{children}</span>;
    }
    return (
      <a href={target} rel={UNTRUSTED_REL}>
        {children}
      </a>
    );
  };
  return {
    a: ({ href, children }) => link(href, children),
    img: ({ src, alt }) => link(typeof src === "string" ? src : undefined, `Image: ${alt?.trim() || "untitled"}`),
    h1: ({ children }) => <h2>{children}</h2>,
    h2: ({ children }) => <h3>{children}</h3>,
    h3: ({ children }) => <h4>{children}</h4>,
    h4: ({ children }) => <h5 className="text-foreground font-semibold">{children}</h5>,
    h5: ({ children }) => <h6 className="text-foreground font-semibold">{children}</h6>,
    input: ({ checked, type }) => (type === "checkbox" ? <span aria-label={checked ? "Done" : "Not done"}>{checked ? "[x] " : "[ ] "}</span> : null),
  };
}

export function UntrustedMarkdown({ source, base, className }: { source: string; base: string; className?: string }) {
  return (
    <div className={cn("prose-hub", className)} data-untrusted-content="">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={(url) => url} components={untrustedComponents(base)}>
        {source}
      </ReactMarkdown>
    </div>
  );
}

const trustedComponents: Components = {
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a href={href} rel={external ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  },
};

export function TrustedMarkdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("prose-hub", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={trustedComponents}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
