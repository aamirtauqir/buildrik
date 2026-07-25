/**
 * useEditorRole — the member's workspace role for the open site (P6).
 * null while loading/unknown (demo, network) — callers must treat null as
 * "don't gate": the server enforces, the chrome only explains.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { fetchMyRole, type WorkspaceRole } from "@/services/RoleService";

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
