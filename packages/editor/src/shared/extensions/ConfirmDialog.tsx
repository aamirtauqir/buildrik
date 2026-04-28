/**
 * ConfirmDialog — small confirmation prompt built on vibcoder Modal.
 *
 * Renders a titled modal with a message body and Cancel / Confirm buttons.
 * Uses Radix.Dialog focus trap, scroll lock, and Esc close out of the box.
 *
 * @license BSD-3-Clause
 */
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
  Button,
} from "@/editor/shared/vibcoder";

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
    <OverlayMount>
      <Modal
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <ModalContent size="lg">
          <ModalTitle>{title}</ModalTitle>
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
          <div className="bd-modal__body">
            <p style={{ margin: 0 }}>{message}</p>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <Button variant="ghost" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
}
