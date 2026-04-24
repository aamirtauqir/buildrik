/**
 * Aquibra Modal Component
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";
import { useFocusTrap } from "../hooks/useFocusTrap";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

// Sizes aligned to prototype comp-modals.html — sm=380, md=460.
// lg/xl/full retained as extended sizes for surfaces beyond prototype scope
// (PublishingHub, TemplatePreviewModal, etc).
const sizeMap = {
  sm: 380,
  md: 460,
  lg: 720,
  xl: 960,
  full: "90vw",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocusRef,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  // Override default first-focus when initialFocusRef is provided
  React.useEffect(() => {
    if (!isOpen || !initialFocusRef?.current) return;
    initialFocusRef.current.focus();
  }, [isOpen, initialFocusRef]);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Generate stable ID for accessibility - must be called before any early returns (Rules of Hooks)
  const titleId = React.useId();

  if (!isOpen) return null;

  return (
    <div
      className="buildrick-modal-overlay"
      style={overlayStyles}
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="buildrick-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{
          ...modalStyles,
          width: typeof sizeMap[size] === "number" ? sizeMap[size] : sizeMap[size],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="buildrick-modal-header" style={headerStyles}>
            <div id={titleId} style={{ fontWeight: 600, fontSize: 16 }}>
              {title}
            </div>
            {showCloseButton && (
              <button onClick={onClose} style={closeButtonStyles} aria-label="Close modal">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="buildrick-modal-body" style={bodyStyles}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="buildrick-modal-footer" style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Overlay: solid slate dimmer, no backdrop-filter (LOCKED 2026-04-25 per
// P0c M4 — DESIGN.md forbids backdrop-filter in editor chrome).
const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--bd-overlay)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyles: React.CSSProperties = {
  background: "var(--bd-bg-card)",
  borderRadius: "var(--bd-radius-lg)",
  boxShadow: "var(--bd-shadow-modal)",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  animation: "buildrick-modal-in 0.2s ease",
};

const headerStyles: React.CSSProperties = {
  padding: "var(--bd-space-4) var(--bd-space-5)",
  borderBottom: "1px solid var(--bd-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const closeButtonStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--bd-fg-secondary)",
  cursor: "pointer",
  padding: 12, // WCAG 2.5.5 touch target (44x44)
  borderRadius: "var(--bd-radius-sm)",
  display: "flex",
  minWidth: 44,
  minHeight: 44,
  alignItems: "center",
  justifyContent: "center",
};

const bodyStyles: React.CSSProperties = {
  padding: "var(--bd-space-5)",
  overflow: "auto",
  flex: 1,
};

const footerStyles: React.CSSProperties = {
  padding: "var(--bd-space-4) var(--bd-space-5)",
  borderTop: "1px solid var(--bd-border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: "var(--bd-space-2)",
};

// Confirm Dialog Helper
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}) => {
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" initialFocusRef={confirmRef}>
      <p style={{ margin: 0, color: "var(--bd-fg-secondary)" }}>{message}</p>
      <div
        style={{
          display: "flex",
          gap: "var(--bd-space-2)",
          marginTop: "var(--bd-space-5)",
          justifyContent: "flex-end",
        }}
      >
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          ref={confirmRef}
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default Modal;
