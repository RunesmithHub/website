# Runesmith Hub website

The website of the Runesmith plugin hub: search, plugin pages, the publishing guide and the moderation dashboard. It is a static
Next.js site built from the hub's signed index.

## Requirements

- Node.js 24
- pnpm 12 (the version in `package.json`)

## Develop

```sh
pnpm install --frozen-lockfile
pnpm fixture
HUB_INDEX_DIR=tests/fixtures/.generated/default/index \
HUB_TRUST_ROOT=tests/fixtures/.generated/default/index/root/1.json \
pnpm dev
```

`pnpm fixture` writes a signed sample index with throwaway keys. To use another index, point `HUB_INDEX_DIR` at its folder and
`HUB_TRUST_ROOT` at the root it should trust.

## Build

```sh
pnpm build
```

The site is exported to `out/`, including the `_headers` file. The build stops when the index cannot be verified.

| Variable | Purpose |
| --- | --- |
| `HUB_INDEX_URL` | Base URL of the index. Defaults to `https://runesmithhub.github.io/registry/` |
| `HUB_INDEX_DIR` | A local index folder; takes precedence over `HUB_INDEX_URL` |
| `HUB_TRUST_ROOT` | The trusted root file. Defaults to `trust/root.json` |
| `HUB_SITE_URL` | The public address of the site |
| `HUB_SECURITY_EMAIL` | The security contact shown on the site and in `security.txt` |

Without `trust/root.json` and without a configured index, the build produces the site without plugin data.

## Test

```sh
pnpm lint
pnpm typecheck
pnpm audit
pnpm test
```

`pnpm test` runs the Playwright tests against `out/`, so build against the fixture first. On NixOS, set `CHROMIUM_PATH` to a
Chromium binary, for example from `nix shell nixpkgs#chromium`.

## Deploy

Cloudflare Pages builds the default branch with `pnpm build` and serves `out/`. The registry's workflows call the deploy hook after
publishing.
