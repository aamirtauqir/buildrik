/**
 * ReplaceResultModal — the result of a replace across the site, one card
 * under whichever title the journey gives it: Clone 3695:43900 "Replacement
 * complete", 3695:43903 "Some uses could not update" → 3695:43906 "Retrying
 * failed use", and P6-V's 3720:43316 "Saved version applied". Phase 6,
 * section 4184:26629.
 *
 * P6-V's minimal build of P6-R's contract — `{ open, title, replaced, failed,
 * onRetry?, onDone, onViewVersions? }` plus the exported `summarizeByPage` —
 * so the versions journey can land without waiting. Main folds this into
 * R's component at merge; nothing here is meant to survive that beyond the
 * contract.
 *
 * Clean: `3 of 3 uses updated` / `Home: 2 updated · Menu: 1 updated` / `Other
 * elements are unchanged.` · Done · (View versions). Some failed: `2 updated ·
 * 1 failed` / the per-page line for the updated ones / one line per failed
 * placement, `Menu / Hero image: update could not be saved. The previous
 * image remains.` · Close · Retry failed use (primary; `Retrying failed
 * use…` while it runs). The per-page lines come from the elements' pages —
 * `getAllPages()` and each element's root, the way `checkInUse` traces a
 * placement home.
 *
 * Shape from `libraryModal.ts` at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

/* The engine's `Element` is a class; these are the few reads the summary
   needs, so a test can hand plain objects. */
interface Placed {
  getId(): string;
  getParent(): Placed | null;
  getAttribute(name: string): string | undefined;
  getType(): string;
}

/** What the summary reads off the composer — `Composer` is one structurally. */
export interface PageGraph {
  elements: {
    getAllPages(): ReadonlyArray<{ id: string; name?: string; root: { id: string } }>;
    getElement(id: string): Placed | undefined;
  };
}

/** Page names by their root element id — the join every placement walks. */
function pagesByRoot(composer: PageGraph): Map<string, string> {
  const byRoot = new Map<string, string>();
  for (const page of composer.elements.getAllPages()) byRoot.set(page.root.id, page.name ?? "Untitled page");
  return byRoot;
}

/** The page an element sits on, by walking its parents up to a page root. */
function pageOf(el: Placed, byRoot: Map<string, string>): string | null {
  let node: Placed | null = el;
  /* Bounded: a cycle in the parent chain would hang the dialog, and no tree
     in this product is anywhere near this deep. */
  for (let hops = 0; node && hops < 200; hops++) {
    const name = byRoot.get(node.getId());
    if (name !== undefined) return name;
    node = node.getParent();
  }
  return null;
}

/**
 * `[{ page: "Home", count: 2 }, { page: "Menu", count: 1 }]` for a set of
 * element ids — in page order; an element that cannot be traced to a page,
 * or no longer exists, is left out (the header line carries the true total).
 */
export function summarizeByPage(composer: PageGraph, ids: ReadonlyArray<string>): Array<{ page: string; count: number }> {
  const byRoot = pagesByRoot(composer);
  const counts = new Map<string, number>();
  for (const id of ids) {
    const el = composer.elements.getElement(id);
    const page = el ? pageOf(el, byRoot) : null;
    if (page !== null) counts.set(page, (counts.get(page) ?? 0) + 1);
  }
  const order = composer.elements.getAllPages().map((p) => p.name ?? "Untitled page");
  return order.filter((page) => counts.has(page)).map((page) => ({ page, count: counts.get(page) ?? 0 }));
}

/** `Menu / Hero image` — where a failed placement is, for its line. */
function describePlacement(composer: PageGraph, id: string): string {
  const el = composer.elements.getElement(id);
  if (!el) return "A removed element";
  const page = pageOf(el, pagesByRoot(composer)) ?? "Untitled page";
  return `${page} / ${el.getAttribute("data-name") ?? el.getType()}`;
}

export interface ReplaceResultModalProps {
  open: boolean;
  /** The journey's own title — `Replacement complete`, `Saved version applied`, … */
  title: string;
  replaced: string[];
  failed: string[];
  composer: PageGraph;
  /** Runs the replace again for the failed placements; the host updates
   *  `replaced` / `failed` from its result. */
  onRetry?(failed: string[]): Promise<void>;
  onDone(): void;
  /** P6-V's door back to Asset versions (3720:43316 `View versions`). */
  onViewVersions?(): void;
}

const useWord = (n: number) => `${n} ${n === 1 ? "use" : "uses"}`;

export function ReplaceResultModal({ open, title, replaced, failed, composer, onRetry, onDone, onViewVersions }: ReplaceResultModalProps) {
  const [retrying, setRetrying] = React.useState(false);
  const perPage = summarizeByPage(composer, replaced)
    .map(({ page, count }) => `${page}: ${count} updated`)
    .join(" · ");
  const clean = failed.length === 0;
  const heading = clean
    ? `${replaced.length} of ${useWord(replaced.length)} updated`
    : `${replaced.length} updated · ${failed.length} failed`;

  const retry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry(failed);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <ModalRoot open={open} onClose={onDone}>
      <ModalContent size="table" srTitle={title} data-testid="replace-result-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="replace-result-title">
          {title}
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="replace-result-count">
            {heading}
          </p>
          {perPage && (
            <p className={LIBRARY_MODAL_BODY} data-testid="replace-result-pages">
              {perPage}
            </p>
          )}
          {clean ? (
            <p className={LIBRARY_MODAL_BODY} data-testid="replace-result-note">
              Other elements are unchanged.
            </p>
          ) : (
            failed.map((id) => (
              <p key={id} className={`${LIBRARY_MODAL_BODY} tw:text-[var(--bk-error-text)]`} data-testid={`replace-result-failed-${id}`}>
                {describePlacement(composer, id)}: update could not be saved. The previous image remains.
              </p>
            ))
          )}
          {retrying && (
            <p className={LIBRARY_MODAL_BODY} role="status" data-testid="replace-result-retrying">
              Retrying failed {failed.length === 1 ? "use" : "uses"}…
            </p>
          )}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="replace-result-foot">
          {clean ? (
            <>
              <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} onClick={onDone} data-testid="replace-result-done">
                Done
              </Button>
              {/* 3720:43316 draws Done in the quiet grey fill and View
                  versions outlined on white — flowbite's own `light`. */}
              {onViewVersions && (
                <Button
                  size="xs"
                  variant="secondary"
                  className={LIBRARY_MODAL_BTN_PRIMARY}
                  onClick={onViewVersions}
                  data-testid="replace-result-view-versions"
                >
                  View versions
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} onClick={onDone} data-testid="replace-result-close">
                Close
              </Button>
              {onRetry && (
                <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} disabled={retrying} onClick={() => void retry()} data-testid="replace-result-retry">
                  Retry failed {failed.length === 1 ? "use" : "uses"}
                </Button>
              )}
            </>
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
