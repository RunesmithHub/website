You release on GitHub, the way you already do. Nothing is uploaded to the hub.

1. **Set the version** in `plugin.json`, following [semantic versioning](/publish/versions).
2. **Push a tag** named `v` followed by the version, such as `v1.4.0`, on the commit to release.
3. **Create a GitHub release** from the tag, with release notes. They appear on your plugin page.

Mark the GitHub release as a pre-release exactly when the version has a pre-release part, such as `1.5.0-beta.1`. Draft releases are ignored.

## Before you release

Run the [hub check tool](/publish/check-tool) locally or in your CI. It applies the same rules as the hub and prints the same report. The
plugin template's CI runs it on every push.

## Discovery

The hub looks for new releases every hour. To start sooner, open a **Publish now** issue in the
[registry](https://github.com/RunesmithHub/registry/issues/new/choose).

## Limits

| Limit | Value |
| --- | --- |
| Releases per plugin per day | 5 |
| Package size | 50 MB compressed |
| Build time | 20 minutes |

## If something fails

The tracking issue says what failed and why. Fix it and release a new version number; a version number is published at most once.
