/**
 * MovePagesDialog — "Move 3 pages to…" (v3 6887:77925; copy and the
 * "Move 3 pages" primary from design-2l9 board 139:51389): one radio row per
 * folder, then "Top level (no folder)"; the primary names the choice
 * ("Move to Marketing"). It replaced the bulk bar's pop-up folder list, whose
 * "Remove from folder" row is the top-level choice here. The caller moves.
 *
 * One page (the row menu's "Move to folder…", design-2l9 boards 127:38098 /
 * 131:40341) names it: "Move About to…", says its URL stays, and refuses the
 * place it already is ("About is already at the top level. No change is
 * needed." / "Already at top level").
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, Radio } from "@/editor/chrome-ui";
import { listNames } from "@shared/utils/helpers/string";
import type { FolderItem } from "../types";

/** The top-level choice — not a folder id. */
export const TOP_LEVEL = "";

export interface MovePagesDialogProps {
  open: boolean;
  pageNames: string[];
  folders: FolderItem[];
  /** A folder id, or TOP_LEVEL. */
  onMove: (target: string) => void;
  /** One page only: where it is now (folder id or TOP_LEVEL) and its URL. */
  current?: { target: string; url: string };
  onClose: () => void;
}

/* 6887:77925 row: 36 tall, radius 6, no border; the picked one on blue-50. */
const ROW = "tw:flex tw:h-9 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-md tw:px-2 tw:text-[13px] tw:text-[var(--bk-ink)]";
const ROW_PICKED = "tw:bg-[var(--bk-accent-tint)]";

const FolderGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

export function MovePagesDialog({ open, pageNames, folders, onMove, onClose, current }: MovePagesDialogProps) {
  const [picked, setPicked] = React.useState<string>(TOP_LEVEL);
  React.useEffect(() => {
    if (open) setPicked(folders.find((f) => f.id !== current?.target)?.id ?? TOP_LEVEL);
  }, [open, folders, current?.target]);

  const count = pageNames.length;
  const targets = [...folders.map((f) => ({ id: f.id, name: f.name })), { id: TOP_LEVEL, name: "Top level (no folder)" }];
  const pickedFolder = folders.find((f) => f.id === picked);
  const single = current && count === 1 ? pageNames[0] : null;
  const already = single !== null && picked === current?.target;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={single ? `Move ${single} to…` : `Move ${count} page${count === 1 ? "" : "s"} to…`}
      testId="pages-move-dialog"
      footer={
        <>
          <Button color="light" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" data-testid="pages-move-confirm" disabled={already} onClick={() => onMove(picked)}>
            {already
              ? pickedFolder ? `Already in ${pickedFolder.name}` : "Already at top level"
              : !single && count > 1
                ? `Move ${count} pages`
                : pickedFolder ? `Move to ${pickedFolder.name}` : "Move to top level"}
          </Button>
        </>
      }
    >
      {/* The board says folders "live in this browser only"; they are kept per
          user on the server now, so the line says who sees them. */}
      <p className="tw:m-0 tw:mb-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
        {single
          ? `Choose where to organize ${single}. Folders are personal; only you see them. The page URL ${current!.url} stays unchanged.`
          : `${listNames(pageNames)}. Only your folder organization changes; page URLs and the homepage stay the same.`}
      </p>
      <div role="radiogroup" aria-label="Folders" className="tw:flex tw:flex-col">
        {targets.map((t) => (
          <label key={t.id || "top"} className={`${ROW} ${picked === t.id ? ROW_PICKED : ""}`}>
            <Radio color="blue" name="move-pages" value={t.id} checked={picked === t.id} onChange={() => setPicked(t.id)} />
            {t.id !== TOP_LEVEL && <FolderGlyph />}
            <span>{t.name}</span>
          </label>
        ))}
      </div>
      {already && (
        <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="pages-move-already">
          {pickedFolder ? `${single} is already in ${pickedFolder.name}. No change is needed.` : `${single} is already at the top level. No change is needed.`}
        </p>
      )}
    </Modal>
  );
}
