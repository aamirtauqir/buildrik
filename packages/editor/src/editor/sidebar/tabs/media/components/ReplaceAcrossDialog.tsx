/**
 * ReplaceAcrossDialog — confirms and surfaces results of replace-across-canvas.
 *
 * Two states:
 *   1. Pre-commit  — preview (before/after thumbs) + "Replace N uses" button.
 *   2. Post-commit — summary: "N replaced, M failed" with Retry-failed CTA
 *                    when `failed.length > 0`.
 *
 * Engine enforces atomicity: either the whole batch commits or it's rolled back
 * (see MediaCommandLayer.replaceAcross). The `failed[]` array is produced for
 * per-element error reporting, not transactional rollback.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine/Composer";
import type { ReplaceAcrossResult } from "../../../../../engine/media/MediaCommandLayer";
import { Button, Checkbox } from "@/editor/chrome-ui";

interface ReplaceAcrossDialogProps {
  composer: Composer;
  oldSrc: string;
  newSrc: string;
  /** Human-readable labels for the two assets (name, filename, etc.). */
  oldLabel?: string;
  newLabel?: string;
  /** Called after dialog closes, regardless of commit result. */
  onClose(): void;
  /** Called with the engine result after a commit (for toasts, telemetry). */
  onComplete?(result: ReplaceAcrossResult): void;
}

interface PageRow {
  id: string;
  name: string;
  useCount: number;
}

type DialogState =
  | { phase: "preview"; pages: PageRow[]; selected: Set<string> }
  | { phase: "committing" }
  | { phase: "result"; result: ReplaceAcrossResult };

