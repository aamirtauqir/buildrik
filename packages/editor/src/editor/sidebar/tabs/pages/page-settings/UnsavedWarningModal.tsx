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
  size?: "lg" | "xl";
  onOpenAutoFocus?: (e: { preventDefault: () => void }) => void;
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
        size="lg"
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
            <ModalTitle className="tw:m-0 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">
              Discard unsaved {copy.label} changes?
            </ModalTitle>

            <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
              You edited {copy.fields} but didn&apos;t save. Leaving this tab throws those edits
              away.
            </p>

            <div className="tw:flex tw:justify-end tw:gap-2">
              <Button
                ref={keepRef}
                className={`${BTN} tw:border-0 tw:bg-[var(--bk-accent)] tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-accent-hover)]`}
                onClick={onCancel}
                aria-label="Keep editing and stay on this tab"
              >
                Keep editing
              </Button>
              <Button
                className={`${BTN} tw:border tw:border-[var(--bk-error)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-error-text,var(--bk-error))] tw:enabled:hover:bg-[var(--bk-error-tint)]`}
                onClick={onDiscard}
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
