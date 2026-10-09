import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type * as React from "react";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { SearchShortcut } from "@/components/site/search-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteData } from "@/lib/site/data";
import "./globals.css";

const inter = localFont({ src: "../fonts/inter-latin-wght.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const mono = localFont({
  src: "../fonts/jetbrains-mono-latin-wght.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
  preload: false,
});

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteData().siteUrl),
    title: { default: "Runesmith Hub", template: "%s | Runesmith Hub" },
    description: "Plugins for Runesmith: official, verified and community plugins, built from open source and signed.",
    icons: { icon: "/favicon.ico", apple: "/brand/runesmith-256.png" },
    referrer: "strict-origin-when-cross-origin",
  };
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#131418",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- the policy must exist before any other script runs */}
        <script src="/trusted-types.js" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- the theme must be set before the first paint */}
        <script src="/theme.js" />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="bg-primary-fill text-primary-foreground sr-only z-50 rounded-[6px] px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to content
        </a>
        <TooltipProvider delayDuration={300}>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-7 pb-10 sm:px-8">
            {children}
          </main>
          <SiteFooter />
        </TooltipProvider>
        <SearchShortcut />
      </body>
    </html>
  );
}
