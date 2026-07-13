/** Settings is one stacked-card page (dc mockup) — the tab bar is gone and
 *  /dashboard/settings owns its own header. This layout is a passthrough so the
 *  /settings/* sub-routes still resolve for deep links (command palette, emails). */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
