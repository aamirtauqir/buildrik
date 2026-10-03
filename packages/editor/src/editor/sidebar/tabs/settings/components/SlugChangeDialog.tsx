/**
 * SlugChangeDialog — 8135:213733 `Change the site URL?` (560): the confirm
 * the General screen's Save raises when the URL slug changed.
 *
 * The board's sample line says links to the old address stop working. The
 * code contract says otherwise and wins (precedence: behaviour → code): once
 * a site has deployed, `settings.update` pins its Vercel project to the old
 * slug (SA-06), so the live address does not move; only a site that has never
 * published takes its first address from the new slug. The body says which.
 *
 * `Cancel` takes focus and is what Escape and the scrim answer.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface SlugChangeDialogProps {
  /** The pending change; `null` keeps the dialog closed. */
  change: { from: string; to: string } | null;
  /** Host of the live site (`bella-cucina.vercel.app`), or null when it never published. */
  liveHost: string | null;
  onCancel(): void;
  onConfirm(): void;
}

function slugChangeBody(from: string, to: string, liveHost: string | null): string {
  return liveHost
    ? `${from} → ${to}. Your live address stays ${liveHost}; custom domains are not affected.`
    : `${from} → ${to}. Your first publish takes the site's address from it; custom domains are not affected.`;
}

export function SlugChangeDialog({ change, liveHost, onCancel, onConfirm }: SlugChangeDialogProps) {
  const title = "Change the site URL?";
  return (
    <ModalRoot open={change !== null} onClose={onCancel}>
      <ModalContent size="question" srTitle={title} data-testid="set-slug-confirm">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-slug-confirm-title">
          {title}
        </h2>
        <ModalBody>
          <p className={`${LIBRARY_MODAL_BODY} tw:text-[length:var(--bk-text-13)]`} data-testid="set-slug-confirm-body">
            {change ? slugChangeBody(change.from, change.to, liveHost) : null}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-slug-confirm-foot">
          <Button
            size="xs"
            variant="ghost"
            className={LIBRARY_MODAL_BTN_GHOST}
            autoFocus
            onClick={onCancel}
            data-testid="set-slug-confirm-cancel"
          >
            Cancel
          </Button>
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} onClick={onConfirm} data-testid="set-slug-confirm-ok">
            Change URL
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
