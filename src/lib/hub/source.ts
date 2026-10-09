import { open, stat } from "node:fs/promises";
import path from "node:path";
import { concatBytes } from "./bytes.ts";

export class SourceError extends Error {
  override readonly name = "SourceError";
}

export interface IndexSource {
  readonly description: string;
  readonly baseUrl: URL;
  read(relativePath: string, limit: number): Promise<Uint8Array | null>;
}

const MAX_REDIRECTS = 5;

function checkRelative(relativePath: string): void {
  if (relativePath.startsWith("/") || relativePath.split("/").some((segment) => segment === ".." || segment === "")) {
    throw new SourceError(`refusing to read "${relativePath}"`);
  }
}

export class DirectorySource implements IndexSource {
  readonly description: string;
  readonly baseUrl: URL;
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = directory;
    this.description = `directory ${directory}`;
    this.baseUrl = new URL(`file://${path.resolve(directory)}/`);
  }

  async read(relativePath: string, limit: number): Promise<Uint8Array | null> {
    checkRelative(relativePath);
    return readFileLimited(path.join(this.directory, relativePath), limit, relativePath);
  }
}

export async function readFileLimited(file: string, limit: number, what: string): Promise<Uint8Array | null> {
  try {
    const info = await stat(file);
    if (!info.isFile()) {
      return null;
    }
    if (info.size > limit) {
      throw new SourceError(`${what} is ${info.size} bytes, over the ${limit} byte limit`);
    }
    const handle = await open(file, "r");
    try {
      const buffer = new Uint8Array(limit + 1);
      const { bytesRead } = await handle.read(buffer, 0, limit + 1, 0);
      if (bytesRead > limit) {
        throw new SourceError(`${what} is over the ${limit} byte limit`);
      }
      return buffer.slice(0, bytesRead);
    } finally {
      await handle.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export class HttpSource implements IndexSource {
  readonly description: string;
  readonly baseUrl: URL;

  constructor(baseUrl: string) {
    this.baseUrl = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    if (this.baseUrl.protocol !== "https:") {
      throw new SourceError(`the index URL must use https: ${baseUrl}`);
    }
    this.description = this.baseUrl.href;
  }

  async read(relativePath: string, limit: number): Promise<Uint8Array | null> {
    checkRelative(relativePath);
    return fetchLimited(new URL(relativePath, this.baseUrl), limit);
  }
}

export async function fetchLimited(url: URL, limit: number, headers: Record<string, string> = {}): Promise<Uint8Array | null> {
  let current = url;
  for (let redirects = 0; ; redirects++) {
    if (current.protocol !== "https:") {
      throw new SourceError(`refusing to fetch non-https URL ${current.href}`);
    }
    const response = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": "RunesmithHub-Website/0.1.0", ...headers },
      signal: AbortSignal.timeout(60_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location || redirects >= MAX_REDIRECTS) {
        throw new SourceError(`too many or invalid redirects for ${url.href}`);
      }
      current = new URL(location, current);
      continue;
    }
    if (response.status === 404) {
      await response.body?.cancel();
      return null;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new SourceError(`${current.href} answered ${response.status}`);
    }
    return readBody(response.body, limit, current.href);
  }
}

async function readBody(body: ReadableStream<Uint8Array>, limit: number, what: string): Promise<Uint8Array> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new SourceError(`${what} is over the ${limit} byte limit`);
    }
    chunks.push(value);
  }
  return concatBytes(chunks);
}
