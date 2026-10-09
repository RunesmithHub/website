import { formatBytes } from "@/lib/site/format";
import type { VersionView } from "@/lib/site/types";

export function FileLinks({ version }: { version: VersionView }) {
  const files = [
    { label: "Package", file: version.package },
    { label: "Source", file: version.source },
    { label: "SBOM", file: version.sbom },
  ].filter((entry) => entry.file !== null);
  if (files.length === 0) {
    return null;
  }
  return (
    <span className="flex flex-wrap gap-x-2">
      {files.map(({ label, file }) =>
        file ? (
          <a key={label} href={file.url} rel="noopener noreferrer" className="text-link hover:underline" title={`${formatBytes(file.length)}, SHA-256 ${file.sha256}`}>
            {label}
          </a>
        ) : null,
      )}
    </span>
  );
}
