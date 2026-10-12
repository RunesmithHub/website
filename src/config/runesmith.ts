export const RUNESMITH = {
  apiVersions: ["0.2.0", "0.1.4", "0.1.3", "0.1.2", "0.1.1", "0.1.0"],
  oldestApi: "0.1.0",
  downloadUrl: "https://docs.runesmith.dev/guide/install",
  pluginDocsUrl: "https://docs.runesmith.dev/plugins/create-a-plugin",
} as const;

export const LATEST_API = RUNESMITH.apiVersions[0];

export const REGISTRY = {
  owner: "RunesmithHub",
  repository: "registry",
  url: "https://github.com/RunesmithHub/registry",
  defaultBranch: "main",
} as const;
