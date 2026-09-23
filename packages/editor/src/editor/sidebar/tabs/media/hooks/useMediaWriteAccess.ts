/**
 * useMediaWriteAccess — may this member change the media library?
 *
 * Audit G3-064 (P1, "Viewers can mutate the library"): upload, delete and
 * rename are gated on the workspace role — a VIEWER sees the control
 * DISABLED WITH THE REASON (board 6289:148485 "View only — ask an editor to
 * upload"; the pattern is B2-07 7567:190220), never hidden, and never
 * `disabled`: `aria-disabled` keeps the control focusable so the tooltip can
 * be read by keyboard (plan decision #19).
 *
 * `null` role (demo, network) is "unknown", not a lock — the chrome stays as
 * it is and the server (`media.*` procedures) keeps enforcing. This is a UI
 * gate over mutations the dashboard already authorises (plan §3).
 *
 * @license BSD-3-Clause
 */
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";

export type MediaWriteAction = "upload" | "delete" | "rename";

/** Board 6289:148485's sentence, per action. */
export const VIEW_ONLY_REASON: Record<MediaWriteAction, string> = {
  upload: "View only — ask an editor to upload",
  delete: "View only — ask an editor to delete",
  rename: "View only — ask an editor to rename",
};

export interface MediaWriteAccess {
  /** false only when the role is KNOWN and below EDITOR. */
  canWrite: boolean;
  /** The reason to attach to a denied control; undefined while writable. */
  reason: (action: MediaWriteAction) => string | undefined;
}

export function useMediaWriteAccess(): MediaWriteAccess {
  const canWrite = roleAtLeast(useEditorRole(), "EDITOR") !== false;
  return {
    canWrite,
    reason: (action) => (canWrite ? undefined : VIEW_ONLY_REASON[action]),
  };
}
