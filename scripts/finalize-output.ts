import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SiteData } from "../src/lib/site/types.ts";
import { COMMON_HEADERS, contentSecurityPolicy, sha256Source } from "./lib/csp.ts";
import { cssUrls, inlineScripts, inlineStyles, isAllowedResource, needsUnsafeInline, resourceUrls, styleAttributes } from "./lib/html.ts";

const root = process.cwd();
const out = path.join(root, "out");
const FLIGHT_DIR = path.join(out, "_next", "static", "flight");
const MAX_RULES = 100;
const MAX_LINE = 2000;
const PLACEHOLDER_ROUTES = ["plugins", "publishers", "categories", "advisories"];

class OutputError extends Error {}

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name));
}

function routeOf(file: string): string {
  const relative = path.relative(out, file).split(path.sep).join("/");
  if (relative === "index.html") {
    return "/";
  }
  return `/${relative.replace(/\/index\.html$/, "/").replace(/\.html$/, "")}`;
}

async function removePlaceholders(): Promise<void> {
  for (const route of PLACEHOLDER_ROUTES) {
    const base = path.join(out, route);
    await rm(path.join(base, "_"), { recursive: true, force: true });
    await rm(path.join(base, "_.html"), { force: true });
    await rm(path.join(base, "_.txt"), { force: true });
    if ((await readdir(base).catch(() => ["missing"])).length === 0) {
      await rm(base, { recursive: true });
    }
  }
}

async function externalizeFlight(html: string): Promise<string> {
  const flight = inlineScripts(html).filter((script) => script.body.startsWith("self.__next_f.push("));
  if (flight.length === 0) {
    return html;
  }
  const body = `${flight.map((script) => script.body).join(";\n")};\n`;
  const name = `${createHash("sha256").update(body).digest("hex").slice(0, 20)}.js`;
  await mkdir(FLIGHT_DIR, { recursive: true });
  await writeFile(path.join(FLIGHT_DIR, name), body);
  let result = "";
  let cursor = 0;
  flight.forEach((script, index) => {
    result += html.slice(cursor, script.start);
    if (index === 0) {
      result += `<script src="/_next/static/flight/${name}"></script>`;
    }
    cursor = script.end;
  });
  return result + html.slice(cursor);
}

interface PageResult {
  readonly route: string;
  readonly scriptHashes: readonly string[];
  readonly styleHashes: readonly string[];
  readonly styleAttributeHashes: readonly string[];
}

async function processPage(file: string, allowedOrigins: readonly string[]): Promise<PageResult> {
  const route = routeOf(file);
  const html = await externalizeFlight(await readFile(file, "utf8"));
  await writeFile(file, html);
  const unsafe = needsUnsafeInline(html);
  if (unsafe) {
    throw new OutputError(`${route} contains ${unsafe}, which would need 'unsafe-inline'`);
  }
  const external = resourceUrls(html).filter((url) => !isAllowedResource(url, allowedOrigins));
  if (external.length > 0) {
    throw new OutputError(`${route} loads resources from other hosts: ${external.join(", ")}`);
  }
  return {
    route,
    scriptHashes: inlineScripts(html).map((script) => sha256Source(script.body)),
    styleHashes: inlineStyles(html).map(sha256Source),
    styleAttributeHashes: styleAttributes(html).map(sha256Source),
  };
}

// Style hashes are shared site-wide to stay within the headers file rule limit; styles cannot run code.
function policies(pages: readonly PageResult[], connectOrigins: readonly string[]): Map<string, string[]> {
  const styleHashes = pages.flatMap((page) => page.styleHashes);
  const styleAttributeHashes = pages.flatMap((page) => page.styleAttributeHashes);
  const groups = new Map<string, string[]>();
  for (const page of pages) {
    const policy = contentSecurityPolicy({ scriptHashes: page.scriptHashes, styleHashes, styleAttributeHashes, connectOrigins });
    groups.set(policy, [...(groups.get(policy) ?? []), page.route]);
  }
  return groups;
}

function headerRules(groups: ReadonlyMap<string, readonly string[]>): string {
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  const [common, ...others] = ordered;
  if (!common) {
    throw new OutputError("no pages were found in out/");
  }
  const lines: string[] = ["/*", ...COMMON_HEADERS.map(([name, value]) => `  ${name}: ${value}`), `  Content-Security-Policy: ${common[0]}`, ""];
  let rules = 1;
  for (const [policy, routes] of others) {
    for (const route of routes) {
      const patterns = route === "/" ? ["/"] : route.endsWith("/") ? [route] : [route, `${route}.html`];
      for (const pattern of patterns) {
        lines.push(pattern, "  ! Content-Security-Policy", `  Content-Security-Policy: ${policy}`, "");
        rules++;
      }
    }
  }
  lines.push("/_next/static/*", "  Cache-Control: public, max-age=31536000, immutable", "", "/hub/img/*", "  Cache-Control: public, max-age=31536000, immutable", "");
  rules += 2;
  if (rules > MAX_RULES) {
    throw new OutputError(`the headers file needs ${rules} rules; Cloudflare Pages allows ${MAX_RULES}`);
  }
  const long = lines.find((line) => line.length > MAX_LINE);
  if (long) {
    throw new OutputError(`a headers line is ${long.length} characters; Cloudflare Pages allows ${MAX_LINE}: ${long.slice(0, 80)}...`);
  }
  return lines.join("\n");
}

function securityTxt(data: SiteData): string {
  const expires = new Date(Date.now() + 180 * 86_400_000).toISOString().slice(0, 19) + "Z";
  return [
    ...(data.securityEmail ? [`Contact: mailto:${data.securityEmail}`] : []),
    "Contact: https://github.com/RunesmithHub/registry/security/advisories/new",
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${data.siteUrl}/.well-known/security.txt`,
    `Policy: ${data.siteUrl}/security`,
    "",
  ].join("\n");
}

async function checkStyles(allowedOrigins: readonly string[]): Promise<void> {
  for (const file of (await files(out)).filter((candidate) => candidate.endsWith(".css"))) {
    const external = cssUrls(await readFile(file, "utf8")).filter((url) => !isAllowedResource(url, allowedOrigins));
    if (external.length > 0) {
      throw new OutputError(`${path.relative(out, file)} references other hosts: ${external.join(", ")}`);
    }
  }
}

async function main(): Promise<void> {
  const data = JSON.parse(await readFile(path.join(root, ".hub", "site.json"), "utf8")) as SiteData;
  const siteOrigin = new URL(data.siteUrl).origin;
  const connectOrigins = data.indexOrigin && data.indexOrigin !== siteOrigin ? [data.indexOrigin] : [];
  await removePlaceholders();
  const pages: PageResult[] = [];
  for (const file of (await files(out)).filter((candidate) => candidate.endsWith(".html"))) {
    pages.push(await processPage(file, [siteOrigin]));
  }
  await checkStyles([siteOrigin]);
  const groups = policies(pages, connectOrigins);
  await writeFile(path.join(out, "_headers"), headerRules(groups));
  await mkdir(path.join(out, ".well-known"), { recursive: true });
  await writeFile(path.join(out, ".well-known", "security.txt"), securityTxt(data));
  console.log(`Finalized ${pages.length} pages with ${groups.size} distinct Content Security ${groups.size === 1 ? "Policy" : "Policies"}.`);
}

main().catch((error: unknown) => {
  console.error(`The output could not be finalized: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
