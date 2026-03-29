/**
 * PageSettingsDrawer — Shell for page settings.
 * Owns: header, tab switcher, save button state machine, unsaved warnings.
 * Does NOT own: form state (→ usePageSettings), field rendering (→ SeoTab etc.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { Composer } from "../../../../../engine";
import type { PageItem } from "../types";
import { AdvancedTab } from "./AdvancedTab";
import { SeoTab } from "./SeoTab";
import { SocialTab } from "./SocialTab";
import { usePageSettings } from "./usePageSettings";

interface Props {
  composer: Composer | null;
  page: PageItem;
  allPages: PageItem[];
  onClose: () => void;
}

const TAB_LABELS = [
  { id: "seo" as const, label: "SEO" },
  { id: "social" as const, label: "Social" },
  { id: "advanced" as const, label: "Advanced" },
];

export const PageSettingsDrawer: React.FC<Props> = ({ composer, page, allPages, onClose }) => {
  const s = usePageSettings(composer, page, allPages);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (s.isDirty) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const saveBtnLabel =
    s.saveState === "saving"
      ? "Saving..."
      : s.saveState === "error"
        ? "Retry"
        : s.isDirty
          ? "Save changes"
          : "Saved ✓";

  const saveBtnDisabled = (!s.isDirty && s.saveState !== "error") || s.saveState === "saving";

  // ⌘S / Ctrl+S keyboard shortcut
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!saveBtnDisabled) s.save();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [s, saveBtnDisabled]);

  // Auto-focus first field when drawer opens
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const first = drawerRef.current?.querySelector<HTMLElement>(
        "input, textarea, button:not(.pg-drawer__back):not(.pg-drawer__save)"
      );
      first?.focus();
    }, 230); // after 220ms slide-in animation
    return () => clearTimeout(timer);
  }, []); // runs once on mount

  return (
    <>
      <div
        ref={drawerRef}
        className="pg-drawer"
        role="dialog"
        aria-label={`${page.name} Settings`}
        aria-modal="true"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="pg-drawer__header">
          <button className="pg-drawer__back" onClick={handleBack} aria-label="Back to pages">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="pg-drawer__page-name" title={page.name}>
            {page.name}
          </span>
          <button
            className={`pg-drawer__save pg-drawer__save--${s.saveState}`}
            onClick={s.save}
            disabled={saveBtnDisabled}
            aria-label={saveBtnLabel}
          >
            {saveBtnLabel}
          </button>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div className="pg-drawer__tabs" role="tablist">
          {TAB_LABELS.map(({ id, label }) => (
            <button
              key={id}
              id={`pg-tab-${id}`}
              role="tab"
              aria-selected={s.activeTab === id}
              aria-controls={`pg-panel-${id}`}
              className={`pg-drawer__tab${s.activeTab === id ? " pg-drawer__tab--active" : ""}`}
              onClick={() => s.setActiveTab(id)}
            >
              {label}
              {s.isDirty && s.activeTab === id && (
                <span className="pg-drawer__tab-dot" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <div
          id={`pg-panel-${s.activeTab}`}
          className="pg-drawer__body aqb-scrollbar"
          role="tabpanel"
          aria-labelledby={`pg-tab-${s.activeTab}`}
        >
          {s.activeTab === "seo" && <SeoTab s={s} page={page} />}
          {s.activeTab === "social" && <SocialTab s={s} page={page} />}
          {s.activeTab === "advanced" && <AdvancedTab s={s} />}
        </div>
      </div>

      {/* ── Tab-switch unsaved warning ─────────────────────────────────── */}
      {s.showDiscardConfirm &&
        createPortal(
          <UnsavedDialog
            title="Unsaved changes"
            message={`Switch away from ${s.activeTab} without saving?`}
            onSaveAndProceed={async () => {
              await s.save();
              s.confirmTabChange();
            }}
            onDiscardAndProceed={s.confirmTabChange}
            onStay={s.cancelTabChange}
          />,
          document.body
        )}

      {/* ── Close/back unsaved warning ────────────────────────────────── */}
      {showCloseConfirm &&
        createPortal(
          <UnsavedDialog
            title="Unsaved changes"
            message={`You have unsaved changes to ${page.name} settings. Leave without saving?`}
            onSaveAndProceed={async () => {
              await s.save();
              setShowCloseConfirm(false);
              onClose();
            }}
            onDiscardAndProceed={() => {
              setShowCloseConfirm(false);
              onClose();
            }}
            onStay={() => setShowCloseConfirm(false)}
          />,
          document.body
        )}
    </>
  );
};

// ── Inline unsaved dialog (3 actions: Save & proceed, Discard & proceed, Stay) ──

interface UnsavedDialogProps {
  title: string;
  message: string;
  onSaveAndProceed: () => void;
  onDiscardAndProceed: () => void;
  onStay: () => void;
}

const UnsavedDialog: React.FC<UnsavedDialogProps> = ({
  title,
  message,
  onSaveAndProceed,
  onDiscardAndProceed,
  onStay,
}) => {
  const stayRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    stayRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div className="pg-unsaved-overlay" role="presentation" onClick={onStay}>
      <div
        className="pg-unsaved-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pg-unsaved-dialog__title">{title}</div>
        <div className="pg-unsaved-dialog__message">{message}</div>
        <div className="pg-unsaved-dialog__actions">
          <button ref={stayRef} className="pg-unsaved-btn pg-unsaved-btn--ghost" onClick={onStay}>
            Stay
          </button>
          <button className="pg-unsaved-btn pg-unsaved-btn--discard" onClick={onDiscardAndProceed}>
            Discard &amp; Leave
          </button>
          <button className="pg-unsaved-btn pg-unsaved-btn--save" onClick={onSaveAndProceed}>
            Save &amp; Leave
          </button>
        </div>
      </div>
    </div>
  );
};
