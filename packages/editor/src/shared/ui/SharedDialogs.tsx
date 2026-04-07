/**
 * SharedDialogs — 4 reusable dialog patterns for the editor
 * Matches the .pen design's shared dialog frame.
 * Styles: SharedDialogs.css (aqb-* dark theme tokens for editor-wide overlays)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ConfirmDialog } from "./Modal";
import "./SharedDialogs.css";

// ============================================
// Dialog accessibility hook
// ============================================

/** Focus trap + Escape key for modal dialogs */
function useDialogA11y(isOpen: boolean, onClose: () => void) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const el = dialogRef.current;
    const prev = document.activeElement as HTMLElement | null;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      prev?.focus();
    };
  }, [isOpen, onClose]);

  return dialogRef;
}

// ============================================
// 1. Unsaved Changes Dialog
// ============================================

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSaveAndSwitch: () => void;
  onDiscardAndSwitch: () => void;
  onStay: () => void;
  context?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onSaveAndSwitch,
  onDiscardAndSwitch,
  onStay,
  context = "Settings",
}) => {
  const dialogRef = useDialogA11y(isOpen, onStay);
  if (!isOpen) return null;

  return (
    <div className="sd-overlay" onClick={onStay}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Unsaved Changes" className="sd-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="sd-title">Unsaved Changes</h3>
        <p className="sd-body">
          You have unsaved changes in {context}. What would you like to do?
        </p>
        <div className="sd-actions">
          <button className="sd-btn sd-btn--secondary" onClick={onStay}>Stay</button>
          <button className="sd-btn sd-btn--danger" onClick={onDiscardAndSwitch}>Discard &amp; Switch</button>
          <button className="sd-btn sd-btn--primary" onClick={onSaveAndSwitch}>Save &amp; Switch</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 2. Delete Confirmation Dialog
// ============================================

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
  warningMessage?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  itemName = "this item",
  warningMessage,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onCancel}
    onConfirm={onConfirm}
    title="Delete Confirmation"
    message={warningMessage || `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
    confirmText="Delete"
    variant="danger"
  />
);

// ============================================
// 3. Revert Confirmation Dialog
// ============================================

export interface RevertConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  versionLabel?: string;
}

export const RevertConfirmDialog: React.FC<RevertConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  versionLabel = "this version",
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onCancel}
    onConfirm={onConfirm}
    title="Revert Confirmation"
    message={`Revert to ${versionLabel}? Your current version will be replaced.`}
    confirmText="Revert"
    variant="danger"
  />
);

// ============================================
// 4. Add Page Dialog
// ============================================

export interface AddPageDialogProps {
  isOpen: boolean;
  onConfirm: (name: string, slug: string) => void;
  onCancel: () => void;
}

export const AddPageDialog: React.FC<AddPageDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");

  React.useEffect(() => {
    if (isOpen) { setName(""); setSlug(""); }
  }, [isOpen]);

  const dialogRef = useDialogA11y(isOpen, onCancel);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim(), slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      setName("");
      setSlug("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sd-overlay" onClick={onCancel}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Add New Page" className="sd-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="sd-title">Add New Page</h3>
        <div className="sd-form">
          <div>
            <label className="sd-label">Page Name</label>
            <input
              className="sd-input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="About Us"
              autoFocus
            />
          </div>
          <div>
            <label className="sd-label">URL Slug</label>
            <input
              className="sd-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="about-us"
            />
          </div>
        </div>
        <div className="sd-actions">
          <button className="sd-btn sd-btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="sd-btn sd-btn--primary" onClick={handleSubmit} disabled={!name.trim()}>Create Page</button>
        </div>
      </div>
    </div>
  );
};
