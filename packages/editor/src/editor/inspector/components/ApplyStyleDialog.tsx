/**
 * ApplyStyleDialog — the confirm behind ⋯ "Apply style to all {H3 headings}
 * on this page (N)" (DD-6b, board 31): the count, what is copied / kept /
 * skipped (locked peers and peers inside a component instance), the Brand
 * hint for text types, then one transaction through `applyStyleToPeers` and
 * the "Applied to N … · Undo" toast, whose Undo reverts every peer at once.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { ConfirmDialog, useToast } from "@/editor/chrome-ui";
import { applyStyleToPeers, findStylePeers } from "@/engine/commands/stylePeers";
import { peerKindLabel } from "@/editor/shared/elementActions";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
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

/** "H3 headings" → "H3 heading" for one. */
const nounFor = (plural: string, n: number) => (n === 1 ? plural.replace(/s$/, "") : plural);

const HEAD = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-4 tw:text-[var(--bk-ink-soft)]";
const LINE = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

export function ApplyStyleDialog({ composer, elementId, breakpoint, pseudo, onClose }: ApplyStyleDialogProps) {
  const { addToast } = useToast();
  const source = elementId ? composer?.elements.getElement(elementId) ?? null : null;
  if (!composer || !source) return null;

  const { peers, skippedLocked, skippedInInstance } = findStylePeers(composer, source);
  const kind = peerKindLabel(source);
  /* "2 locked headings" — the kind without its level. */
  const noun = kind.replace(/^H[1-6] /, "");
  const page = composer.elements.getActivePage()?.name ?? "this page";
  const skipped = [
    skippedLocked > 0 ? `${skippedLocked} locked ${nounFor(noun, skippedLocked)}` : null,
    skippedInInstance > 0 ? `${skippedInInstance} inside a component` : null,
  ].filter(Boolean);

  const apply = () => {
    onClose();
    const n = applyStyleToPeers(composer, source, peers, { breakpoint, pseudo });
    if (n > 0) {
      addToast({
        description: `Applied to ${n} ${nounFor(kind, n)}`,
        action: { label: "Undo", onClick: composer.history.captureUndo() },
      });
    }
  };

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={apply}
      width="sm"
      testId="inspector-apply-style-dialog"
      title={`Apply this style to ${peers.length} ${nounFor(kind, peers.length)} on ${page}?`}
      message={
        <div className="tw:flex tw:flex-col tw:gap-1">
          <p className={HEAD}>Copies</p>
          <p className={LINE}>Typography, fill, border and effects</p>
          <p className={HEAD}>Keeps</p>
          <p className={LINE}>Text, links, CMS bindings and layout</p>
          {skipped.length > 0 ? (
            <>
              <p className={HEAD}>Skipped</p>
              <p className={LINE}>{skipped.join(" · ")}</p>
            </>
          ) : null}
          {capabilitiesFor(source.getType()).typography === "open" ? (
            <p className={LINE}>For reuse across pages, save this as a text style in Brand.</p>
          ) : null}
        </div>
      }
      confirmLabel={`Apply to ${peers.length}`}
    />
  );
}
