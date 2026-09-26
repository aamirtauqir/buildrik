/**
 * UnsavedTabSwitchDialog — the shared confirm shown by `useTabSwitchGuard`
 * (B-1) whenever a tab switch would leave a dirty Settings screen, a staged
 * Brand edit, or an open CMS record with unsaved fields. The body and the
 * leave button's words come from the guard: loss is promised only when every
 * dirty surface really discards on leave (Brand cannot, so its copy says
 * "may discard some of them"). Two answers only (no per-domain "Save and
 * continue" — the registry doesn't know how to save each domain): Keep
 * editing (safe answer, gets focus) or the leave action (danger).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_OUTLINE,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import type { TabSwitchGuardDialogProps } from "../hooks/useTabSwitchGuard";

export function UnsavedTabSwitchDialog({ open, body, leaveLabel, onKeepEditing, onLeaveAnyway }: TabSwitchGuardDialogProps) {
  const keepRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    keepRef.current?.focus();
    const id = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <ModalRoot open={open} onClose={onKeepEditing}>
      <ModalContent className="tw:w-[480px]" srTitle="Unsaved changes" data-testid="tab-switch-unsaved">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="tab-switch-unsaved-title">
          Unsaved changes
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="tab-switch-unsaved-body">
            {body}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="tab-switch-unsaved-foot">
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            onClick={onLeaveAnyway}
            data-testid="tab-switch-unsaved-leave"
          >
            {leaveLabel}
          </Button>
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_OUTLINE}
            ref={keepRef}
            onClick={onKeepEditing}
            data-testid="tab-switch-unsaved-keep"
          >
            Keep editing
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
