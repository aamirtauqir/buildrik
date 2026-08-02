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
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title="Replace current page content?"
    subtitle={`${currentPageName ? `${currentPageName} page` : "Current page"} has ${currentPageCount} element${
      currentPageCount === 1 ? "" : "s"
    } that will be replaced.`}
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onApply}>Replace content</Button>
      </>
    }
  >
    <div className="tw:mb-3">
      Applying <b className="tw:text-gray-900">{template.name}</b> will replace all elements on the current
      page. You can:
    </div>
    <Option
      checked={backupCurrentPage}
      onChange={onBackupChange}
      title={<>Backup current page as &ldquo;{currentPageName || "Current"} (backup)&rdquo;</>}
      hint="Preserves your work in a new page."
    />
    <Option
      checked={resetGlobalStyles}
      onChange={onResetChange}
      title="Reset global styles to template defaults"
      hint="Override your brand colors with template colors."
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
  onCancel: () => void;
  onConfirm: () => void;
}

export const CreatePageConfirmModal: React.FC<CreatePageConfirmModalProps> = ({
  templateName,
  onCancel,
  onConfirm,
}) => (
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title="Create page?"
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Create page</Button>
      </>
    }
  >
    <div className="tw:flex tw:items-center tw:gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <span>Using: {templateName}</span>
    </div>
  </Modal>
);

// ============================================================================
// Create Page Success Modal (uMJFZ)
// ============================================================================

export interface CreatePageSuccessModalProps {
  onClose: () => void;
  onGoToPage: () => void;
}

export const CreatePageSuccessModal: React.FC<CreatePageSuccessModalProps> = ({
  onClose,
  onGoToPage,
}) => (
  <Modal
    open
    onClose={onClose}
    dismissOnScrimClick
    title="Page created!"
    footer={
      <>
        <Button color="light" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onGoToPage}>Go to page</Button>
      </>
    }
  >
    <div className={`${HERO} tw:size-12 tw:mb-3 tw:bg-[var(--bk-success-tint)]`} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bk-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </div>
    <p className="tw:text-center">
      Your new page has been created from the template and is ready to edit.
    </p>
  </Modal>
);

// ============================================================================
// Create Page Error Modal (9NalZ)
// ============================================================================

export interface CreatePageErrorModalProps {
  onCancel: () => void;
  onRetry: () => void;
}

export const CreatePageErrorModal: React.FC<CreatePageErrorModalProps> = ({
  onCancel,
  onRetry,
}) => (
  <Modal
    open
    onClose={onCancel}
    dismissOnScrimClick
    title="Couldn't create page"
    footer={
      <>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onRetry}>Try again</Button>
      </>
    }
  >
    <div className={`${HERO} tw:size-12 tw:mb-3 tw:bg-[var(--bk-error-tint)]`} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bk-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </div>
    <p className="tw:p-3 tw:rounded-md tw:bg-[var(--bk-error-tint)] tw:text-gray-500">
      Something went wrong creating your page. Your existing pages were not affected.
    </p>
  </Modal>
);
