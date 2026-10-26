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
 * 2L9 (L-F W1, C05 `10:2199`): one strip — the line and its Retry — in the
 * board's words, "Save before publishing. Your changes are kept." That line
 * names the publish context, which this strip only sometimes has (it also
 * carries the exit's failed save and every plain save failure), so it is the
 * `context="publish"` variant; without a context the strip says what failed
 * and the same reassurance. Which variant the board means for a plain save
 * failure is `open:save-failed-copy-context`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Portal } from "@/editor/chrome-ui";
import { BANNER_ACTION_SECONDARY as ACTION } from "./GlobalBannerSlot";
import { BANNER_ID, useGlobalBanners } from "./globalBanners";
import { useCanvasColumnRect } from "./useCanvasColumnRect";

/** C05 `10:2199`: the strip sits 12 in from the canvas column's edges. */
const EDGE = 12;
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
  /** The failed save was the one publishing needs (board C05 wording). */
  context?: "publish";
  onRetry: () => void;
  onKeepEditing: () => void;
}> = ({ where, leaving, busy, refusal, brandLocked = false, context, onRetry, onKeepEditing }) => {
  const col = useCanvasColumnRect(MIN_WIDTH + 2 * EDGE);
  /* One signal per condition: a session that expired or a server that cannot
     be reached already holds the banner slot, and this strip would only
     repeat it under different words (2L9 G04 / G12 draw no strip). */
  const banners = useGlobalBanners();
  if (!refusal && !leaving && banners.some((b) => b.id === BANNER_ID.sessionExpired || b.id === BANNER_ID.connection)) {
    return null;
  }

  return (
    <Portal>
      <div
        /* Under the dialogs' scrim (z-50): a modal over the canvas dims it. */
        className="tw:fixed tw:z-40 tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-error-tint)] tw:px-3 tw:py-1.5 tw:text-[var(--bk-error-text)] tw:[font-family:var(--bk-font-ui)]"
        style={col ? { left: col.left + EDGE, top: col.top + EDGE, width: col.width - 2 * EDGE } : FULL_PAGE_POSITION}
        role="alert"
        data-testid="save-failed-banner"
      >
        <AlertTriangle size={14} aria-hidden="true" className="tw:shrink-0" />
        <span className="tw:min-w-0 tw:text-[13px] tw:leading-5" data-testid="save-failed-message">
          {refusal
            ? brandLocked
              ? `Couldn't save ${where}. This site's brand was refused: ${refusal}. Your changes are kept in this browser — reload to keep editing.`
              : `Couldn't save ${where}. The brand change was refused: ${refusal}. Your changes are kept in this browser — undo the last brand change, then keep editing.`
            : leaving
              ? `Couldn't save ${where}. Your changes are kept. You have not left the editor.`
              : context === "publish"
                ? "Save before publishing. Your changes are kept."
                : `Couldn't save ${where}. Your changes are kept.`}
        </span>
        {refusal && !leaving ? null : (
          <Button
            color="light"
            size="xs"
            className={ACTION}
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={onRetry}
            data-testid="save-failed-retry"
          >
            {leaving ? "Retry save & leave" : "Retry"}
          </Button>
        )}
        {/* The board's strip has one action. Keep editing stays only where
            it means something the strip does not otherwise say: after a
            failed exit, and for a refusal that Retry cannot fix. */}
        {leaving || refusal ? (
          <Button
            color="light"
            size="xs"
            className="tw:h-8 tw:min-h-0 tw:shrink-0 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:text-current"
            onClick={onKeepEditing}
            data-testid="save-failed-keep"
          >
            Keep editing
          </Button>
        ) : null}
      </div>
    </Portal>
  );
};
