`plugin.json` sits at the root of your plugin (the repository root, unless your registration names a folder). You write it; the hub validates
it and adds what only the build knows to the copy inside the package. Unknown fields fail the check, so a typo never passes silently.

## Example

```json
{
  "schemaVersion": 1,
  "id": "lumen.todo",
  "name": "Lumen Todo",
  "version": "1.4.0",
  "summary": "Collects TODO comments across your project and links them to issues.",
  "authors": ["Mira Holt"],
  "license": "MIT",
  "repository": "https://github.com/lumen-labs/lumen-todo",
  "runesmithApi": "^0.1.0",
  "projects": {
    "contracts": "src/Lumen.Todo.Contracts/Lumen.Todo.Contracts.csproj",
    "implementation": "src/Lumen.Todo/Lumen.Todo.csproj"
  },
  "dependencies": [{ "id": "harbor.issues", "range": "^1.2.0" }],
  "capabilities": [{ "id": "network", "reason": "Reads issues from your issue tracker." }],
  "networkHosts": ["api.github.com"],
  "icon": "assets/icon.png",
  "categories": ["Productivity"],
  "keywords": ["todo", "issues"]
}
```

## Fields

| Field | Required | Rules |
| --- | --- | --- |
| `schemaVersion` | Yes | `1` |
| `id` | Yes | `<publisher>.<name>`, matching your registration. Never changes |
| `name` | Yes | 2 to 40 characters. Changing it needs a review |
| `version` | Yes | A [semantic version](/publish/versions) equal to the release tag without its `v` |
| `summary` | Yes | One line, at most 120 characters |
| `authors` | Yes | 1 to 10 names |
| `license` | Yes | An SPDX expression of OSI-approved licenses, matching `LICENSE` |
| `repository` | Yes | `https://github.com/<owner>/<repo>`, matching your registration |
| `homepage` | No | An `https://` address |
| `runesmithApi` | Yes | The plugin API [range](/publish/versions) you support, within one compatibility line |
| `projects` | Yes | Relative paths to the contracts and implementation project files |
| `dependencies` | No | Up to 32 plugins, each with an ID and a range. See [Dependencies](/publish/dependencies) |
| `capabilities` | No | Each with an ID and a reason of at most 160 characters. See [Capabilities](/publish/capabilities) |
| `networkHosts` | With `network` | The host names you connect to, or `*` for hosts the user chooses |
| `platforms` | No | Any of `windows`, `linux`, `macos`. Omit it to support all |
| `icon` | Yes | Path to a PNG or WebP icon. See [Images](/publish/images) |
| `banner` | No | Path to a PNG, WebP or JPEG banner |
| `gallery` | No | Up to 6 screenshots, each a `path` and a `caption` of at most 80 characters |
| `categories` | Yes | 1 to 3 categories from the hub's list |
| `keywords` | No | Up to 10 lowercase words, used by search |
| `deprecated` | No | A `reason` and an optional `replacement` plugin ID. See [Yanking and deprecating](/publish/yanking-and-deprecating) |

## Categories

Languages, Version control, Themes, Formatters and linters, Debugging, Testing, Build and run, Snippets and templates, Navigation,
Productivity, Visualization, Cloud and remote, Data and databases, Documentation, Education, Other.
