import { CodeIcon, CpuIcon, FolderIcon, GlobeIcon, KeyRoundIcon, PuzzleIcon, SettingsIcon, TerminalIcon, type LucideIcon } from "lucide-react";

const ICONS: Readonly<Record<string, LucideIcon>> = {
  network: GlobeIcon,
  process: TerminalIcon,
  filesystem: FolderIcon,
  environment: SettingsIcon,
  credentials: KeyRoundIcon,
  native: CpuIcon,
  "dynamic-code": CodeIcon,
};

export function CapabilityIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ICONS[id] ?? PuzzleIcon;
  return <Icon className={className} aria-hidden />;
}
