import { Button } from "@/editor/shared/vibcoder/Button";
import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";
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
          Replace {oldLabel ? `"${oldLabel}"` : "asset"} across canvas
        </h2>

        {state.phase === "preview" ? (
          <>
            <p className="med-rx-body">
              Replace this asset with{" "}
              {newLabel ? <strong>{newLabel}</strong> : "the new asset"} on the
              selected pages. The change is one undo step.
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
                    <Checkbox
                      className="med-rx-page-label"
                      checked={state.selected.has(p.id)}
                      onChange={() => handleTogglePage(p.id)}
                      data-testid={`rx-page-${p.id}`}
                      aria-label={`Replace on ${p.name}`}
                      label={
                        <>
                          <span className="med-rx-page-name">{p.name}</span>
                          <span className="med-rx-page-count">
                            {p.useCount} use{p.useCount === 1 ? "" : "s"}
                          </span>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
            <footer className="med-rx-footer">
              <Button type="button" className="med-rx-btn" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="med-rx-btn med-rx-btn--primary"
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
          <Button
            type="button"
            className="med-rx-btn med-rx-btn--primary"
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
          <Button type="button" className="med-rx-btn" onClick={onClose}>
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
        <Button type="button" className="med-rx-btn" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          className="med-rx-btn med-rx-btn--primary"
          onClick={onRetryFailed}
        >
          Retry failed
        </Button>
      </footer>
    </>
  );
}
