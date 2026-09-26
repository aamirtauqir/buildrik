/**
 * useEditorRole — the member's workspace role for the open site (P6).
 * null while loading/unknown (demo, network) — callers must treat null as
 * "don't gate": the server enforces, the chrome only explains.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { fetchMyRole, type WorkspaceRole } from "@/services/RoleService";
import { getEditorViewMode } from "@shared/utils/editorViewMode";

export function useEditorRole(): WorkspaceRole | null {
  const [role, setRole] = React.useState<WorkspaceRole | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    void fetchMyRole().then((r) => {
      if (!cancelled) setRole(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return role;
}

/**
 * The one computation of "is this a VIEWER's read-only chrome" — StudioPanels
 * (rail gate, drawer/inspector layout), useStudioState (the openLeftPanelToTab
 * / setLeftPanelTab sink every tab-open door funnels into), and CommandPalette
 * (which nav commands even show) all need the same answer. `?view=readonly`
 * alone is not enough — it also covers the OWNER's own read-only preview —
 * only readOnlyView AND a VIEWER role together mean "gate writing surfaces".
 */
export function useViewerChrome(): boolean {
  const editorRole = useEditorRole();
  const readOnlyView = React.useMemo(() => getEditorViewMode().readOnlyView, []);
  return readOnlyView && editorRole === "VIEWER";
}
