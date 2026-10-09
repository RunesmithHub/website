import { existsSync } from "node:fs";
import path from "node:path";

export const DEFAULT_INDEX_URL = "https://runesmithhub.github.io/registry/";
export const DEFAULT_SITE_URL = "https://runesmith-hub.pages.dev";

export interface BuildConfig {
  readonly root: string;
  readonly dataRoot: string;
  readonly trustedRootPath: string | null;
  readonly indexDir: string | null;
  readonly indexUrl: string;
  readonly indexConfigured: boolean;
  readonly siteUrl: string;
  readonly securityEmail: string | null;
}

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function readConfig(root = process.cwd()): BuildConfig {
  const trustedRoot = path.resolve(root, env("HUB_TRUST_ROOT") ?? "trust/root.json");
  const indexDir = env("HUB_INDEX_DIR");
  const indexUrl = env("HUB_INDEX_URL");
  return {
    root,
    dataRoot: path.resolve(root, env("HUB_DATA_ROOT") ?? "."),
    trustedRootPath: existsSync(trustedRoot) ? trustedRoot : null,
    indexDir: indexDir ? path.resolve(root, indexDir) : null,
    indexUrl: indexUrl ?? DEFAULT_INDEX_URL,
    indexConfigured: indexDir !== null || indexUrl !== null,
    siteUrl: (env("HUB_SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/+$/, ""),
    securityEmail: env("HUB_SECURITY_EMAIL"),
  };
}
