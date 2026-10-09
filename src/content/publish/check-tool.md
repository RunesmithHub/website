The hub check tool runs the hub's build and checks on your machine or in your CI, with the same rules and the same report as the hub. Run it
before every release.

## Install

```sh
dotnet tool install --global RunesmithHub.Tool
```

## Run

From your plugin's root:

```sh
rshub check
```

or with a path:

```sh
rshub check path/to/plugin
```

It validates `plugin.json`, builds both projects, assembles the package, runs the checks and prints the report. It exits with code 1 when
something would fail on the hub.

## In CI

The plugin template's workflow runs `rshub check` on every push and pull request, so problems show up long before a release. Public
repositories run GitHub Actions for free.

## What it cannot check

Some checks need the hub's view of every plugin, such as dependency ranges against published versions and name similarity. The hub runs
those when you register and release.
