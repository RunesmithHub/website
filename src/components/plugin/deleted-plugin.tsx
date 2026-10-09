import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertBody } from "@/components/ui/alert";
import type { PluginView } from "@/lib/site/types";

export function DeletedPlugin({ plugin }: { plugin: PluginView }) {
  return (
    <div className="mx-auto max-w-[640px] py-6" data-testid="deleted-plugin">
      <div className="text-subtle-foreground font-mono text-[12.5px]">{plugin.id}</div>
      <h1 className="mt-1 mb-4 text-2xl font-bold">{plugin.name}</h1>
      <Alert variant="info">
        <Trash2Icon aria-hidden />
        <AlertBody>
          <p>
            <strong>This plugin is no longer available.</strong> It was removed from the hub. If you have it installed, it keeps running, but it
            gets no updates.
          </p>
        </AlertBody>
      </Alert>
      <p>
        <Link href="/search" className="text-link hover:underline">
          Search for another plugin
        </Link>
      </p>
    </div>
  );
}
