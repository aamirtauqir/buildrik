/**
 * TemplatesTabModals — Replace confirm, Pro intercept, and the three
 * create-page outcome dialogs.
 *
 * All five compose `chrome-ui/Modal`, which brings the focus trap, Escape and
 * scrim dismissal these hand-rolled overlays never had. Each is mounted
 * conditionally by TemplatesTab, so `open` is always true — the prop exists
 * because Modal owns the mount/unmount transition, not the caller.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "./templatesData";
import { Button, Checkbox, Modal } from "@/editor/chrome-ui";

// ============================================================================
// Shared bits
// ============================================================================

/** Checkbox + two-line explanation, used twice by ReplaceModal. */
const OPTION_ROW = "tw:flex tw:items-start tw:gap-2 tw:mb-1.5 tw:text-[13px] tw:text-gray-500 tw:cursor-pointer";
const OPTION_TITLE = "tw:block tw:font-medium tw:text-gray-900";
const OPTION_HINT = "tw:block tw:mt-px tw:text-[11px]";

/** Circular hero glyph above a modal's copy (Pro upsell, create outcomes). */
const HERO = "tw:flex tw:items-center tw:justify-center tw:mx-auto tw:rounded-full";

interface OptionProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: React.ReactNode;
  hint: string;
}

function Option({ checked, onChange, title, hint }: OptionProps) {
  return (
    <label className={OPTION_ROW}>
      <Checkbox
        color="blue"
        className="tw:bg-white tw:mt-0.5 tw:size-3.5 tw:cursor-pointer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className={OPTION_TITLE}>{title}</span>
        <span className={OPTION_HINT}>{hint}</span>
      </span>
    </label>
  );
}

// ============================================================================
// Replace Modal — matches .pen Screen 7 "State/Confirm"
// ============================================================================

export interface ReplaceModalProps {
  template: TemplateItem;
  currentPageName?: string;
  currentPageCount: number;
  resetGlobalStyles: boolean;
  onResetChange: (v: boolean) => void;
  /** P2 fix (codex A4): backup current page as new page before replacing. */
  backupCurrentPage: boolean;
  onBackupChange: (v: boolean) => void;
  onCancel: () => void;
  onApply: () => void;
}

export const ReplaceModal: React.FC<ReplaceModalProps> = ({
  template,
  currentPageName,
  currentPageCount,
  resetGlobalStyles,
  onResetChange,
  backupCurrentPage,
  onBackupChange,
  onCancel,
  onApply,
}) => (
  /* Board 1169:4713 names the template in the question and the page in the
     answer — "Replace this page with 'Bistro Landing'?" / "Everything on Home
     will be replaced". The old title named neither, so the one irreversible
     word in the dialog ("Replace") had nothing attached to it. */
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title={`Replace this page with ‘${template.name}’?`}
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onApply}>Replace page</Button>
      </>
    }
  >
    <div className="tw:mb-3">
      Everything on {currentPageName || "this page"} will be replaced by the template
      {currentPageCount > 0
        ? ` (${currentPageCount} element${currentPageCount === 1 ? "" : "s"})`
        : ""}
      . Your brand tokens are applied automatically.
    </div>
    <Option
      checked={backupCurrentPage}
      onChange={onBackupChange}
      title="Save the current page as a backup version first"
      hint={`Keeps your work as “${currentPageName || "Current"} (backup)”.`}
    />
    {/* Not on the board, kept because it does something the board's sentence
        does not cover: brand tokens resolve automatically either way, while
        this clears the project's global styles outright. */}
    <Option
      checked={resetGlobalStyles}
      onChange={onResetChange}
      title="Reset global styles to template defaults"
      hint="Overrides your brand colours with the template's."
    />
  </Modal>
);

// ============================================================================
// Pro Intercept Modal
// ============================================================================

export interface ProModalProps {
  templateName: string;
  onCancel: () => void;
  onUpgrade: () => void;
}

const PRO_FEATURES: readonly string[] = [
  "80+ premium templates",
  "Custom domain",
  "Stock library access",
  "AI alt-text generation",
  "Priority support",
];

