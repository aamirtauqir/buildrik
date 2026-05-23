/**
 * /edit/[siteId] layout.
 *
 * Pass-through. Previously wrapped children in EditorCommandRegistryProvider
 * (cherry-pick #4 Cmd+K registry bridge), but the registry layer never had
 * a consumer — no editor code called useRegisterCommand, and the dashboard
 * command palette uses static lists, not the registry. Dropped the layer
 * 2026-05-23 honesty drain. Cmd+K full build (if ever shipped) should be
 * a separate arc that wires palette → registry → editor consumers in
 * lockstep, not scaffold-first.
 *
 * Dashboard chrome (Sidebar+Topbar at app/dashboard/layout.tsx) does NOT
 * wrap this route — different folder.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
