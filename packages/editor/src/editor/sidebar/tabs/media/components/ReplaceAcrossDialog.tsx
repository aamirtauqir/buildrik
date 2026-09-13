/**
 * ReplaceAcrossDialog — the drawer's Replace across site.
 *
 * Two halves:
 *   1. Pre-commit  — board 1164:4738 (the Clone does not re-draw it): preview
 *                    (before/after thumbs), the per-page checkbox list and the
 *                    "Replace N uses on M pages" button.
 *   2. The result  — the Clone's `ReplaceResultModal` (3695:43897 Replacing
 *                    image → 3695:43900 Replacement complete / 3695:43903 Some
 *                    uses could not update → 3695:43906 Retrying failed use).
 *                    V1 board 1174:4849's states are displaced. The card
 *                    stands alone: this frame unmounts while it shows.
 *
 * Engine enforces atomicity: either the whole batch commits or it's rolled back
 * (see MediaCommandLayer.replaceAcross). The `failed[]` array is produced for
 * per-element error reporting, not transactional rollback. A retry runs the
 * SAME page scope again — the elements already updated no longer match the
 * old src, the unchecked pages were never in scope.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine/Composer";
import { Button, Checkbox } from "@/editor/chrome-ui";
import { ReplaceResultModal, replacingLabel, resultIds } from "@/editor/media/components/ReplaceResultModal";
/* `.med-rx-*` lives in MediaTab.css, which only MediaTab imported — so this
   dialog drew as unstyled block flow anywhere it was mounted without its
   panel. Same defect board 1205:4829 found on FolderTree, same fix: the
   component owns its own styles. */
import "../MediaTab.css";

interface ReplaceAcrossDialogProps {
  composer: Composer;
  oldSrc: string;
  newSrc: string;
  /** Human-readable labels for the two assets (name, filename, etc.). */
  oldLabel?: string;
  newLabel?: string;
  /** Called after dialog closes, regardless of commit result. */
  onClose(): void;
}

interface PageRow {
  id: string;
  name: string;
  /** The placements on this page — what the commit is about to update. */
  elementIds: string[];
}

type DialogState =
  | { phase: "preview"; pages: PageRow[]; selected: Set<string> }
  | { phase: "committing"; pageIds: string[]; targets: string[] }
  | { phase: "result"; pageIds: string[]; replaced: string[]; failed: string[] };

function buildPageRows(composer: Composer, oldSrc: string): PageRow[] {
  const byPage = composer.mediaOps.getUsagesByPage(oldSrc);
  const allPages = composer.elements.getAllPages?.() ?? [];
  const nameById = new Map(allPages.map((p) => [p.id, p.name ?? p.id]));
  const rows: PageRow[] = [];
  for (const [pageId, elements] of byPage) {
    rows.push({
      id: pageId,
      name: nameById.get(pageId) ?? pageId,
      elementIds: elements.map((el) => el.getId()),
    });
  }
  return rows;
}

/*
  Dialog buttons as `tw:` utilities. The rest of this dialog keeps its CSS
  rules — the scrim carries an @lint-hex-policy literal that belongs in a
  stylesheet — but a chrome-ui Button's geometry is exactly what the caller
  className is for, per chrome-ui/__tests__/className-precedence.test.tsx.
*/
/* Boards 1164:4748 / 1164:4750 — the confirm buttons HUG on a 12/8 pad at 11px
   rather than sitting on a fixed 32 row at 13px. The fixed height is the
   reason the board's 8 vertical pad measured 0: a set height and a padding
   are not the same property, so nothing conflicted and nothing won. */
const RX_BTN =
  "tw:px-[var(--bk-space-12)] tw:py-2 tw:border " +
  "tw:border-[var(--bk-border)] tw:rounded-[var(--bk-radius-md)] " +
  "tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-ink-soft)] tw:text-[11px] " +
  "tw:font-normal tw:[font-family:var(--bk-font-ui)] " +
  "tw:cursor-pointer tw:enabled:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:cursor-not-allowed " +
  "tw:focus-visible:outline-none tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

const RX_BTN_PRIMARY =
  "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent)] " +
  "tw:text-[var(--bk-accent-on)] tw:font-medium " +
  "tw:enabled:hover:bg-[var(--bk-accent-hover)]";