function buildPageRows(composer: Composer, oldSrc: string): PageRow[] {
  const byPage = composer.mediaOps.getUsagesByPage(oldSrc);
  const allPages = composer.elements.getAllPages?.() ?? [];
  const nameById = new Map(allPages.map((p) => [p.id, p.name ?? p.id]));
  const rows: PageRow[] = [];
  for (const [pageId, elements] of byPage) {
    rows.push({
      id: pageId,
      name: nameById.get(pageId) ?? pageId,
      useCount: elements.length,
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
const RX_BTN =
  "tw:h-[var(--bk-size-row)] tw:px-[var(--bk-space-12)] tw:border " +
  "tw:border-[var(--bk-border)] tw:rounded-[var(--bk-radius-md)] " +
  "tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)] tw:text-[13px] " +
  "tw:leading-[18px] tw:font-normal tw:[font-family:var(--bk-font-ui)] " +
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
  onComplete,
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
    () => (state.phase === "preview" ? state.pages.reduce((n, p) => n + p.useCount, 0) : 0),
    [state],
  );

  const selectedTotals = React.useMemo(() => {
    if (state.phase !== "preview") return { uses: 0, pages: 0 };
    let uses = 0;
    let pages = 0;
    for (const p of state.pages) {
      if (state.selected.has(p.id)) {
        uses += p.useCount;
        pages += 1;
      }
    }
    return { uses, pages };
  }, [state]);

  const handleCommit = React.useCallback(() => {
    if (state.phase !== "preview") return;
    const pageIds = state.pages
      .filter((p) => state.selected.has(p.id))
      .map((p) => p.id);
    setState({ phase: "committing" });
    Promise.resolve().then(() => {
      const result = composer.mediaOps.replaceAcrossSelective(
        oldSrc,
        newSrc,
        pageIds,
      );
      setState({ phase: "result", result });
      onComplete?.(result);
    });
  }, [composer, oldSrc, newSrc, onComplete, state]);

  const handleRetryFailed = React.useCallback(() => {
    if (state.phase !== "result") return;
    // Retry: re-run against ALL pages with the asset (elements that succeeded
    // on round 1 already have newSrc and are filtered out by findByMediaSrc).
    setState({ phase: "committing" });
    Promise.resolve().then(() => {
      const result = composer.mediaOps.replaceAcross(oldSrc, newSrc);
      setState({ phase: "result", result });
      onComplete?.(result);
    });
  }, [composer, oldSrc, newSrc, onComplete, state]);

  return (
    <>
      <div className="med-rx-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="med-rx-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="med-rx-title"
      >
        <h2 id="med-rx-title" className="med-rx-title">
          Replace across site
        </h2>

        {state.phase === "preview" ? (
          <>
            <p className="med-rx-body">
              Every place that uses {oldLabel ? <strong>{oldLabel}</strong> : "this asset"}
              {" "}— {totalUses} in total — will switch to the image you pick. This can be
              undone.
            </p>
            <div className="med-rx-preview">
              <div className="med-rx-preview__before">
                <img src={oldSrc} alt="" />
                <span>Before</span>
              </div>
              <div className="med-rx-preview__arrow" aria-hidden="true">
                →
              </div>
              <div className="med-rx-preview__after">
                <img src={newSrc} alt="" />
                <span>After</span>
              </div>
            </div>
            {state.pages.length === 0 ? (
              <p className="med-rx-body med-rx-body--empty">
                This asset is not used on any page.
              </p>
            ) : (
              <ul
                className="med-rx-pages"
                role="list"
                aria-label="Pages to replace on"
                data-testid="rx-pages-list"
              >
                {state.pages.map((p) => (
                  <li key={p.id} className="med-rx-page-row">
                    <label className="med-rx-page-label">
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
                        {p.useCount} use{p.useCount === 1 ? "" : "s"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <footer className="med-rx-footer">
              <Button type="button" className={RX_BTN} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className={`${RX_BTN} ${RX_BTN_PRIMARY}`}
                onClick={handleCommit}
                disabled={selectedTotals.uses === 0}
              >
                Replace {selectedTotals.uses} use
                {selectedTotals.uses === 1 ? "" : "s"} on {selectedTotals.pages}{" "}
                page{selectedTotals.pages === 1 ? "" : "s"}
              </Button>
            </footer>
          </>
        ) : null}

        {state.phase === "committing" ? (
          <p className="med-rx-body" role="status" aria-live="polite">
            Replacing…
          </p>
        ) : null}

        {state.phase === "result" ? (
          <ResultView
            result={state.result}
            onRetryFailed={handleRetryFailed}
            onClose={onClose}
          />
        ) : null}
      </div>
    </>
  );
}

function ResultView({
  result,
  onRetryFailed,
  onClose,
}: {
  result: ReplaceAcrossResult;
  onRetryFailed(): void;
  onClose(): void;
}) {
  const { replaced, failed, clean } = result;

  if (clean && replaced.length > 0) {
    return (
      <>
        <p className="med-rx-body med-rx-body--success" role="status">
          Replaced {replaced.length} use{replaced.length === 1 ? "" : "s"} ✓
        </p>
        <footer className="med-rx-footer">
          {/* Board 1174:4849's clean result closes on an 11/500 text link, not
              on the filled 32-tall button the confirm and partial phases use:
              there is nothing left to decide, so nothing to weight. */}
          <Button
            type="button"
            variant="link"
            className="tw:text-[length:var(--bk-text-11)] tw:font-medium"
            onClick={onClose}
          >
            Done
          </Button>
        </footer>
      </>
    );
  }

  if (replaced.length === 0) {
    return (
      <>
        <p className="med-rx-body med-rx-body--error" role="alert">
          Nothing replaced — all {failed.length} update{failed.length === 1 ? "" : "s"}{" "}
          failed. No changes committed.
        </p>
        <details className="med-rx-failed">
          <summary>Show errors ({failed.length})</summary>
          <ul>
            {failed.map((f) => (
              <li key={f.elementId}>
                <code>{f.elementId}</code>: {f.error}
              </li>
            ))}
          </ul>
        </details>
        <footer className="med-rx-footer">
          <Button type="button" className={RX_BTN} onClick={onClose}>
            Close
          </Button>
        </footer>
      </>
    );
  }

  // Partial failure: some replaced, some failed.
  return (
    <>
      <p className="med-rx-body med-rx-body--warn" role="alert">
        {replaced.length} replaced, {failed.length} failed.
      </p>
      <details className="med-rx-failed" open>
        <summary>Failed elements ({failed.length})</summary>
        <ul>
          {failed.map((f) => (
            <li key={f.elementId}>
              <code>{f.elementId}</code>: {f.error}
            </li>
          ))}
        </ul>
      </details>
      <footer className="med-rx-footer">
        <Button type="button" className={RX_BTN} onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          className={`${RX_BTN} ${RX_BTN_PRIMARY}`}
          onClick={onRetryFailed}
        >
          Retry failed
        </Button>
      </footer>
    </>
  );
}
