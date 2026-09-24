/**
 * BrandDiscardDialog — board `7317:80979` "Discard brand changes?" (confirm).
 *
 * The guard on the way OUT of the Brand workspace while edits are staged and
 * unsaved: `‹ Back to canvas` and Escape both raise it (the workspace boards'
 * KEY_D is `if draft → 7317:80979 (overlay) else → canvas`). `Keep editing`
 * is the safe answer — it takes focus, and Escape and the scrim give the same
 * answer; `Discard changes` is the danger action and the only one that leaves.
 *
 * The board's body is sample data ("Your colour edit has not been saved…"); the
 * SHAPE is the contract: what is unsaved, and that Discard throws it away.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";

export interface BrandDiscardDialogProps {
  open: boolean;
  /** Staged, unsaved brand edits — the number the body names. */
  count: number;
  /** Also Escape and the scrim. */
  onKeepEditing(): void;
  onDiscard(): void;
}

/* 7317:80979's two buttons are 32 tall (the Modal footer's default is 28;
   the footer's descendant rule outranks a plain utility, hence `!`). */
const BTN = "tw:h-8! tw:px-3!";

export function BrandDiscardDialog({ open, count, onKeepEditing, onDiscard }: BrandDiscardDialogProps) {
  /* The safe answer takes focus. The Modal focuses its first control, which
     in the board's order is the danger one — so Enter would discard. */
  const keepRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);
  const what = count === 1 ? "brand edit has" : `${count} brand edits have`;
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      title="Discard brand changes?"
      /* 560 wide (7317:80979) — the Modal's "form" width; "question" is 440. */
      kind="form"
      testId="brand-discard"
      footer={
        <>
          {/* The board's order: the danger action first, the safe one last
              and primary — it keeps focus, and Escape / the scrim answer it. */}
          <Button size="xs" variant="danger" onClick={onDiscard} className={BTN} data-testid="brand-discard-confirm">
            Discard changes
          </Button>
          <Button ref={keepRef} size="xs" onClick={onKeepEditing} className={BTN} data-testid="brand-discard-keep">
            Keep editing
          </Button>
        </>
      }
    >
      <p className="tw:m-0" data-testid="brand-discard-body">
        Your {what} not been saved. Discard {count === 1 ? "it" : "them"} and leave Brand, or keep editing.
      </p>
    </Modal>
  );
}
