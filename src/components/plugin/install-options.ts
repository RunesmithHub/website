import type { InstallOption } from "@/components/hub/install-button";
import type { PluginView } from "@/lib/site/types";

export function installOptions(plugin: PluginView): InstallOption[] {
  return plugin.versions
    .filter((version) => version.installable)
    .map((version) => ({ version: version.version, yanked: version.state === "yanked", prerelease: version.prerelease }));
}

export function canInstall(plugin: PluginView): boolean {
  return (plugin.status === "listed" || plugin.status === "deprecated") && plugin.latest !== null;
}
