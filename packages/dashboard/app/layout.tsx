import type { Metadata } from "next";
import "./globals.css";
// Separate Next.js CSS entry point (not `@import`ed from globals.css) — see
// its file header for why the prefixed flowbite layer needs its own
// Turbopack processing pass rather than sharing globals.css's.
import "./tw-flowbite.css";
// Side-effect only — sets flowbite-react's global prefix before any
// flowbite-react component renders. See file header for why this must be
// unconditional, not just a reaction to the editor loading.
import "@/components/global/flowbiteStore";
import { ThemeInit } from "@/.flowbite-react/init";
import { TRPCProvider } from "@lib/trpc/client";
import { AgentationWrapper } from "@/components/agentation-wrapper";
import { ToastProvider } from "@/components/dashboard/toast-provider";
import { GlobalProviders } from "@/components/global/global-providers";
import { UnifiedEditorFlagProvider } from "@/components/editor-route/UnifiedEditorFlagProvider";
import { readUnifiedEditorFlag } from "@/components/editor-route/unified-flag.server";

export const metadata: Metadata = {
  title: "Buildrick",
  description: "Build beautiful websites, fast.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const unifiedEditor = await readUnifiedEditorFlag();
  return (
    <html lang="en">
      <head>
        {/*
          Editor canonical font stack per DESIGN.md.
          Loaded from Bunny Fonts (privacy-respecting; no Google tracking).
          Moved from editor/demo/index.html during dashboard+editor unification.
          Dashboard's globals.css fallback to system fonts is preserved.
        */}
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          rel="stylesheet"
          href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800|inter-tight:400,500,600,700|geist-mono:400,500&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        {/*
          Syncs flowbite-react's runtime store with .flowbite-react/config.json
          (prefix "tw", version 4). The sibling `flowbiteStore` import above sets
          the same values at module-eval time, but that module has no
          "use client" and is imported by this Server Component, so it only ever
          ran on the SERVER. Anything flowbite rendered in the browser therefore
          used the DEFAULT prefix and emitted UNPREFIXED classes — which this
          app's Tailwind never compiles, because only the `tw:`-prefixed forms
          are sourced from the class list.

          The result was silent and total: `bg-blue-700 text-white` on every
          primary Button, with a rule for `text-white` (the dashboard's own code
          uses it) and none for `bg-blue-700` (only flowbite does). White text,
          transparent background, white surface — contrast ratio 1.0. Measured
          23 such controls across 14 routes, including "New site", "Upload",
          "Save changes", "Add client" and the cookie banner's "Accept All".

          `flowbite-react build` warns about exactly this ("render <ThemeInit />
          ... otherwise your app will use the default values"). ThemeInit resolves
          to StoreInitServer or StoreInitClient, so it covers both halves.
        */}
        <ThemeInit />
        <UnifiedEditorFlagProvider value={unifiedEditor}>
          <TRPCProvider><ToastProvider><GlobalProviders>{children}</GlobalProviders></ToastProvider></TRPCProvider>
        </UnifiedEditorFlagProvider>
        <AgentationWrapper />
      </body>
    </html>
  );
}
