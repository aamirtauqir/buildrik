/**
 * ReplaceResultModal — the Clone's four replace-across outcome cards (640),
 * section 4184:26629: 3695:43897 "Replacing image" · 3695:43900 "Replacement
 * complete" · 3695:43903 "Some uses could not update" · 3695:43906 "Retrying
 * failed use". P6-V's "Applying saved version" / "Saved version applied"
 * (3720:43313 / 3720:43316) are the same card under another title with a
 * View versions door, so there is ONE component with `title` and `busy` as
 * props. Displaces V1 board 1174:4849's three result states (the `Replaced 3
 * uses ✓` line, the `▸ Failed elements` disclosure and its text-link footer).
 *
 * The caller owns its own run: it mounts the card `busy` while its
 * `replaceAcross` is in flight and hands over the ids when it resolves. The
 * retry is the card's: `onRetry(failed)` runs while `Retrying failed use`
 * shows, then what came back is merged — the 2 already updated are never
 * repeated (3695:43906's line says so) — and the card is complete or partial
 * again.
 *
 * Per-page lines come from the engine: `summarizeByPage` joins each id to its
 * page through `composer.elements.getAllPages()` and the element's parent
 * chain, the trace `checkInUse` in useSelectionState.ts already runs, in the
 * site's page order. A failed placement is `<Page> / <label>` — the
 * `data-name` the used-in view reads (`collectUsageByPage`), else the type's
 * label.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ReplaceAcrossResult } from "@/engine/media/MediaCommandLayer";
import { ELEMENT_TYPE_LABELS } from "@shared/constants/elementTypeLabels";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_OUTLINE,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

export interface ReplaceOutcome {
  /** Ids of the elements whose src now points at the replacement. */
  replaced: string[];
  /** Ids of the elements the engine could not update — their src is unchanged. */
  failed: string[];
}

export interface ReplaceResultModalProps extends ReplaceOutcome {
  open: boolean;
  /** The engine the ids belong to — the per-page lines and the failed placements are read from it. */
  composer: Composer;
  /** The complete card's title: `Replacement complete` (3695:43900) or `Saved version applied` (3720:43316). */
  title: string;
  /** While the caller's own run is in flight: the progress card (3695:43897 / 3720:43313). `title` defaults to `Replacing image`. */
  busy?: { title?: string; label: string };
  /** Runs the failed placements again. Omitted, a partial result offers Close only. */
  onRetry?(failed: string[]): Promise<ReplaceOutcome>;
  /** Done on a complete card, Close on a partial one. */
  onDone(): void;
  /** 3720:43316 — a second door beside Done. */
  onViewVersions?(): void;
}

/** `replaceAcross`'s result as the ids this card takes. */
export function resultIds(result: ReplaceAcrossResult): ReplaceOutcome {
  return {
    replaced: result.replaced.map((r) => r.elementId),
    failed: result.failed.map((f) => f.elementId),
  };
}

/** `Home and Menu` · `Home, Menu and About`. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const uses = (n: number) => `${n} use${n === 1 ? "" : "s"}`;

/** The page an element sits on, by walking its parents up to a page root. */
function pageNameFor(composer: Composer, id: string, pageOfRoot: Map<string, string>): string | null {
  let node = composer.elements.getElement?.(id) ?? null;
  /* Bounded the way checkInUse bounds it: a cycle must not hang the dialog. */
  for (let hops = 0; node && hops < 200; hops++) {
    const name = pageOfRoot.get(node.getId());
    if (name !== undefined) return name;
    node = node.getParent();
  }
  return null;
}

/** Page name by page-root id, in the site's page order. */
function pageRoots(composer: Composer): Map<string, string> {
  const pageOfRoot = new Map<string, string>();
  for (const p of composer.elements.getAllPages?.() ?? []) {
    if (p.root?.id) pageOfRoot.set(p.root.id, p.name ?? "Untitled page");
  }
  return pageOfRoot;
}

/**
 * How many of `ids` sit on each page, in the site's page order. Ids the
 * pages cannot place are left out — the caller counts them from `ids`.
 */
export function summarizeByPage(composer: Composer, ids: string[]): Array<{ page: string; count: number }> {
  const pageOfRoot = pageRoots(composer);
  const counts = new Map<string, number>();
  for (const id of ids) {
    const page = pageNameFor(composer, id, pageOfRoot);
    if (page !== null) counts.set(page, (counts.get(page) ?? 0) + 1);
  }
  const out: Array<{ page: string; count: number }> = [];
  for (const page of pageOfRoot.values()) {
    const count = counts.get(page);
    if (count) out.push({ page, count });
  }
  return out;
}

/** 3695:43897's progress line for the ids about to be replaced. */
export function replacingLabel(composer: Composer, ids: string[]): string {
  const pages = summarizeByPage(composer, ids).map((s) => s.page);
  const where = pages.length === 0 ? "" : pages.length === 1 ? ` on ${pages[0]}` : ` across ${joinNames(pages)}`;
  return `Updating ${uses(ids.length)}${where}. Please wait.`;
}

