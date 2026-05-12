import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";
import { Button } from "@/editor/shared/vibcoder/Button";
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
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, background: "var(--bd-warn-soft, #FEF3C7)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bd-warn, #B45309)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v2m0 4h.01M5 21h14a2 2 0 0 0 1.84-2.75L13.74 4a2 2 0 0 0-3.48 0L3.16 18.25A2 2 0 0 0 5 21z"/>
            </svg>
          </div>
          <div>
            <h3 className="tpl-modal-title" style={{ margin: 0 }}>Replace current page content?</h3>
            <div style={{ fontSize: 12, color: "var(--bd-fg-muted)", marginTop: 2 }}>
              {currentPageName ? `${currentPageName} page` : "Current page"} has {currentPageCount} element{currentPageCount === 1 ? "" : "s"} that will be replaced.
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--bd-fg-secondary)", marginBottom: 12 }}>
          Applying <b style={{ color: "var(--bd-fg)" }}>{template.name}</b> will replace all elements on the current page. You can:
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--bd-fg-muted, #475569)", cursor: "pointer", margin: "0 0 6px" }}>
          <Checkbox
            checked={backupCurrentPage}
            onChange={(e) => onBackupChange(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer", marginTop: 2 }} />
          <span>
            <span style={{ display: "block", fontWeight: 500, color: "var(--bd-fg)" }}>
              Backup current page as &ldquo;{currentPageName || "Current"} (backup)&rdquo;
            </span>
            <span style={{ display: "block", fontSize: 11, marginTop: 1 }}>Preserves your work in a new page.</span>
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--bd-fg-muted, #475569)", cursor: "pointer", margin: "0 0 4px" }}>
          <Checkbox
            checked={resetGlobalStyles}
            onChange={(e) => onResetChange(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer", marginTop: 2 }} />
          <span>
            <span style={{ display: "block", fontWeight: 500, color: "var(--bd-fg)" }}>Reset global styles to template defaults</span>
            <span style={{ display: "block", fontSize: 11, marginTop: 1 }}>Override your brand colors with template colors.</span>
          </span>
        </label>
        <div className="tpl-modal-btns">
          <Button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onApply}>
            Replace content
          </Button>
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
          <Button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onUpgrade}>
            Upgrade to Pro
          </Button>
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
          <Button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</Button>
          <Button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onConfirm}>Create page</Button>
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
          <Button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onClose}>Close</Button>
          <Button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onGoToPage}>Go to page</Button>
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
          <Button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</Button>
          <Button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onRetry}>Try again</Button>
        </div>
      </div>
    </div>,
    document.body
  );
