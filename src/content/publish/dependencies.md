A plugin can depend on other hub plugins and use their contracts.

## Declaring a dependency

1. Add it to `dependencies` in `plugin.json` with the plugin ID and a [range](/publish/versions):
   `{ "id": "harbor.issues", "range": "^1.2.0" }`.
2. Reference its contracts package from nuget.org in the project that uses it, at the lowest version your range allows. Contracts packages
   are named `RunesmithHub.<Plugin.Id>.Contracts`.

Every referenced contracts package must be declared, and every declared dependency must be referenced.

## Rules

- Dependencies must be hub plugins.
- No cycles, direct or indirect.
- At most 32 plugins in the whole dependency tree.
- A plugin cannot be more trusted than what it depends on: verified plugins depend only on official or verified plugins, and official plugins
  only on official ones.

## Ranges across lines

A range may cover more than one compatibility line of a dependency only if your plugin builds against the lowest version of each line. The
hub builds once per line to check it.

## What users get

Runesmith resolves dependencies when a plugin is installed, picks one version of each plugin that satisfies every range, and shows the full
install plan before changing anything.
