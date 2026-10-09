import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Hex } from "../../src/lib/hub/bytes.ts";
import { LIMITS } from "../../src/lib/hub/limits.ts";
import type { ImageRef, Publisher } from "../../src/lib/hub/model.ts";
import { fetchLimited, readFileLimited, type IndexSource } from "../../src/lib/hub/source.ts";
import type { SiteImage } from "../../src/lib/site/types.ts";

export class AssetError extends Error {
  override readonly name = "AssetError";
}

type Format = "png" | "webp" | "jpg";

function sniff(bytes: Uint8Array): Format | null {
  const ascii = (start: number, end: number): string => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length > 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") {
    return "png";
  }
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "webp";
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  return null;
}

export class AssetStore {
  private readonly images = new Map<string, SiteImage>();
  private readonly outputDir: string;
  private readonly publicPrefix: string;
  private readonly source: IndexSource;
  private readonly strict: boolean;

  constructor(source: IndexSource, outputDir: string, publicPrefix: string, strict: boolean) {
    this.source = source;
    this.outputDir = outputDir;
    this.publicPrefix = publicPrefix;
    this.strict = strict;
  }

  private async fetch(url: URL, limit: number): Promise<Uint8Array | null> {
    if (url.protocol === "file:") {
      return readFileLimited(fileURLToPath(url), limit, url.pathname);
    }
    if (this.source.baseUrl.protocol === "file:") {
      return this.fromIndexFolder(url, limit);
    }
    return fetchLimited(url, limit);
  }

  // A local index may link to the host it is meant to be served from; its files are then found by path inside the folder.
  private async fromIndexFolder(url: URL, limit: number): Promise<Uint8Array | null> {
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (segments.some((segment) => segment === ".." || segment.includes(path.sep))) {
      return null;
    }
    const root = fileURLToPath(this.source.baseUrl);
    for (let start = 0; start < segments.length; start++) {
      const bytes = await readFileLimited(path.join(root, ...segments.slice(start)), limit, url.pathname);
      if (bytes) {
        return bytes;
      }
    }
    return null;
  }

  async add(ref: ImageRef): Promise<void> {
    if (this.images.has(ref.sha256)) {
      return;
    }
    const url = new URL(ref.url, this.source.baseUrl);
    let bytes: Uint8Array | null;
    try {
      bytes = ref.length > LIMITS.image ? null : await this.fetch(url, Math.min(ref.length, LIMITS.image));
    } catch (error) {
      if (this.strict) {
        throw new AssetError(`could not download ${url.href}: ${(error as Error).message}`);
      }
      console.warn(`warning: could not download ${url.href}; a placeholder is shown instead`);
      return;
    }
    if (!bytes) {
      if (this.strict) {
        throw new AssetError(`${url.href} is missing`);
      }
      console.warn(`warning: ${url.href} is missing; a placeholder is shown instead`);
      return;
    }
    if (bytes.length !== ref.length || (await sha256Hex(bytes)) !== ref.sha256) {
      throw new AssetError(`${url.href} does not match its signed length and SHA-256`);
    }
    if (sniff(bytes) !== ref.format) {
      throw new AssetError(`${url.href} is not a ${ref.format} image`);
    }
    const name = `${ref.sha256}.${ref.format}`;
    await writeFile(path.join(this.outputDir, name), bytes);
    this.images.set(ref.sha256, { src: `${this.publicPrefix}/${name}`, width: ref.width, height: ref.height });
  }

  get(ref: ImageRef): SiteImage | null {
    return this.images.get(ref.sha256) ?? null;
  }
}

export async function downloadAvatar(publisher: Publisher, outputDir: string, publicPrefix: string): Promise<string | null> {
  try {
    const bytes = await fetchLimited(new URL(`https://avatars.githubusercontent.com/u/${publisher.owner.id}?s=96&v=4`), LIMITS.avatar);
    const format = bytes ? sniff(bytes) : null;
    if (!bytes || !format) {
      return null;
    }
    await mkdir(outputDir, { recursive: true });
    const name = `${publisher.name}.${format}`;
    await writeFile(path.join(outputDir, name), bytes);
    return `${publicPrefix}/${name}`;
  } catch {
    return null;
  }
}