export function ReplaceAcrossDialog({
  composer,
  oldSrc,
  newSrc,
  oldLabel,
  newLabel,
  onClose,
}: ReplaceAcrossDialogProps) {
  const [state, setState] = React.useState<DialogState>(() => {
    const pages = buildPageRows(composer, oldSrc);
    return {
      phase: "preview",
      pages,
      selected: new Set(pages.map((p) => p.id)),
    };
  });

  const handleTogglePage = React.useCallback((pageId: string) => {
    setState((prev) => {
      if (prev.phase !== "preview") return prev;
      const next = new Set(prev.selected);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return { ...prev, selected: next };
    });
  }, []);

  /* Board 1164:4738 leads with the blast radius across the WHOLE site, not
     just the pages currently ticked — that number is what the sentence is
     warning about. */
  const totalUses = React.useMemo(
    () => (state.phase === "preview" ? state.pages.reduce((n, p) => n + p.elementIds.length, 0) : 0),
    [state],
  );

  const selectedTotals = React.useMemo(() => {
    if (state.phase !== "preview") return { uses: 0, pages: 0 };
    let uses = 0;
    let pages = 0;
    for (const p of state.pages) {
      if (state.selected.has(p.id)) {
        uses += p.elementIds.length;
        pages += 1;
      }
    }
    return { uses, pages };
  }, [state]);

  const handleCommit = React.useCallback(() => {
    if (state.phase !== "preview") return;
    const checked = state.pages.filter((p) => state.selected.has(p.id));
    const pageIds = checked.map((p) => p.id);
    const targets = checked.flatMap((p) => p.elementIds);
    setState({ phase: "committing", pageIds, targets });
    /* A microtask later, so the busy card paints before the synchronous run.
       A throw is the engine's rollback — nothing changed, so every target is
       a failed placement the card can offer to retry. */
    Promise.resolve()
      .then(() => resultIds(composer.mediaOps.replaceAcrossSelective(oldSrc, newSrc, pageIds)))
      .catch(() => ({ replaced: [], failed: targets }))
      .then((result) => setState({ phase: "result", pageIds, ...result }));
  }, [composer, oldSrc, newSrc, state]);

  if (state.phase !== "preview") {
    const { pageIds } = state;
    return (
      <ReplaceResultModal
        open
        composer={composer}
        title="Replacement complete"
        replaced={state.phase === "result" ? state.replaced : []}
        failed={state.phase === "result" ? state.failed : []}
        busy={state.phase === "committing" ? { label: replacingLabel(composer, state.targets) } : undefined}
        onRetry={async () => resultIds(composer.mediaOps.replaceAcrossSelective(oldSrc, newSrc, pageIds))}
        onDone={onClose}
      />
    );
  }

  return (
    <>
      <div className="med-rx-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="med-rx-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="med-rx-title"
        data-testid="rx-dialog"
      >
        <h2 id="med-rx-title" className="med-rx-title" data-testid="rx-title">
          Replace across site
        </h2>

        <p className="med-rx-body">
          Every place that uses {oldLabel ? <strong>{oldLabel}</strong> : "this asset"}
          {" "}— {totalUses} in total — will switch to the image you pick. This can be
          undone.
        </p>
        <div className="med-rx-preview" data-testid="rx-swap">
          <div className="med-rx-preview__before">
            <img src={oldSrc} alt="" data-testid="rx-thumb-before" />
            <span>Before</span>
          </div>
          <div className="med-rx-preview__arrow" aria-hidden="true" data-testid="rx-swap-arrow">
            →
          </div>
          <div className="med-rx-preview__after">
            <img src={newSrc} alt="" data-testid="rx-thumb-after" />
            <span>After</span>
          </div>
        </div>
        {state.pages.length === 0 ? (
          <p className="med-rx-body med-rx-body--empty">
            This asset is not used on any page.
          </p>
        ) : (
          <>
          {/* 1174:4833 — the list is captioned. Without it the checkbox
              column reads as a second confirmation rather than a scope
              picker. */}
          <p className="med-rx-pages-label" id="med-rx-pages-label" data-testid="rx-pages-label">
            PAGES
          </p>
          <ul
            className="med-rx-pages"
            role="list"
            aria-labelledby="med-rx-pages-label"
            data-testid="rx-pages-list"
          >
            {state.pages.map((p) => (
              <li key={p.id}>
                <label className="med-rx-page-label" data-testid={`rx-page-label-${p.id}`}>
                  <Checkbox
                    color="blue"
                    className="tw:bg-white"
                    checked={state.selected.has(p.id)}
                    onChange={() => handleTogglePage(p.id)}
                    data-testid={`rx-page-${p.id}`}
                    aria-label={`Replace on ${p.name}`}
                  />
                  <span className="med-rx-page-name">{p.name}</span>
                  <span className="med-rx-page-count">
                    {p.elementIds.length} use{p.elementIds.length === 1 ? "" : "s"}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          </>
        )}
        <footer className="med-rx-footer" data-testid="rx-foot">
          <Button type="button" className={RX_BTN} data-testid="rx-cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className={`${RX_BTN} ${RX_BTN_PRIMARY}`}
            data-testid="rx-commit"
            onClick={handleCommit}
            disabled={selectedTotals.uses === 0}
          >
            Replace {selectedTotals.uses} use
            {selectedTotals.uses === 1 ? "" : "s"} on {selectedTotals.pages}{" "}
            page{selectedTotals.pages === 1 ? "" : "s"}
          </Button>
        </footer>
      </div>
    </>
  );
}
