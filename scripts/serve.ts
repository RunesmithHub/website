import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { headersFor, parseHeadersFile } from "./lib/headers-file.ts";

const root = path.resolve(process.argv[2] ?? "out");
const port = Number(process.env.PORT ?? 4173);
const headersPath = path.join(root, "_headers");
const rules = existsSync(headersPath) ? parseHeadersFile(readFileSync(headersPath, "utf8")) : [];

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

function isFile(file: string): boolean {
  return existsSync(file) && statSync(file).isFile();
}

function resolve(pathname: string): string | null {
  const relative = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = path.join(root, relative);
  if (!base.startsWith(root)) {
    return null;
  }
  const candidates = pathname.endsWith("/") ? [path.join(base, "index.html")] : [base, `${base}.html`, path.join(base, "index.html")];
  return candidates.find(isFile) ?? null;
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const file = resolve(url.pathname);
  const target = file ?? path.join(root, "404.html");
  for (const [name, value] of headersFor(rules, url.pathname)) {
    response.setHeader(name, value);
  }
  response.statusCode = file ? 200 : 404;
  response.setHeader("content-type", TYPES[path.extname(target)] ?? "application/octet-stream");
  if (!isFile(target)) {
    response.end("Not found");
    return;
  }
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} on http://127.0.0.1:${port}`);
});
