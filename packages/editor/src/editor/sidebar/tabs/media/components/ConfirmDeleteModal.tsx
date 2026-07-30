/**
 * Media Tab — Confirm Delete Modal
 * Shows in-use warning, bulk type-DELETE gate, and file names.
 * P5: on the shared Radix Modal substrate (focus trap, Esc, overlay) — the
 * hand-rolled med-modal-overlay wrapper is gone; inner med-* styling stays.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalContent, ModalRoot } from "@/editor/ui";
import { useState } from "react";
import type { ConfirmDeletePayload } from "../data/mediaTypes";
import { Button } from "flowbite-react";

interface ConfirmDeleteModalProps {
  payload: ConfirmDeletePayload;
  onConfirm(): void;
  onCancel(): void;
}

const LARGE_BULK_THRESHOLD = 20;

export function ConfirmDeleteModal({ payload, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const { keys, names, inUseCount, isBulk } = payload;
  const isLargeBulk = isBulk && keys.length > LARGE_BULK_THRESHOLD;
  const canConfirm = !isLargeBulk || confirmInput === "DELETE";

  const visibleNames = names.slice(0, 3);
  const hiddenCount = names.length - visibleNames.length;

  return (
    <ModalRoot open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <ModalContent srTitle="Delete files" className="med-modal">
        <h3 className="med-modal-title" id="med-del-title">
          {isBulk ? `Delete ${keys.length} files?` : "Delete file?"}
        </h3>

        {/* File name list */}
        <div className="med-modal-names">
          {visibleNames.map((n) => (
            <div key={n} className="med-modal-name-row">
              <span className="med-modal-file-icon" aria-hidden="true">
                📄
              </span>
              <span className="med-modal-file-name">{n}</span>
            </div>
          ))}
          {hiddenCount > 0 && <div className="med-modal-name-more">and {hiddenCount} more</div>}
        </div>

        {/* In-use warning */}
        {inUseCount > 0 && (
          <div className="med-modal-warning" role="alert">
            ⚠ {inUseCount} {inUseCount === 1 ? "file is" : "files are"} currently used on the
            canvas. Deleting will break those elements.
          </div>
        )}

        {/* Large bulk: require typing DELETE */}
        {isLargeBulk && (
          <div className="med-modal-confirm-gate">
            <p className="med-modal-gate-label">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              className="med-modal-gate-input"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              autoFocus
              aria-label="Type DELETE to confirm"
            />
          </div>
        )}

        {/* Actions */}
        <div className="med-modal-actions">
          <Button className="med-modal-cancel" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="med-modal-confirm danger"
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
          >
            Delete{keys.length > 1 ? ` ${keys.length} files` : ""}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
