/**
 * Folder moves as undo steps (REQUESTS #13). Folders live outside the project
 * snapshot (per user, on the server), so a move is recorded with
 * `history.recordCustom` — one step on the same stack as page edits, however
 * many pages it moves — and the receipt's Undo is bound to that step
 * (`captureUndo`), refusing once history has moved past it (boards 127:38819,
 * 127:40244, 131:41086).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { TOP_LEVEL } from "./components/MovePagesDialog";
import type { UseFoldersReturn } from "./useFolders";

type FolderMoves = Pick<UseFoldersReturn, "pageToFolder" | "movePageToFolder" | "removePageFromFolder">;

/** Move `pageIds` to `target` (a folder id or TOP_LEVEL) as one undo step.
 *  Returns the Undo for the receipt, or null without a history. */
export function movePagesWithHistory(
  composer: Composer | null,
  f: FolderMoves,
  pageIds: readonly string[],
  target: string,
  label: string,
): (() => boolean) | null {
  const from = new Map(pageIds.map((id) => [id, f.pageToFolder.get(id) ?? TOP_LEVEL]));
  const { movePageToFolder, removePageFromFolder } = f;
  const place = (id: string, dest: string) => (dest === TOP_LEVEL ? removePageFromFolder(id) : movePageToFolder(id, dest));
  pageIds.forEach((id) => place(id, target));
  const history = composer?.history;
  if (!history) return null;
  history.recordCustom({
    label,
    undo: () => pageIds.forEach((id) => place(id, from.get(id) ?? TOP_LEVEL)),
    redo: () => pageIds.forEach((id) => place(id, target)),
  });
  return history.captureUndo();
}

/** A folder move that says so: one undo step, and a receipt carrying its
 *  Undo (127:38819 / 137:52464 / 139:52176). The receipt's first clause is
 *  the step's History label. */
export function useFolderMoves(composer: Composer | null, f: FolderMoves) {
  const { addToast } = useToast();
  return React.useCallback(
    (ids: string[], target: string, description: string) => {
      const undo = movePagesWithHistory(composer, f, ids, target, description.split(" · ")[0]);
      addToast({ description, tone: "info", ...(undo ? { action: { label: "Undo", onClick: () => { undo(); } } } : {}) });
    },
    [composer, f, addToast],
  );
}
