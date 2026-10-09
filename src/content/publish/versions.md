Plugins use [Semantic Versioning 2.0.0](https://semver.org): `MAJOR.MINOR.PATCH`, with an optional pre-release part such as `1.5.0-beta.2`.
Build metadata (`+...`) is not allowed.

## Rules

- A version number is published at most once, ever. If a release fails, release a new number.
- The release tag is `v` followed by the version, such as `v1.4.0`, and must match `version` in `plugin.json`.
- Versions do not need to be released in order. A `1.4.3` after `2.0.0` is fine.
- Pre-releases are installed only by users who opt in, or when a dependency range names a pre-release.

## Breaking changes

The hub compares your contracts assembly with the previous version in the same line:

| Change in contracts | Required bump |
| --- | --- |
| Removed or changed public members, types or contract names | Major (minor before 1.0) |
| Added public members or types | Minor |
| No public change | Any |

If the bump is too small, the release fails and the tracking issue lists the changes. Your implementation can change in any version, but
bump the major version when its behaviour changes in a breaking way.

## Compatibility lines

A compatibility line is a set of versions that work with each other: one major version from 1.0 on, and one minor version before 1.0 (so
`0.3.0` to `0.3.x` is one line).

## Ranges

`runesmithApi` and dependencies use the same range syntax:

| Form | Example | Means |
| --- | --- | --- |
| Exact | `1.4.2` | Only 1.4.2 |
| Caret | `^1.4.2` | 1.4.2 or later, below 2.0.0. `^0.3.1` stays below 0.4.0 |
| Tilde | `~1.4.2` | 1.4.2 or later, below 1.5.0 |
| Minimum | `>=1.4.0` | 1.4.0 or later within the 1.x line |
| Bounded | `>=1.4.0 <1.9.0` | Both conditions |
| Either | `^1.4.0 \|\| ^2.1.0` | Either range |

Wildcards, `latest`, empty ranges and ranges that match nothing are rejected.

## The Runesmith API

`runesmithApi` says which Runesmith API versions your plugin works with. Its lowest version is the one the hub builds against, and the range
must stay within one compatibility line. To support a new Runesmith API line, release a new version for it. Each version's page shows which
Runesmith releases it runs on.
