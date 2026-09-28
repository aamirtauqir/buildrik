/**
 * ApplyStyleDialog — the confirm behind ⋯ "Apply style to all {H3 headings}
 * on this page (N)" (DD-6b, board 31). W1 stub with its final props: the
 * count, what is copied / kept / skipped, and one transaction through
 * `applyStyleToPeers`, then the "Applied to N … · Undo" toast. Lane L3-B
 * builds the board's rows and Brand hint.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { ConfirmDialog, useToast } from "@/editor/chrome-ui";
import { applyStyleToPeers, findStylePeers } from "@/engine/commands/stylePeers";
import { peerKindLabel } from "@/editor/shared/elementActions";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { PseudoStateId } from "@/shared/types";

export interface ApplyStyleDialogProps {
  composer: Composer | null | undefined;
  /** The element whose style is copied; null when closed. */
  elementId: string | null;
  breakpoint: BreakpointId;
  pseudo: PseudoStateId;
  onClose: () => void;
}

export function ApplyStyleDialog({ composer, elementId, breakpoint, pseudo, onClose }: ApplyStyleDialogProps) {
  const { addToast } = useToast();
  const source = elementId ? composer?.elements.getElement(elementId) ?? null : null;
  if (!composer || !source) return null;

  const { peers, skippedLocked, skippedInInstance } = findStylePeers(composer, source);
  const kind = peerKindLabel(source);
  const page = composer.elements.getActivePage()?.name ?? "this page";
  const skipped = skippedLocked + skippedInInstance;

  const apply = () => {
    onClose();
    const n = applyStyleToPeers(composer, source, peers, { breakpoint, pseudo });
    if (n > 0) {
      addToast({
        description: `Applied to ${n} ${kind}`,
        action: { label: "Undo", onClick: composer.history.captureUndo() },
      });
    }
  };

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={apply}
      testId="inspector-apply-style-dialog"
      title={`Apply this style to ${peers.length} ${kind} on ${page}?`}
      message={
        <div className="tw:flex tw:flex-col tw:gap-1 tw:text-[12px]">
          <p className="tw:m-0">Copies: font, size, colour, spacing, fill, border and effects.</p>
          <p className="tw:m-0">Keeps: their text, level, link, CMS binding, attributes and classes.</p>
          {skipped > 0 ? (
            <p className="tw:m-0">
              Skipped: {skippedLocked > 0 ? `${skippedLocked} locked` : null}
              {skippedLocked > 0 && skippedInInstance > 0 ? " · " : null}
              {skippedInInstance > 0 ? `${skippedInInstance} in a component` : null}
            </p>
          ) : null}
        </div>
      }
      confirmLabel={`Apply to ${peers.length}`}
    />
  );
}
