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

export const SaveFailedBanner: React.FC<{
  /** "<site> · <page>". */
  where: string;
  /** Set when the failed save was the exit's — the retry then leaves. */
  leaving: boolean;
  busy: boolean;
  onRetry: () => void;
  onKeepEditing: () => void;
}> = ({ where, leaving, busy, onRetry, onKeepEditing }) => {
  const [col, setCol] = React.useState<DOMRect | null>(null);
  React.useLayoutEffect(() => {
    const el = document.querySelector("[data-bk-toast-anchor]");
    const update = () => setCol(el?.getBoundingClientRect() ?? null);
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
        style={col ? { left: col.left + 8, top: col.top + 8, width: col.width - 16 } : { left: 68, top: 100, right: 336 }}
        role="alert"
        data-testid="save-failed-banner"
      >
        <span className="tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">Couldn&apos;t save {where}</span>
        <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
          Your changes are still here. Check your connection, then retry saving. You have not left the editor.
        </span>
        <span className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
          <Button size="xs" className="tw:h-7" disabled={busy} aria-busy={busy || undefined} onClick={onRetry} data-testid="save-failed-retry">
            {leaving ? "Retry save & leave" : "Retry save"}
          </Button>
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
