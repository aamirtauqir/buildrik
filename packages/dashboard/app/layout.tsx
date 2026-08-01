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
        <UnifiedEditorFlagProvider value={unifiedEditor}>
          <TRPCProvider><ToastProvider><GlobalProviders>{children}</GlobalProviders></ToastProvider></TRPCProvider>
        </UnifiedEditorFlagProvider>
        <AgentationWrapper />
      </body>
    </html>
  );
}
