/**
 * SaveFailedBanner — boards 4418:124938 (Shell state 15 · Save failed) and
 * 4418:125678 (Exit · Save failed / stay in editor): a red card across the
 * top of the canvas column, 8px in from its edges.
 *
 * "Couldn't save <site> · <page>" / "Your changes are still here. Check your
 * connection, then retry saving. You have not left the editor." The primary
 * retries the save — and, when the failure came from leaving (Save & leave),
 * leaves once it lands. Keep editing puts the card away until the next
 * failure. The board's third door, "Sign in again", is not drawn: the save
 * pipeline reports a failure, not why, so it would be offered for a network
 * blip as readily as for an expired session (designer note).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Portal } from "@/editor/chrome-ui";

/** The board's inset from the canvas column's edges. */
const EDGE = 8;
/** Narrower than this the copy wraps a word per line — no column at all. */
const MIN_WIDTH = 480;
/** No usable canvas column means a full-page view covers it: clear the 256px
 *  nav every full-page screen draws at x:0 (FullPageRouter), EDGE in from the
 *  rest of the window. */
const FULL_PAGE_POSITION = { left: 256 + EDGE, top: EDGE, right: EDGE };

export const SaveFailedBanner: React.FC<{
  /** "<site> · <page>". */
  where: string;
  /** Set when the failed save was the exit's — the retry then leaves. */
  leaving: boolean;
  busy: boolean;
  /** Set when the server refused the save's brand tokens (TOKENS_INVALID):
   *  its reason. Not a connection problem, and the same save would be refused
   *  again, so the copy says so and Retry is not offered (unless leaving). */
  refusal?: string;
  /** Brand is read-only this session — there is no brand change to undo, so
   *  a refusal's copy points at Reload instead. */
  brandLocked?: boolean;
  onRetry: () => void;
  onKeepEditing: () => void;
}> = ({ where, leaving, busy, refusal, brandLocked = false, onRetry, onKeepEditing }) => {
  const [col, setCol] = React.useState<DOMRect | null>(null);
  React.useLayoutEffect(() => {
    const el = document.querySelector("[data-bk-toast-anchor]");
    /* Full-page views (Settings, Brand, Templates) cover the canvas column
       and squeeze it without unmounting it — to 0 in Settings, to a 48px
       sliver at x:0 in Brand (measured 2026-10-07: the banner 32px wide over
       the Brand nav, one word per line). So "non-zero" is not the test; "can
       hold the card" is, as in chrome-ui/Toast's measureAnchor. */
    const update = () => {
      const rect = el?.getBoundingClientRect() ?? null;
      setCol(rect && rect.width - 2 * EDGE >= MIN_WIDTH ? rect : null);
    };
    update();
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver === "undefined" || !el ? null : new ResizeObserver(update);
    if (el) ro?.observe(el);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <Portal>
      <div
        className="tw:fixed tw:z-[60] tw:flex tw:flex-col tw:gap-1 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-error-tint)] tw:px-3 tw:py-2 tw:[font-family:var(--bk-font-ui)]"
        style={col ? { left: col.left + EDGE, top: col.top + EDGE, width: col.width - 2 * EDGE } : FULL_PAGE_POSITION}
        role="alert"
        data-testid="save-failed-banner"
      >
        <span className="tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">Couldn&apos;t save {where}</span>
        <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
          {!refusal
            ? "Your changes are still here. Check your connection, then retry saving. You have not left the editor."
            : brandLocked
              ? `This site's brand was refused: ${refusal}. Your changes are kept in this browser — reload to keep editing.`
              : `The brand change was refused: ${refusal}. Your changes are kept in this browser — undo the last brand change, then keep editing.`}
        </span>
        <span className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
          {refusal && !leaving ? null : (
            <Button size="xs" className="tw:h-7" disabled={busy} aria-busy={busy || undefined} onClick={onRetry} data-testid="save-failed-retry">
              {leaving ? "Retry save & leave" : "Retry save"}
            </Button>
          )}
          <Button
            color="light"
            size="xs"
            className="tw:h-7 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)]"
            onClick={onKeepEditing}
            data-testid="save-failed-keep"
          >
            Keep editing
          </Button>
        </span>
      </div>
    </Portal>
  );
};
