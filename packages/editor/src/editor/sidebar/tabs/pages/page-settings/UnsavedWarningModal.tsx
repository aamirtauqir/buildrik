/**
 * UnsavedWarningModal — design-2l9 board 63:18758 (B3-P10): "Leave without
 * saving?", the page named, Keep editing · Discard changes · Save and leave.
 * (Was board 1171:4820's two-button "Discard unsaved changes?". The drawer no
 * longer autosaves — decision #20, Cancel · Save — so "save now" is a real
 * choice again and the board's third button is back.)
 *
 * Earlier notes, kept for the reasoning on the safe default:
 *
 * The board names what is at stake instead of asking a generic question:
 * "Discard unsaved SEO changes?" over one line saying which fields were edited
 * and what leaving costs. Two actions, not three — **Keep editing** (accent,
 * the safe default) and **Discard changes** (error outline).
 *
 * "Save & Switch" is gone with the third button: the drawer autosaves 500ms
 * after any change (PageSettingsDrawer), so by the time this modal can appear
 * the only unsaved state left is a save that FAILED or one still inside that
 * window — neither is something a "save now" button can promise. The two
 * remaining choices are the two real ones.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent as BaseModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

// Radix Dialog.Content props (onOpenAutoFocus) are hidden from the public
// ModalContentProps per Contract E2; ModalContent still spreads them at
// runtime. The cast bypasses the narrowed type without changing behavior.
type ModalContentEscapeProps = {
  size?: "question" | "lg" | "xl";
  className?: string;
  onOpenAutoFocus?: (e: { preventDefault: () => void }) => void;
  "data-testid"?: string;
  children: React.ReactNode;
};
const ModalContent =
  BaseModalContent as unknown as React.ComponentType<ModalContentEscapeProps>;

/** Which state of the return the guard is in (boards 63:18758, 101:23017,
 *  101:23620, 109:32246) — each read off the real save, never staged:
 *  - ask: dirty form, valid URL — Keep editing · Discard changes · Save and leave
 *  - invalid-url: the URL the save would write is invalid — "Fix page URL"
 *    replaces Save and leave (the save would refuse it)
 *  - saving: Save and leave pressed, the save in flight — Cancel navigation
 *    (the save carries on; only the leaving stops) · Saving…
 *  - rejected: that save failed — Keep editing · Discard changes · Retry save and leave */
export type LeaveGuardMode = "ask" | "invalid-url" | "saving" | "rejected";

interface Props {
  isOpen: boolean;
  mode?: LeaveGuardMode;
  onDiscard: () => void;
  onCancel: () => void;
  /** The page whose settings are unsaved. */
  pageName: string;
  /** The page open on the canvas, when it is another one. */
  stays?: string | null;
  /** invalid-url only: whether the URL is empty (the board's wording) or otherwise invalid. */
  emptyUrl?: boolean;
  onSaveAndLeave: () => void;
  /** invalid-url: back to the form with the URL field to fix. */
  onFixUrl?: () => void;
}

const BTN = "tw:h-8 tw:min-h-0 tw:rounded-md tw:px-3.5 tw:text-[13px] tw:font-medium";

