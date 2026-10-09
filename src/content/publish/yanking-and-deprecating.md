Maintainers act on their plugin through issue forms in the [registry](https://github.com/RunesmithHub/registry/issues/new/choose). The hub
checks that the person opening the issue is a maintainer.

## Yank a version

Yank a version that should no longer be installed, for example because it corrupts data. A yanked version:

- is not offered for new installs or updates;
- stays installed for users who have it, and Runesmith suggests a newer version;
- appears struck through on your plugin page, with your reason.

Open a **Yank** issue with the version and a reason. Un-yanking needs an administrator's approval.

## Deprecate the plugin

Deprecate a plugin you no longer maintain. It stays installable, ranks lower in search, and Runesmith and the website suggest a replacement
if you name one.

Open a **Deprecate** issue with a reason and, optionally, the ID of a replacement plugin, or add `deprecated` to `plugin.json` in your next
release. To undo it, open an **Undeprecate** issue.

## Delete the plugin

Deleting removes the plugin from search and installs. Existing installs keep running without updates. The ID stays reserved for you. Open a
**Delete** issue; an administrator confirms it.
