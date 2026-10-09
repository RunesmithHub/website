Within the hour, the hub opens a **tracking issue** for your version in the registry and mentions the maintainers. Every step reports there.

## The steps

1. **Build.** The hub builds your plugin from the tagged commit in an isolated environment, twice, and the two builds must match byte for
   byte. Make your build deterministic: no downloads during the build, no timestamps or machine names in the output.
2. **Checks.** The hub checks the package, the manifest, capabilities, dependencies, contracts versioning, bundled libraries, known
   vulnerabilities and licenses.
3. **Review or hold.**
   - Official and verified plugins: an administrator reviews every version.
   - Unverified plugins: the version waits 24 hours before it is offered. Certain changes, such as a new capability, native code or new
     maintainers, need a review instead.
4. **Publishing.** The hub publishes the package, signs the index, and the version appears on the website and in Runesmith.

## Reading a failure

The tracking issue lists every problem with what to change. Common ones:

| Report | What to do |
| --- | --- |
| The builds did not match | Remove anything that varies between builds: generated timestamps, random values, downloads during the build |
| Undeclared capability | Declare it in `plugin.json` with a reason, or remove the code that uses it |
| Contracts changed without the right version bump | Bump the major (or minor) version, or restore the removed members |
| Known vulnerability in a package | Update the package. If you cannot, ask in the tracking issue |
| Manifest error | Fix the field the report names |

Fix the problem and release a new version number.

## During a review

A reviewer reads the changes since the last reviewed version. They may ask questions in the tracking issue; answering quickly speeds things
up. Changes requested by the reviewer mean this version will not be published; release a new version with the fix.
