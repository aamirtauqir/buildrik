/**
 * UnsavedWarningModal — board 1171:4820.
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
  onOpenAutoFocus?: (e: { preventDefault: () => void }) => void;
  "data-testid"?: string;
  children: React.ReactNode;
};
const ModalContent =
  BaseModalContent as unknown as React.ComponentType<ModalContentEscapeProps>;

interface Props {
  isOpen: boolean;
  /** The tab being left — names the edits at risk in the title. */
  pendingTab: string;
  onDiscard: () => void;
  onCancel: () => void;
}

/** What each tab's unsaved edits actually are, for the body line. */
const TAB_COPY: Record<string, { label: string; fields: string }> = {
  seo: { label: "SEO", fields: "the page title and description" },
  social: { label: "Social", fields: "the social title, description and image" },
  advanced: { label: "Advanced", fields: "the page's advanced settings" },
};

const BTN = "tw:min-h-0 tw:rounded-md tw:px-3 tw:py-[7px] tw:text-[11px] tw:font-medium";

export const UnsavedWarningModal: React.FC<Props> = ({
  isOpen,
  pendingTab,
  onDiscard,
  onCancel,
}) => {
  const keepRef = React.useRef<HTMLButtonElement>(null);
  const copy = TAB_COPY[pendingTab] ?? TAB_COPY.seo;

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onCancel()}>
      <ModalContent
        /* 440, not 720 — board 1171:4820 is a 440x117 frame and this dialog
           carries a title, one sentence and two buttons. `size="lg"` gave it
           720, so a two-line confirm was wider than the Brand review modal
           that lists every staged token change. */
        size="question"
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
          <div className="tw:flex tw:flex-col tw:gap-2.5">
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
              <span data-testid="pages-unsaved-title" className="tw:text-[13px] tw:leading-[normal]">
                Discard unsaved {copy.label} changes?
              </span>
            </ModalTitle>

            {/* `leading-[normal]` — 1171:4822. */}
            <p data-testid="pages-unsaved-body" className="tw:m-0 tw:text-[11px] tw:leading-[normal] tw:text-[var(--bk-ink-soft)]">
              You edited {copy.fields} but didn&apos;t save. Leaving this tab throws those edits
              away.
            </p>

            <div className="tw:flex tw:justify-end tw:gap-2" data-testid="pages-unsaved-foot">
              <Button
                ref={keepRef}
                className={`${BTN} tw:border-0 tw:bg-[var(--bk-accent)] tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-accent-hover)]`}
                onClick={onCancel}
                data-testid="pages-unsaved-keep"
                aria-label="Keep editing and stay on this tab"
              >
                Keep editing
              </Button>
              <Button
                className={`${BTN} tw:border tw:border-[var(--bk-error)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-error-text,var(--bk-error))] tw:enabled:hover:bg-[var(--bk-error-tint)]`}
                onClick={onDiscard}
                data-testid="pages-unsaved-discard"
                aria-label="Discard the unsaved changes and switch tab"
              >
                Discard changes
              </Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};
