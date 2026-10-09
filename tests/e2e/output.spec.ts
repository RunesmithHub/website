import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { COMMON_HEADERS } from "../../scripts/lib/csp.ts";
import { headersFor, parseHeadersFile } from "../../scripts/lib/headers-file.ts";
import { cssUrls, inlineScripts, isAllowedResource, resourceUrls } from "../../scripts/lib/html.ts";
import type { SiteData } from "../../src/lib/site/types.ts";

const out = path.resolve("out");

async function outputFiles(extension: string): Promise<string[]> {
  const entries = await readdir(out, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension)).map((entry) => path.join(entry.parentPath, entry.name));
}

function route(file: string): string {
  const relative = path.relative(out, file).split(path.sep).join("/");
  return relative === "index.html" ? "/" : `/${relative.replace(/\.html$/, "")}`;
}

async function siteOrigins(): Promise<string[]> {
  const data = JSON.parse(await readFile(".hub/site.json", "utf8")) as SiteData;
  return [new URL(data.siteUrl).origin, ...(data.indexOrigin ? [data.indexOrigin] : [])];
}

test("no output file loads anything from another host", async () => {
  const allowed = await siteOrigins();
  for (const file of await outputFiles(".html")) {
    const html = await readFile(file, "utf8");
    const external = resourceUrls(html).filter((url) => !isAllowedResource(url, allowed));
    expect(external, route(file)).toEqual([]);
    expect(html, route(file)).not.toMatch(/<link[^>]+rel="(?:dns-prefetch|preconnect)"/);
  }
  for (const file of await outputFiles(".css")) {
    expect(cssUrls(await readFile(file, "utf8")).filter((url) => !isAllowedResource(url, allowed)), file).toEqual([]);
  }
});

test("the headers file covers every page with the full set of headers", async () => {
  const rules = parseHeadersFile(await readFile(path.join(out, "_headers"), "utf8"));
  expect(rules.length).toBeLessThanOrEqual(100);
  for (const file of await outputFiles(".html")) {
    const html = await readFile(file, "utf8");
    const headers = headersFor(rules, route(file));
    for (const [name, value] of COMMON_HEADERS) {
      expect(headers.get(name.toLowerCase()), `${name} on ${route(file)}`).toBe(value);
    }
    const csp = headers.get("content-security-policy") ?? "";
    for (const directive of ["default-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'", "object-src 'none'", "upgrade-insecure-requests"]) {
      expect(csp, route(file)).toContain(directive);
    }
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    const scriptSource = /script-src ([^;]+)/.exec(csp)?.[1] ?? "";
    for (const script of inlineScripts(html)) {
      const hash = `'sha256-${createHash("sha256").update(script.body).digest("base64")}'`;
      expect(scriptSource, `inline script on ${route(file)}`).toContain(hash);
    }
  }
});

test("security.txt names a contact and an expiry", async () => {
  const text = await readFile(path.join(out, ".well-known", "security.txt"), "utf8");
  expect(text).toMatch(/^Contact: /m);
  const expires = /^Expires: (.+)$/m.exec(text)?.[1] ?? "";
  expect(Date.parse(expires)).toBeGreaterThan(Date.now());
});

test("the site serves the hub's images itself and nothing for blocked plugins", async () => {
  const data = JSON.parse(await readFile(".hub/site.json", "utf8")) as SiteData;
  for (const plugin of data.plugins) {
    const images = [plugin.icon?.small, plugin.icon?.large, plugin.banner?.large, ...plugin.gallery.map((item) => item.large)];
    for (const image of images.filter((candidate) => candidate !== undefined)) {
      expect(image.src).toMatch(/^\/hub\/img\/[0-9a-f]{64}\.(png|webp)$/);
    }
    if (plugin.status === "blocked") {
      expect(plugin.icon).toBeNull();
      expect(plugin.versions.every((version) => version.package === null && version.readme === null)).toBe(true);
    }
  }
});
