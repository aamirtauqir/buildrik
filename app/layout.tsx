import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";
import { AgentationWrapper } from "@/components/agentation-wrapper";
import { ToastProvider } from "@/components/dashboard/toast-provider";

export const metadata: Metadata = {
  title: "Buildrik",
  description: "Build beautiful websites, fast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TRPCProvider><ToastProvider>{children}</ToastProvider></TRPCProvider>
        <AgentationWrapper />
      </body>
    </html>
  );
}