export const ProModal: React.FC<ProModalProps> = ({ templateName, onCancel, onUpgrade }) => (
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title={`“${templateName}” is a Pro template`}
    subtitle="Unlock 80+ premium templates with conversion-tested layouts."
    footer={
      <>
        <Button color="light" className="tw:flex-1" onClick={onCancel}>
          Maybe later
        </Button>
        <Button className="tw:flex-1" onClick={onUpgrade}>
          Upgrade to Pro
        </Button>
      </>
    }
  >
    <div
      /* @lint-hex-policy: warm illustrative gradient for the Pro upsell hero */
      className={`${HERO} tw:size-14 tw:mt-1 tw:mb-4 tw:[background-image:linear-gradient(135deg,#fff7ed,#fed7aa)]`}
      aria-hidden="true"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bk-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 5L18 22l-6-4-6 4 1.5-8L2 9h7z" />
      </svg>
    </div>
    <div className="tw:p-4 tw:rounded-md tw:bg-[var(--bk-bg-subtle)]">
      <div className="tw:mb-2 tw:text-xs tw:font-semibold tw:text-gray-900">Pro includes</div>
      <div className="tw:flex tw:flex-col tw:gap-1 tw:text-xs">
        {PRO_FEATURES.map((feat) => (
          <div key={feat}>✓ {feat}</div>
        ))}
      </div>
    </div>
  </Modal>
);

// ============================================================================
// Create Page Confirm Modal (fiLNZ)
// ============================================================================

export interface CreatePageConfirmModalProps {
  templateName: string;
  /** The name the new page will get — the board states it before you agree. */
  newPageName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CreatePageConfirmModal: React.FC<CreatePageConfirmModalProps> = ({
  templateName,
  newPageName,
  onCancel,
  onConfirm,
}) => (
  /* Board 1169:4725 — the question names the template, the answer names the
     page and where it lands. "Create page?" over "Using: X" named neither. */
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title={`Create a page from ‘${templateName}’?`}
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Create page</Button>
      </>
    }
  >
    <p className="tw:m-0">
      A new page ‘{newPageName}’ will be added after your current pages.
    </p>
  </Modal>
);

// ============================================================================
// Create Page Success Modal (uMJFZ)
// ============================================================================

export interface CreatePageSuccessModalProps {
  /** The page that now exists, and that the editor is already showing. */
  pageName: string;
  onClose: () => void;
  onOpenPageSettings: () => void;
}

export const CreatePageSuccessModal: React.FC<CreatePageSuccessModalProps> = ({
  pageName,
  onClose,
  onOpenPageSettings,
}) => (
  /* Board 1169:4725: "Page created" with a green tick, "‘Menu 2’ is ready —
     you're on it now", and the two things left to do. "Go to page" was the
     old copy from when the apply did NOT switch pages. */
  <Modal
    open
    onClose={onClose}
    dismissOnScrimClick
    title="Page created"
    footer={
      <>
        <Button color="light" onClick={onOpenPageSettings}>
          Open page settings
        </Button>
        <Button onClick={onClose}>Done</Button>
      </>
    }
  >
    <p className="tw:m-0 tw:flex tw:items-center tw:gap-2">
      <span className="tw:text-[var(--bk-success)]" aria-hidden="true">✓</span>
      ‘{pageName}’ is ready — you&rsquo;re on it now.
    </p>
  </Modal>
);

// ============================================================================
// Create Page Error Modal (9NalZ)
// ============================================================================

export interface CreatePageErrorModalProps {
  /** What actually went wrong, when the apply path knows. */
  reason?: string;
  onCancel: () => void;
  onRetry: () => void;
}

export const CreatePageErrorModal: React.FC<CreatePageErrorModalProps> = ({
  reason,
  onCancel,
  onRetry,
}) => (
  /* Board 1169:4725 — the failure in red, then the reassurance that matters
     most: nothing of theirs changed. */
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title="Couldn't create the page"
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onRetry}>Try again</Button>
      </>
    }
  >
    <p className="tw:m-0">
      {reason ?? "The template failed to load."} Your pages are unchanged.
    </p>
  </Modal>
);
