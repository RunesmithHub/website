Every hub plugin is two .NET projects that build two assemblies: a **contracts** assembly and an **implementation** assembly.

| | Contracts | Implementation |
| --- | --- | --- |
| Name | `<Root>.Contracts`, such as `Lumen.Todo.Contracts` | `<Root>`, such as `Lumen.Todo` |
| Holds | The public API other plugins may use: interfaces, records, enums, attributes, constants | Everything else: exports, services, views, logic |
| May reference | The .NET base library, the Runesmith SDK, and the contracts of plugins you depend on | Your contracts, the Runesmith SDK, the contracts of your dependencies, and NuGet packages |
| Visible to other plugins | Yes, to plugins that declare a dependency on yours | Never |
| Versioning | Strict semantic versioning, checked by the hub | Free to change in any version |

A plugin with nothing to share still has a contracts project. It can be empty.

## Rules for the contracts project

- Do not reference your own implementation or any NuGet package.
- Do not expose types from third-party libraries. Each plugin has its own load context, so a library type is a different type in every plugin.
- Do not grant `InternalsVisibleTo` to anything except your own test project.

## Start from the template

The Runesmith plugin template creates both projects, turns on NuGet lock files, adds an empty contracts project, a placeholder icon, a README
and a CI workflow that runs the [hub check tool](/publish/check-tool). See
[Create a plugin](https://docs.runesmith.dev/plugins/create-a-plugin) in the Runesmith documentation.

## What the repository needs

| Path | Required |
| --- | --- |
| `plugin.json` | Yes |
| The two projects, each with `packages.lock.json` | Yes |
| `LICENSE`, an OSI-approved license | Yes |
| `README.md`, shown on your plugin page | Yes |
| The icon | Yes |
| `SECURITY.md`, or GitHub's private vulnerability reporting | For verified plugins |
