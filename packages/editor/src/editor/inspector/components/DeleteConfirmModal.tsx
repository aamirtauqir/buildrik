/**
 * Delete Confirmation Modal
 * Extracted from ProInspector.tsx for 500-line compliance.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Kbd, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  elementLabel: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  elementLabel,
}) => (
  <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
    <ModalContent size="lg">
      {/* Board 183:2: a destructive confirm NAMES what it will destroy, in
          the title and on the button — "Delete 3 pages", never "Confirm" and
          never a bare "Delete Element" that could be any of them. */}
      <ModalTitle>Delete {elementLabel}?</ModalTitle>
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
      <ModalBody>
        <p role="alert" className="tw:m-0">
          {/* The board's sample says "This cannot be undone", which is not true
              of this editor — a delete is one undo step. The code contract wins on
              behaviour, so the sentence says what actually happens. */}
          <strong>{elementLabel}</strong> is removed from the page. You can undo it with{" "}
          <Kbd>Ctrl+Z</Kbd>.
        </p>
      </ModalBody>
      {/* Board 1706:8462 — the actions belong to a real ModalFooter, which is
          what caps them at 28. They shipped in a hand-rolled flex row inside
          ModalBody, so MODAL_FOOT_CLASS never reached them and flowbite's own
          40 stood: the panel measured 169 against the board's 132, and the
          whole +37 was here. Capping the two buttons with `tw:h-7` instead
          would leave the next modal to rediscover the same thing. */}
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete {elementLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  </ModalRoot>
);
