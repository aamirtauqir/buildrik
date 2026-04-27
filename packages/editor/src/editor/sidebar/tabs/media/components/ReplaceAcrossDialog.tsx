import { Button } from "@/shared/ui/Button";
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

type DialogState =
  | { phase: "preview"; usageCount: number }
  | { phase: "committing" }
  | { phase: "result"; result: ReplaceAcrossResult };

export function ReplaceAcrossDialog({
  composer,
  oldSrc,
  newSrc,
  oldLabel,
  newLabel,
  onClose,
  onComplete,
}: ReplaceAcrossDialogProps) {
  const [state, setState] = React.useState<DialogState>(() => ({
    phase: "preview",
    usageCount: composer.mediaCommands.getUsages(oldSrc).count,
  }));

  const handleCommit = React.useCallback(() => {
    setState({ phase: "committing" });
    // Run on next tick so the UI repaints to the committing state.
    Promise.resolve().then(() => {
      const result = composer.mediaCommands.replaceAcross(oldSrc, newSrc);
      setState({ phase: "result", result });
      onComplete?.(result);
    });
  }, [composer, oldSrc, newSrc, onComplete]);

  const handleRetryFailed = React.useCallback(() => {
    if (state.phase !== "result") return;
    // Retry only the failed ids. Engine doesn't expose a targeted retry,
    // so we re-run replaceAcross — any elements that succeeded on round 1
    // already have newSrc and will be filtered out by findByMediaSrc(oldSrc).
    setState({ phase: "committing" });
    Promise.resolve().then(() => {
      const result = composer.mediaCommands.replaceAcross(oldSrc, newSrc);
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
              This will replace every use of this asset on your canvas with{" "}
              {newLabel ? <strong>{newLabel}</strong> : "the new asset"}. The
              change is one undo step.
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
            <footer className="med-rx-footer">
              <Button type="button" className="med-rx-btn" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="med-rx-btn med-rx-btn--primary"
                onClick={handleCommit}
                disabled={state.usageCount === 0}
              >
                Replace {state.usageCount} use{state.usageCount === 1 ? "" : "s"}
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