/** `Menu / Hero image` — the page, then the placement's name or its type label. */
function describePlacement(composer: Composer, id: string, pageOfRoot: Map<string, string>): string {
  const el = composer.elements.getElement?.(id);
  const type = el?.getType() ?? "";
  const label =
    el?.getAttribute("data-name") ?? (el ? ELEMENT_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1) : id);
  const page = pageNameFor(composer, id, pageOfRoot);
  return page === null ? label : `${page} / ${label}`;
}

export function ReplaceResultModal({
  open,
  composer,
  title,
  replaced,
  failed,
  busy,
  onRetry,
  onDone,
  onViewVersions,
}: ReplaceResultModalProps) {
  /* What the retries have made of the caller's ids: the updated set grows,
     the failed set is the last round's. Null until the first retry. */
  const [round, setRound] = React.useState<ReplaceOutcome | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  React.useEffect(() => {
    if (!open) {
      setRound(null);
      setRetrying(false);
    }
  }, [open]);

  const outcome = round ?? { replaced, failed };
  const pageOfRoot = pageRoots(composer);
  const failedPlacements = outcome.failed.map((id) => describePlacement(composer, id, pageOfRoot));

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      const next = await onRetry(outcome.failed);
      setRound({ replaced: [...outcome.replaced, ...next.replaced], failed: next.failed });
    } catch {
      /* The engine rolled the retry back: nothing changed, so the same card
         with the same failed placements is the honest state to return to. */
    } finally {
      setRetrying(false);
    }
  };

  /* While a run is in flight there is nothing to close to. */
  const inFlight = (busy !== undefined && round === null) || retrying;

  let heading: string;
  let body: React.ReactNode;
  let foot: React.ReactNode = null;
  if (retrying) {
    heading = "Retrying failed use";
    const n = outcome.replaced.length;
    body = (
      <p className={LIBRARY_MODAL_BODY} data-testid="rx-result-busy" role="status" aria-live="polite">
        {n === 0
          ? `Retrying ${joinNames(failedPlacements)}.`
          : `Retrying ${joinNames(failedPlacements)} only. The ${n} successful update${n === 1 ? "" : "s"} will not be repeated.`}
      </p>
    );
  } else if (busy !== undefined && round === null) {
    heading = busy.title ?? "Replacing image";
    body = (
      <p className={LIBRARY_MODAL_BODY} data-testid="rx-result-busy" role="status" aria-live="polite">
        {busy.label}
      </p>
    );
  } else {
    const pages = summarizeByPage(composer, outcome.replaced)
      .map((s) => `${s.page}: ${s.count} updated`)
      .join(" · ");
    const partial = outcome.failed.length > 0;
    heading = partial ? "Some uses could not update" : title;
    body = (
      <>
        <p className={LIBRARY_MODAL_BODY} data-testid="rx-result-count">
          {partial
            ? `${outcome.replaced.length} updated · ${outcome.failed.length} failed`
            : `${outcome.replaced.length} of ${uses(outcome.replaced.length)} updated`}
        </p>
        {pages ? (
          <p className={LIBRARY_MODAL_BODY} data-testid="rx-result-pages">
            {pages}
          </p>
        ) : null}
        {partial ? (
          failedPlacements.map((placement, i) => (
            <p key={outcome.failed[i]} className={LIBRARY_MODAL_BODY} data-testid={`rx-result-failed-${i}`}>
              {placement}: update could not be saved. The previous image remains.
            </p>
          ))
        ) : (
          <p className={LIBRARY_MODAL_BODY} data-testid="rx-result-note">
            Other elements are unchanged.
          </p>
        )}
      </>
    );
    foot = partial ? (
      <div className={LIBRARY_MODAL_FOOT} data-testid="rx-result-foot">
        <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} data-testid="rx-result-close" onClick={onDone}>
          Close
        </Button>
        {onRetry ? (
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="rx-result-retry" autoFocus onClick={() => void handleRetry()}>
            Retry failed use
          </Button>
        ) : null}
      </div>
    ) : (
      <div className={LIBRARY_MODAL_FOOT} data-testid="rx-result-foot">
        <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} data-testid="rx-result-done" autoFocus onClick={onDone}>
          Done
        </Button>
        {onViewVersions ? (
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} data-testid="rx-result-versions" onClick={onViewVersions}>
            View versions
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <ModalRoot open={open} onClose={inFlight ? undefined : onDone} dismissOnScrimClick={!inFlight}>
      <ModalContent size="table" srTitle={heading} data-testid="rx-result">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="rx-result-title">
          {heading}
        </h2>
        <ModalBody>{body}</ModalBody>
        {foot}
      </ModalContent>
    </ModalRoot>
  );
}
