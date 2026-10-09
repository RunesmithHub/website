import { createHash } from "node:crypto";

export function sha256Source(text: string): string {
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

export interface PagePolicyInput {
  readonly scriptHashes: readonly string[];
  readonly styleHashes: readonly string[];
  readonly styleAttributeHashes: readonly string[];
  readonly connectOrigins: readonly string[];
}

export function contentSecurityPolicy(input: PagePolicyInput): string {
  const unique = (values: readonly string[]): string[] => [...new Set(values)].sort();
  const directives = [
    "default-src 'none'",
    ["script-src 'self'", ...unique(input.scriptHashes)].join(" "),
    ["style-src 'self'", ...unique(input.styleHashes)].join(" "),
    ...(input.styleAttributeHashes.length ? [["style-src-attr 'unsafe-hashes'", ...unique(input.styleAttributeHashes)].join(" ")] : []),
    "img-src 'self' data:",
    "font-src 'self'",
    "manifest-src 'self'",
    ["connect-src 'self'", ...unique(input.connectOrigins)].join(" "),
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
    "require-trusted-types-for 'script'",
    "trusted-types default",
  ];
  return directives.join("; ");
}

export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "clipboard-read=()",
  "clipboard-write=(self)",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=()",
  "gamepad=()",
  "geolocation=()",
  "gyroscope=()",
  "hid=()",
  "identity-credentials-get=()",
  "idle-detection=()",
  "local-fonts=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "otp-credentials=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-create=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "storage-access=()",
  "sync-xhr=()",
  "usb=()",
  "window-management=()",
  "xr-spatial-tracking=()",
].join(", ");

export const COMMON_HEADERS: readonly (readonly [string, string])[] = [
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", PERMISSIONS_POLICY],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-origin"],
];
