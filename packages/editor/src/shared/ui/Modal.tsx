// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Modal.
/**
 * Adapter shim — translates legacy Modal API to vibcoder Modal (Radix.Dialog).
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   isOpen → open
 *   onClose → onOpenChange (next: boolean) => !next && onClose()
 *   title → ModalTitle child
 *   children → body content (rendered between header and footer)
 *   footer → ModalFooter child
 *   size: sm | md | lg | xl | full
 *     sm/md → vibcoder size="lg" (Phase 3 Modal supports lg/xl only)
 *     lg → vibcoder size="lg"
 *     xl → vibcoder size="xl"
 *     full → vibcoder size="xl" + style={{maxWidth:"90vw"}}
 *   closeOnOverlay → vibcoder Modal handles via Radix.Dialog onPointerDownOutside (default: closes)
 *     If closeOnOverlay=false: Radix.Dialog onPointerDownOutside={e => e.preventDefault()}
 *   closeOnEscape → Radix.Dialog handles (default: closes)
 *     If closeOnEscape=false: onEscapeKeyDown={e => e.preventDefault()}
 *   showCloseButton → conditionally renders ModalClose
 *   initialFocusRef → Radix.Dialog onOpenAutoFocus callback focuses ref
 *
 * Untranslatable: none. Strategy is "compose-or-style" not "throw".
 *
 * Focus trap migration: useFocusTrap hook is NOT used in this shim. Radix.Dialog
 * provides internal focus trap. (T6.1 inventory found vibcoder Popover lacks
 * Radix backing, so the Popover shim retains useFocusTrap. Phase 5 deletes the
 * hook after vibcoder Popover gets its Radix.Popover upgrade — see T7 plan
 * amendment commit `37b3a47`.)
 *
 * Body scroll lock: Radix.Dialog handles via overlay scroll-locking. The
 * legacy `document.body.style.overflow = "hidden"` effect is removed.
 *
 * @license BSD-3-Clause
 */
import {
  type ComponentType,
  type ReactNode,
  type RefObject,
  type CSSProperties,
} from "react";
import {
  Modal as VibcoderModal,
  ModalContent,
  ModalTitle,
  ModalClose,
  ModalFooter,
  OverlayMount,
  Button as VibcoderButton,
} from "@/editor/shared/vibcoder";

// Phase 4 shim escape hatch: Radix.Dialog.Content props (onPointerDownOutside,
// onEscapeKeyDown, onOpenAutoFocus) are intentionally hidden from vibcoder's
// public ModalContentProps per Contract E2 (no Radix types leaked). Vibcoder's
// ModalContent still spreads these to Radix at runtime. Cast bypasses the
// narrowed type without changing behavior. Phase 5 deletes this whole file.
type ModalContentEscapeProps = {
  size?: "lg" | "xl";
  style?: CSSProperties;
  onPointerDownOutside?: (e: { preventDefault: () => void }) => void;
  onEscapeKeyDown?: (e: { preventDefault: () => void }) => void;
  onOpenAutoFocus?: (e: { preventDefault: () => void }) => void;
  children: ReactNode;
};
const ModalContentTyped =
  ModalContent as unknown as ComponentType<ModalContentEscapeProps>;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const SIZE_MAP: Record<NonNullable<ModalProps["size"]>, "lg" | "xl"> = {
  sm: "lg",
  md: "lg",
  lg: "lg",
  xl: "xl",
  full: "xl",
};

export function Modal({
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
}: ModalProps) {
  const vibcoderSize = SIZE_MAP[size];
  const fullStyle: CSSProperties | undefined =
    size === "full" ? { maxWidth: "90vw" } : undefined;

  return (
    <OverlayMount>
      <VibcoderModal
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <ModalContentTyped
          size={vibcoderSize}
          style={fullStyle}
          onPointerDownOutside={
            closeOnOverlay ? undefined : (e) => e.preventDefault()
          }
          onEscapeKeyDown={
            closeOnEscape ? undefined : (e) => e.preventDefault()
          }
          onOpenAutoFocus={(e) => {
            if (initialFocusRef?.current) {
              e.preventDefault();
              initialFocusRef.current.focus();
            }
          }}
        >
          {title && <ModalTitle>{title}</ModalTitle>}
          {showCloseButton && (
            <ModalClose aria-label="Close modal">
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
            </ModalClose>
          )}
          <div className="bd-modal__body">{children}</div>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContentTyped>
      </VibcoderModal>
    </OverlayMount>
  );
}
Modal.displayName = "Modal";

// ConfirmDialog helper — Phase 4 keeps the API surface, internals delegate to Modal shim.
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

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ margin: 0 }}>{message}</p>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          justifyContent: "flex-end",
        }}
      >
        <VibcoderButton variant="ghost" onClick={onClose}>
          {cancelText}
        </VibcoderButton>
        <VibcoderButton
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </VibcoderButton>
      </div>
    </Modal>
  );
}

export default Modal;
