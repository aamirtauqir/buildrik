/**
 * TemplatesTabModals — Replace confirm + Pro intercept modals
 * Restyled to match .pen Screen 7 design (light theme).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { TemplateItem } from "./templatesData";

// ============================================================================
// Replace Modal — matches .pen Screen 7 "State/Confirm"
// ============================================================================

export interface ReplaceModalProps {
  template: TemplateItem;
  currentPageCount: number;
  resetGlobalStyles: boolean;
  onResetChange: (v: boolean) => void;
  onCancel: () => void;
  onApply: () => void;
}

export const ReplaceModal: React.FC<ReplaceModalProps> = ({
  template,
  resetGlobalStyles,
  onResetChange,
  onCancel,
  onApply,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="tpl-modal-title">Apply Template?</h3>
        <div className="tpl-modal-warning">
          <p className="tpl-modal-warning-text">
            This will replace your current page content with <strong>{template.name}</strong>. This action cannot be undone.
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--bd-fg-muted, #475569)", cursor: "pointer", margin: "0 0 4px" }}>
          <input
            type="checkbox"
            checked={resetGlobalStyles}
            onChange={(e) => onResetChange(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }}
          />
          Also reset global styles
        </label>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onApply}>
            Replace
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Pro Intercept Modal
// ============================================================================

export interface ProModalProps {
  templateName: string;
  onCancel: () => void;
  onUpgrade: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ templateName, onCancel, onUpgrade }) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="tpl-modal-title">Pro Template</h3>
        <p style={{ fontSize: 13, color: "var(--bd-fg-muted, var(--bd-fg-secondary))", lineHeight: 1.5, margin: "0 0 16px" }}>
          <strong>{templateName}</strong> is available on the Pro plan. Upgrade to unlock 40+ premium templates.
        </p>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onUpgrade}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Create Page Confirm Modal (fiLNZ) — 420px wide
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
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        <h3 className="tpl-modal-title">Create page?</h3>
        <div className="tpl-modal-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-muted, var(--bd-fg-secondary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span className="tpl-modal-row-text">Using: {templateName}</span>
        </div>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onConfirm}>Create page</button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Create Page Success Modal (uMJFZ) — 420px wide
// ============================================================================

export interface CreatePageSuccessModalProps {
  onClose: () => void;
  onGoToPage: () => void;
}

export const CreatePageSuccessModal: React.FC<CreatePageSuccessModalProps> = ({
  onClose,
  onGoToPage,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onClose}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        <div className="tpl-modal-icon tpl-modal-icon--success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--bd-success, #166534)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="tpl-modal-title tpl-modal-title--lg">Page created!</h3>
        <p className="tpl-modal-desc">Your new page has been created from the template and is ready to edit.</p>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onClose}>Close</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onGoToPage}>Go to page</button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Create Page Error Modal (9NalZ) — 420px wide
// ============================================================================

export interface CreatePageErrorModalProps {
  onCancel: () => void;
  onRetry: () => void;
}

export const CreatePageErrorModal: React.FC<CreatePageErrorModalProps> = ({
  onCancel,
  onRetry,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        <div className="tpl-modal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--bd-error, var(--bd-error))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h3 className="tpl-modal-title tpl-modal-title--lg">Couldn&apos;t create page</h3>
        <div className="tpl-modal-warning" style={{ background: "var(--bd-error-bg, #FEE2E2)", borderColor: "transparent" }}>
          <p className="tpl-modal-warning-text" style={{ color: "var(--bd-fg-muted, #475569)" }}>
            Something went wrong creating your page. Your existing pages were not affected.
          </p>
        </div>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onRetry}>Try again</button>
        </div>
      </div>
    </div>,
    document.body
  );
