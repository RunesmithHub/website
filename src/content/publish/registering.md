You register a plugin once. Registration binds your plugin ID to your GitHub repository and to its owner, by their permanent GitHub IDs.

## What you need

- A **publisher name**: 2 to 40 lowercase letters, digits and hyphens, starting with a letter. It is the first part of your plugin IDs.
- A **plugin name** in the same format. Together they form the ID, such as `lumen.todo`.
- A public GitHub repository with `plugin.json` on its default branch using that ID, and an OSI-approved license.
- Admin or maintain permission on the repository (for an organization, you must be one of its owners).
- The GitHub accounts of the maintainers who may act for the plugin. Each needs write access to the repository.

## Register

1. Open the [registration form](/publish/register) and fill it in.
2. Select **Open on GitHub** for each file. GitHub opens a new file in the registry with the content filled in.
3. Commit each file to a new branch in your fork and open one pull request with both.
4. The registration check runs on your pull request. Fix anything it reports by pushing to the same branch.
5. An administrator looks at the name, icon, repository and README, and merges.

## Names

Some names are reserved, and names that look like an existing plugin or publisher are checked by a person. A name that imitates Runesmith or
another plugin is refused. IDs are never reused, even after a plugin is deleted.

## Maintainers

Maintainers can yank versions, deprecate the plugin, ask for verification and answer reports. To change them later, open a pull request to
your registration; an administrator approves it and an existing maintainer confirms it. The next version after a change is reviewed.
