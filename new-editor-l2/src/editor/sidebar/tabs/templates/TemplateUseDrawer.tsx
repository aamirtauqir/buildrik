/**
 * TemplateUseDrawer - Slide-in drawer for template application
 * Replaces TemplateApplyModal with unified mode/target selection
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "./templatesData";

// ============================================
// Types
// ============================================

export type TemplateMode = "create-page" | "insert-page";
export type CreatePageTarget = "new-page" | "replace-current" | "new-site";
export type InsertPageTarget = "current-page" | "new-page";

export interface TemplateApplyConfig {
  mode: TemplateMode;
  target: CreatePageTarget | InsertPageTarget;
  createBackup: boolean;
  replaceContent: boolean;
}

export interface TemplateUseDrawerProps {
  isOpen: boolean;
  template: TemplateItem | null;
  onClose: () => void;
  onApply: (config: TemplateApplyConfig) => void;
}

// ============================================
// Constants
// ============================================

const MODE_OPTIONS = [
  {
    id: "create-page" as TemplateMode,
    label: "Create as Page",
    description: "Start fresh with this template",
    recommended: true,
  },
  {
    id: "insert-page" as TemplateMode,
    label: "Insert into Page",
    description: "Add template content to existing page",
    recommended: false,
  },
];

interface TargetOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
  isDanger?: boolean;
  requiresConfirm?: boolean;
}

const CREATE_PAGE_TARGETS: TargetOption[] = [
  {
    id: "new-page",
    label: "New Page",
    description: "Creates a new page with this template",
    recommended: true,
  },
  {
    id: "replace-current",
    label: "Replace Current Page",
    description: "Replaces your current page content",
    isDanger: true,
  },
  {
    id: "new-site",
    label: "New Site",
    description: "Start a fresh site with this template",
    requiresConfirm: true,
  },
];

const INSERT_PAGE_TARGETS: TargetOption[] = [
  {
    id: "current-page",
    label: "Current Page",
    description: "Insert at the end of current page",
    recommended: true,
  },
  {
    id: "new-page",
    label: "New Page",
    description: "Create new page and insert there",
  },
];

// ============================================
// Component
// ============================================

export const TemplateUseDrawer: React.FC<TemplateUseDrawerProps> = ({
  isOpen,
  template,
  onClose,
  onApply,
}) => {
  // State
  const [mode, setMode] = React.useState<TemplateMode>("create-page");
  const [createTarget, setCreateTarget] = React.useState<CreatePageTarget>("new-page");
  const [insertTarget, setInsertTarget] = React.useState<InsertPageTarget>("current-page");
  const [createBackup, setCreateBackup] = React.useState(true);
  const [replaceContent, setReplaceContent] = React.useState(false);
  const [showNewSiteConfirm, setShowNewSiteConfirm] = React.useState(false);

  // Reset state when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setMode("create-page");
      setCreateTarget("new-page");
      setInsertTarget("current-page");
      setCreateBackup(true);
      setReplaceContent(false);
      setShowNewSiteConfirm(false);
    }
  }, [isOpen]);

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Dynamic CTA text
  const getCTAText = (): string => {
    if (mode === "create-page") {
      switch (createTarget) {
        case "new-page":
          return "Create New Page";
        case "replace-current":
          return "Replace Current Page";
        case "new-site":
          return "Create New Site";
      }
    }
    return insertTarget === "current-page" ? "Insert into Current Page" : "Insert into New Page";
  };

  // Handle apply
  const handleApply = () => {
    const target = mode === "create-page" ? createTarget : insertTarget;

    // Check for new-site confirmation
    if (mode === "create-page" && createTarget === "new-site" && !showNewSiteConfirm) {
      setShowNewSiteConfirm(true);
      return;
    }

    onApply({
      mode,
      target,
      createBackup,
      replaceContent,
    });
  };

  // Check if backup toggle should show
  const showBackupToggle =
    (mode === "create-page" && createTarget === "replace-current") ||
    (mode === "insert-page" && replaceContent);

  // Current target options
  const targetOptions = mode === "create-page" ? CREATE_PAGE_TARGETS : INSERT_PAGE_TARGETS;
  const currentTarget = mode === "create-page" ? createTarget : insertTarget;
  const setTarget =
    mode === "create-page"
      ? (t: string) => setCreateTarget(t as CreatePageTarget)
      : (t: string) => setInsertTarget(t as InsertPageTarget);

  if (!template) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`aqb-drawer-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`aqb-use-template-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="aqb-drawer-header">
          <div className="aqb-drawer-header-content">
            <h2 id="drawer-title" className="aqb-drawer-title">
              Use Template
            </h2>
            <p className="aqb-drawer-subtitle">{template.name}</p>
          </div>
          <button className="aqb-drawer-close" onClick={onClose} aria-label="Close drawer">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="aqb-drawer-body">
          {/* New Site Confirmation */}
          {showNewSiteConfirm ? (
            <div className="aqb-confirm-warning">
              <div className="aqb-confirm-icon">
                <WarningIcon />
              </div>
              <h3 className="aqb-confirm-title">Create New Site?</h3>
              <p className="aqb-confirm-text">
                This will clear all existing pages and create a fresh site with this template. This
                action cannot be undone.
              </p>
              <div className="aqb-confirm-actions">
                <button className="aqb-btn-secondary" onClick={() => setShowNewSiteConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="aqb-btn-danger"
                  onClick={() => {
                    onApply({
                      mode: "create-page",
                      target: "new-site",
                      createBackup: false,
                      replaceContent: false,
                    });
                  }}
                >
                  Yes, Create New Site
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div className="aqb-drawer-section">
                <label className="aqb-drawer-label">Mode</label>
                <div className="aqb-radio-group">
                  {MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`aqb-radio-option ${mode === opt.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={opt.id}
                        checked={mode === opt.id}
                        onChange={() => setMode(opt.id)}
                      />
                      <span className="aqb-radio-indicator" />
                      <div className="aqb-radio-content">
                        <span className="aqb-radio-label">
                          {opt.label}
                          {opt.recommended && (
                            <span className="aqb-badge-recommended">Recommended</span>
                          )}
                        </span>
                        <span className="aqb-radio-desc">{opt.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Selection */}
              <div className="aqb-drawer-section">
                <label className="aqb-drawer-label">Target</label>
                <div className="aqb-radio-group">
                  {targetOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`aqb-radio-option ${currentTarget === opt.id ? "selected" : ""} ${opt.isDanger ? "danger" : ""}`}
                    >
                      <input
                        type="radio"
                        name="target"
                        value={opt.id}
                        checked={currentTarget === opt.id}
                        onChange={() => setTarget(opt.id)}
                      />
                      <span className="aqb-radio-indicator" />
                      <div className="aqb-radio-content">
                        <span className="aqb-radio-label">
                          {opt.label}
                          {opt.recommended && (
                            <span className="aqb-badge-recommended">Recommended</span>
                          )}
                          {opt.isDanger && <span className="aqb-badge-danger">Destructive</span>}
                        </span>
                        <span className="aqb-radio-desc">{opt.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="aqb-drawer-section">
                <label className="aqb-drawer-label">Options</label>
                <div className="aqb-toggle-group">
                  {/* Replace Content (Insert mode only) */}
                  {mode === "insert-page" && (
                    <label className="aqb-toggle-option">
                      <div className="aqb-toggle-content">
                        <span className="aqb-toggle-label">Replace existing content</span>
                        <span className="aqb-toggle-desc">
                          Clear page before inserting template
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={replaceContent}
                        className={`aqb-toggle-switch ${replaceContent ? "on" : ""}`}
                        onClick={() => setReplaceContent(!replaceContent)}
                      >
                        <span className="aqb-toggle-thumb" />
                      </button>
                    </label>
                  )}

                  {/* Create Backup */}
                  {showBackupToggle && (
                    <label className="aqb-toggle-option">
                      <div className="aqb-toggle-content">
                        <span className="aqb-toggle-label">Create backup copy</span>
                        <span className="aqb-toggle-desc">Save current page before replacing</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={createBackup}
                        className={`aqb-toggle-switch ${createBackup ? "on" : ""}`}
                        onClick={() => setCreateBackup(!createBackup)}
                      >
                        <span className="aqb-toggle-thumb" />
                      </button>
                    </label>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!showNewSiteConfirm && (
          <div className="aqb-drawer-footer">
            <button className="aqb-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="aqb-btn-primary" onClick={handleApply}>
              {getCTAText()}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ============================================
// Icons
// ============================================

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarningIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
  </svg>
);

export default TemplateUseDrawer;
