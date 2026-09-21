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

export function BrandDiscardDialog({ open, count, onKeepEditing, onDiscard }: BrandDiscardDialogProps) {
  const edits = count === 1 ? "1 brand edit has" : `${count} brand edits have`;
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      title="Discard brand changes?"
      kind="question"
      testId="brand-discard"
      footer={
        <>
          <Button size="xs" variant="secondary" autoFocus onClick={onKeepEditing} data-testid="brand-discard-keep">
            Keep editing
          </Button>
          <Button size="xs" variant="danger" onClick={onDiscard} data-testid="brand-discard-confirm">
            Discard changes
          </Button>
        </>
      }
    >
      <p className="tw:m-0" data-testid="brand-discard-body">
        Your {edits} not been saved. Discard {count === 1 ? "it" : "them"} and go back to the canvas?
      </p>
    </Modal>
  );
}
