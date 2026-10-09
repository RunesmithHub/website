import { cn } from "@/lib/utils";
import { initials } from "@/lib/site/format";
import type { SiteImage } from "@/lib/site/types";

const SIZES = {
  sm: "size-7 rounded-[7px] text-[11px]",
  md: "size-10 rounded-[9px] text-[15px]",
  lg: "size-16 rounded-[14px] text-2xl",
  xl: "size-[84px] rounded-[18px] text-3xl",
} as const;

export function PluginIcon({ name, image, size = "md", className }: { name: string; image: SiteImage | null; size?: keyof typeof SIZES; className?: string }) {
  if (image) {
    return <img src={image.src} alt="" width={image.width} height={image.height} className={cn("shrink-0 object-cover", SIZES[size], className)} loading="lazy" />;
  }
  return (
    <span aria-hidden className={cn("bg-primary-subtle text-link grid shrink-0 place-items-center font-bold", SIZES[size], className)}>
      {initials(name)}
    </span>
  );
}
