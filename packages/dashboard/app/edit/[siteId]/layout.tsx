import { EditorCommandRegistryProvider } from "@/components/command-palette/EditorCommandRegistryContext";

/**
 * /edit/[siteId] layout.
 *
 * Pass-through plus EditorCommandRegistryProvider so editor commands can
 * register into the dashboard's Cmd+K registry without editor importing
 * dashboard directly (preserves editor → shared → dashboard dependency
 * direction). Cherry-pick #4.
 *
 * Dashboard chrome (Sidebar+Topbar at app/dashboard/layout.tsx) does NOT wrap
 * this route — different folder.
 *
 * SSR skeleton currently rendered by EditorSkeleton during dynamic-import
 * load state. Promoting to a true SSR shell here is a Phase 1 polish task.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorCommandRegistryProvider>{children}</EditorCommandRegistryProvider>;
}
