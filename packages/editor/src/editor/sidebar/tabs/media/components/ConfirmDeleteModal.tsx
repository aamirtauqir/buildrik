/**
 * ConfirmDeleteModal — board 1175:4827.
 *
 * Styles are inline `tw:` utilities because the `.med-modal-*` CSS this file
 * referenced was deleted on 2026-04-11 (ab72ef18) while the classNames stayed:
 * the modal that guards deleting up to 34 files has been rendering unstyled
 * ever since — no warning tint, no red on the destructive button. Orphan
 * classes do not fail a build, so nothing said a word.
 * P5: on the shared Radix Modal substrate (focus trap, Esc, overlay) — the
 * hand-rolled overlay wrapper is gone — ModalRoot/ModalContent own it.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalContent, ModalRoot, Button, TextField } from "@/editor/chrome-ui";
import { useState } from "react";
import type { ConfirmDeletePayload } from "../data/mediaTypes";

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
      <ModalContent srTitle="Delete files" className="tw:p-4">
        <h3 className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:text-[var(--bk-ink)]" id="med-del-title">
          {/* `isBulk` means "reached from selection mode", not "more than one" —
              selecting a single asset and hitting Delete printed "Delete 1
              files?" directly above a warning line that says "1 file is
              currently used on the canvas", so the modal disagreed with itself
              in the same breath. Count decides the plural, not the entry path. */}
          {isBulk
            ? `Delete ${keys.length} file${keys.length === 1 ? "" : "s"}?`
            : "Delete file?"}
        </h3>

        {/* File name list */}
        <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-1">
          {visibleNames.map((n) => (
            <div key={n} className="tw:flex tw:items-center tw:gap-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
              <span aria-hidden="true">📄</span>
              <span className="tw:min-w-0 tw:truncate">{n}</span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
              and {hiddenCount} more
            </div>
          )}
        </div>

        {/* In-use warning */}
        {inUseCount > 0 && (
          <div
            className="tw:mt-3 tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text,var(--bk-warning))]"
            role="alert"
          >
            ⚠ {inUseCount} {inUseCount === 1 ? "file is" : "files are"} currently used on the
            canvas. Deleting will break those elements.
          </div>
        )}

        {/* Large bulk: require typing DELETE */}
        {isLargeBulk && (
          <div className="tw:mt-4">
            <p className="tw:mb-1.5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <TextField
              className="tw:h-[var(--bk-size-row)] tw:w-full tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)] tw:px-[var(--bk-space-8)] tw:text-[13px]"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              autoFocus
              aria-label="Type DELETE to confirm"
            />
          </div>
        )}

        {/* Actions */}
        <div className="tw:mt-4 tw:flex tw:justify-end tw:gap-2">
          <Button
            className="tw:h-7 tw:min-h-0 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-card)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="tw:h-7 tw:min-h-0 tw:rounded-md tw:border-0 tw:bg-[var(--bk-error)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-accent-on)]"
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
          >
            Delete{keys.length > 1 ? ` ${keys.length} files` : ""}
          </Button>
        </div>

        {/*
          Board 1175:4827 puts the reason under the dead button. The Button
          component's own doc makes this a rule, not a nicety: "every disabled
          variant ships a tooltip naming the role needed — disabled without a
          reason is a bug." Here the reason is the typing gate.
        */}
        {isLargeBulk && !canConfirm && (
          <p className="tw:mt-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Delete stays disabled until the word matches exactly.
          </p>
        )}
      </ModalContent>
    </ModalRoot>
  );
}