const PRIMARY = `${BTN} tw:border-0 tw:bg-[var(--bk-accent)] tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-accent-hover)]`;
const SECONDARY = `${BTN} tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]`;
const NOTE = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export const UnsavedWarningModal: React.FC<Props> = ({
  isOpen,
  mode = "ask",
  onDiscard,
  onCancel,
  pageName,
  stays,
  emptyUrl,
  onSaveAndLeave,
  onFixUrl,
}) => {
  const keepRef = React.useRef<HTMLButtonElement>(null);
  const title =
    mode === "saving"
      ? `Saving ${pageName} settings…`
      : mode === "rejected"
        ? `Couldn’t save ${pageName} settings`
        : "Leave without saving?";
  const body =
    mode === "saving"
      ? `After saving, return to Pages.${stays ? ` ${stays} will stay open.` : ""}`
      : mode === "rejected"
        ? `Your draft is still here. Nothing was applied. After a successful save, return to Pages${stays ? `; ${stays} stays open.` : "."}`
        : mode === "invalid-url"
          ? `${pageName} has unsaved page settings and ${emptyUrl ? "an empty" : "an invalid"} page URL. Closing returns to Pages${stays ? `; ${stays} stays open.` : "."}`
          : `You have unsaved page settings for ${pageName}. Save or discard them to return to Pages, or keep editing.${stays ? ` ${stays} stays open.` : ""}`;
  const note =
    mode === "saving"
      ? "Your settings are still being saved. Cancelling navigation keeps you in this task; it does not undo the save."
      : mode === "rejected"
        ? "The server rejected this save. Try again, keep editing, or discard only these staged settings."
        : mode === "invalid-url"
          ? "Saving requires a valid page URL. Your draft stays available while you fix it."
          : null;

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onCancel()}>
      <ModalContent
        /* 440, not 720 — board 1171:4820 is a 440x117 frame and this dialog
           carries a title, one sentence and two buttons. `size="lg"` gave it
           720, so a two-line confirm was wider than the Brand review modal
           that lists every staged token change. */
        size="question"
        /* design-2l9 63:18758: a 480-wide card. Important: the size class
           is a plain join, not a merge. */
        className="tw:!w-[480px]"
        data-testid="pages-unsaved-modal"
        onOpenAutoFocus={(e) => {
          // Focus the SAFE action — the destructive one should never be one
          // stray Enter away.
          if (keepRef.current) {
            e.preventDefault();
            keepRef.current.focus();
          }
        }}
      >
        <ModalBody>
          <div className="tw:flex tw:flex-col tw:gap-3 tw:px-2 tw:pt-4 tw:pb-2">
            {/* `inset={false}`: this title already sits inside ModalBody's own
                16px inset, and ModalTitle's default adds pl-5/pr-12/pt-4 — the
                exact double-inset its `inset` prop exists to prevent. */}
            <ModalTitle inset={false} className="tw:m-0 tw:font-semibold tw:text-[var(--bk-ink)]">
              {/* The 13px lives on a SPAN. `MODAL_TITLE_CLASS` is
                  `text-[length:var(--bk-text-14)]` and a caller `className`
                  font-size is a second arbitrary utility on a plain <h2> —
                  two classes, one property, resolved by stylesheet order. The
                  `tw:text-[13px]` this file passed never applied and the
                  heading measured 14. Same defect found on ReviewModal today. */}
              <span data-testid="pages-unsaved-title" className="tw:text-[length:var(--bk-text-16)] tw:leading-[normal]">
                {title}
              </span>
            </ModalTitle>

            {/* `leading-[normal]` — 1171:4822. */}
            <p data-testid="pages-unsaved-body" className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
              {body}
            </p>
            {note && (
              <p className={NOTE} data-testid="pages-unsaved-note">
                {note}
              </p>
            )}

            <div className="tw:flex tw:justify-start tw:gap-2" data-testid="pages-unsaved-foot">
              {mode === "saving" ? (
                <>
                  <Button ref={keepRef} className={SECONDARY} onClick={onCancel} data-testid="pages-unsaved-cancel-nav">
                    Cancel navigation
                  </Button>
                  <Button className={SECONDARY} disabled aria-busy="true" data-testid="pages-unsaved-saving">
                    Saving…
                  </Button>
                </>
              ) : (
                <>
                  <Button ref={keepRef} className={PRIMARY} onClick={onCancel} data-testid="pages-unsaved-keep" aria-label="Keep editing">
                    Keep editing
                  </Button>
                  <Button
                    className={SECONDARY}
                    onClick={onDiscard}
                    data-testid="pages-unsaved-discard"
                    aria-label="Discard the unsaved changes and close"
                  >
                    Discard changes
                  </Button>
                  {mode === "invalid-url" ? (
                    <Button className={SECONDARY} onClick={onFixUrl} data-testid="pages-unsaved-fix-url">
                      Fix page URL
                    </Button>
                  ) : (
                    <Button className={SECONDARY} onClick={onSaveAndLeave} data-testid="pages-unsaved-save">
                      {mode === "rejected" ? "Retry save and leave" : "Save and leave"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};
