export interface InlineScript {
  readonly start: number;
  readonly end: number;
  readonly attributes: string;
  readonly body: string;
}

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const STYLE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTRIBUTE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const EVENT_ATTRIBUTE = /<[a-z][^>]*\son[a-z]+\s*=/i;
const JAVASCRIPT_URL = /\s(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:/i;

export function inlineScripts(html: string): InlineScript[] {
  const scripts: InlineScript[] = [];
  for (const match of html.matchAll(SCRIPT)) {
    const attributes = match[1] ?? "";
    if (/\ssrc\s*=/i.test(attributes) || /type\s*=\s*["']?application\/(ld\+)?json/i.test(attributes)) {
      continue;
    }
    scripts.push({ start: match.index, end: match.index + match[0].length, attributes, body: match[2] ?? "" });
  }
  return scripts;
}

export function inlineStyles(html: string): string[] {
  return [...html.matchAll(STYLE)].map((match) => match[1] ?? "");
}

export function styleAttributes(html: string): string[] {
  return [...html.matchAll(STYLE_ATTRIBUTE)].map((match) => match[1] ?? match[2] ?? "");
}

export function needsUnsafeInline(html: string): string | null {
  if (EVENT_ATTRIBUTE.test(html)) {
    return "an inline event handler attribute";
  }
  if (JAVASCRIPT_URL.test(html)) {
    return "a javascript: URL";
  }
  return null;
}

const RESOURCE_ATTRIBUTE = /<(script|link|img|source|video|audio|iframe|embed|object|track|input)\b[^>]*?\s(src|href|srcset|poster|data)\s*=\s*"([^"]*)"/gi;

export function resourceUrls(html: string): string[] {
  const urls: string[] = [];
  for (const match of html.matchAll(RESOURCE_ATTRIBUTE)) {
    const tag = (match[1] ?? "").toLowerCase();
    const value = match[3] ?? "";
    if (tag === "link" && !/\srel\s*=\s*"[^"]*(stylesheet|preload|icon|manifest|modulepreload|prefetch|apple-touch-icon)/i.test(match[0])) {
      continue;
    }
    urls.push(...(match[2]?.toLowerCase() === "srcset" ? value.split(",").map((part) => part.trim().split(/\s+/)[0] ?? "") : [value]));
  }
  return urls.filter(Boolean);
}

export function cssUrls(css: string): string[] {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi), ...css.matchAll(/@import\s+["']([^"']+)["']/gi)].map((match) => match[1] ?? "");
}

export function isAllowedResource(url: string, allowedOrigins: readonly string[]): boolean {
  if (url.startsWith("data:")) {
    return true;
  }
  if (url.startsWith("//")) {
    return false;
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return true;
  }
  try {
    return allowedOrigins.includes(new URL(url).origin);
  } catch {
    return false;
  }
}
