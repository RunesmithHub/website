import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertBody } from "@/components/ui/alert";

export function IndexUnavailable() {
  return (
    <Alert variant="info" data-testid="index-unavailable">
      <InfoIcon aria-hidden />
      <AlertBody>
        <p>
          <strong>The plugin index is not available yet.</strong> Plugins appear here once the hub publishes its first signed index.
        </p>
        <p>
          Developers can already read the <Link href="/publish" className="text-link hover:underline">publishing guide</Link> and register a plugin.
        </p>
      </AlertBody>
    </Alert>
  );
}
