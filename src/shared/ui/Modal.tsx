/**
 * Aquibra Modal Component
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";

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
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const sizeMap = {
  sm: 400,
  md: 560,
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

  // Basic focus trap (loop within modal)
  React.useEffect(() => {
    if (!isOpen) return;
    const modalEl = document.querySelector(".aqb-modal") as HTMLElement | null;
    if (!modalEl) return;

    const focusableSelectors =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => !el.hasAttribute("disabled")
    );

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else {
      // Priority: first input/textarea/select, then first focusable
      const firstInput = modalEl.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      if (firstInput) {
        firstInput.focus();
      } else if (focusables.length > 0) {
        focusables[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    modalEl.addEventListener("keydown", handleKeyDown);
    return () => {
      modalEl.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="aqb-modal-overlay"
      style={overlayStyles}
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        className="aqb-modal"
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
          <div className="aqb-modal-header" style={headerStyles}>
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
        <div className="aqb-modal-body" style={bodyStyles}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="aqb-modal-footer" style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

const modalStyles: React.CSSProperties = {
  background: "var(--aqb-bg-panel)",
  borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  animation: "aqb-modal-in 0.2s ease",
};

const headerStyles: React.CSSProperties = {
  padding: "16px 20px",
  borderBottom: "1px solid var(--aqb-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const closeButtonStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-secondary)",
  cursor: "pointer",
  padding: 12, // Increased from 4px to meet WCAG 2.5.5 touch target (44x44px)
  borderRadius: 6,
  display: "flex",
  minWidth: 44,
  minHeight: 44,
  alignItems: "center",
  justifyContent: "center",
};

const bodyStyles: React.CSSProperties = {
  padding: 20,
  overflow: "auto",
  flex: 1,
};

const footerStyles: React.CSSProperties = {
  padding: "16px 20px",
  borderTop: "1px solid var(--aqb-border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
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
      <p style={{ margin: 0, color: "var(--aqb-text-secondary)" }}>{message}</p>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 20,
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
