Publishing a plugin on the hub takes a GitHub repository, a manifest and a release. You never upload anything: the hub builds your plugin from
the source at the commit you tag, checks it, signs it and offers it to Runesmith users.

## The steps

1. **Build the plugin** as [two projects](/publish/two-projects): a contracts project and an implementation project. The Runesmith plugin
   template creates both.
2. **Describe it** in [`plugin.json`](/publish/manifest), including the [capabilities](/publish/capabilities) it needs and its
   [images](/publish/images).
3. **Check it locally** with the [hub check tool](/publish/check-tool). It runs the same checks as the hub.
4. **Register it** once with the [registration form](/publish/register). It prepares a pull request to the registry.
5. **Release a version** by pushing a tag and creating a GitHub release. See [Releasing](/publish/releasing).
6. **Follow the tracking issue** the hub opens for your version. See [What happens after you release](/publish/after-release).

## Tiers

| Tier | Who | What users see |
| --- | --- | --- |
| Official | Plugins published by Runesmith | The Official badge |
| Verified | Publishers Runesmith has verified; every version is reviewed by a person | The Verified badge |
| Unverified | Every other plugin; versions are checked automatically | The Unverified label and a warning before installing |

Every plugin starts unverified. Once you have a published version and meet the requirements, you can
[ask for verification](/publish/verification).

## Before you start

- Your repository must be public on GitHub, with an OSI-approved license.
- Each repository holds one plugin.
- Read the [publisher policy](/policies/publisher) and the [content policy](/policies/content). Registering means you accept them.
