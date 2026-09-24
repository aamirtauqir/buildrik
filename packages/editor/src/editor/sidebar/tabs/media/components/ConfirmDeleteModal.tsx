/**
 * ConfirmDeleteModal — Clone 3708:20650 / 21082 / 22372 ("Delete <file>?")
 * and 3701:20385 ("Delete 2 selected files?").
 *
 * One file: the title carries the full filename, the body counts its site
 * placements and offers Replace instead when there are any. A checked set:
 * every file with its use count in one sentence, then the total. The V1
 * board 1175:4827's "Delete file?" title, 📄 name list and amber in-use alert
 * are displaced by that copy. Its type-DELETE gate past 20 files is gone:
 * decision #29 keeps typed DELETE for irreversible AND wide actions (site ·
 * collection · record with page · token in use) — a large asset delete is a
 * plain confirm, whose file list and placement count are the warning.
 *
 * The Clone draws no unused variant of the single confirm; "This file is not
 * used on the site." stands in for the absent placement sentence.
 *
 * Styles are inline `tw:` utilities because the `.med-modal-*` CSS this file
 * referenced was deleted on 2026-04-11 (ab72ef18) while the classNames stayed:
 * the modal that guards deleting up to 34 files rendered unstyled for four
 * months — no red on the destructive button. Orphan classes do not fail a
 * build, so nothing said a word. Shared shape in `libraryModal.ts`.
 * On the shared Radix Modal substrate (focus trap, Esc, overlay) —
 * ModalRoot/ModalContent own it.
 * @license BSD-3-Clause
 */

import { ModalBody, ModalContent, ModalRoot, Button } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import type { ConfirmDeletePayload } from "../data/mediaTypes";

interface ConfirmDeleteModalProps {
  payload: ConfirmDeletePayload;
  onConfirm(): void;
  onCancel(): void;
  /** 3708:20650's "Replace instead" — opens the replace-across picker for
   *  the asset. Absent (the drawer's MediaTab) the button does not render. */
  onReplaceInstead?(key: string): void;
}

/* A checked set past this is named as "a, b, c, d, e and N more": the Clone's
   one-sentence shape holds, and a 34-name paragraph does not. */
const NAMED_FILES = 5;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "a", "a and b", "a, b and c" — the Clone's list grammar. */
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function ConfirmDeleteModal({ payload, onConfirm, onCancel, onReplaceInstead }: ConfirmDeleteModalProps) {
  const { keys, names, inUse, isBulk } = payload;
  const countFor = (key: string) => inUse.find((u) => u.key === key)?.count ?? 0;

  const n = keys.length;
  const total = keys.reduce((sum, key) => sum + countFor(key), 0);
  const named = keys.slice(0, NAMED_FILES).map((key, i) => {
    const uses = countFor(key);
    return `${names[i]} (${uses === 0 ? "unused" : plural(uses, "use")})`;
  });
  if (n > NAMED_FILES) named.push(`${n - NAMED_FILES} more`);

  const title = isBulk ? `Delete ${plural(n, "selected file")}?` : `Delete ${names[0]}?`;
  const body = isBulk
    ? `${joinAnd(named)} will be permanently deleted. ${
        total > 0 ? `This affects ${plural(total, "placement")}.` : "None of them is used on the site."
      }`
    : total > 0
      ? `Used in ${plural(total, "site placement")}. Deleting this file permanently breaks those elements. Replace the file instead if you want to preserve them.`
      : "This file is not used on the site.";
  const confirmLabel = isBulk ? `Delete ${plural(n, "file")}` : "Delete permanently";
  const replaceKey = !isBulk && total > 0 && onReplaceInstead ? keys[0] : null;

  return (
    <ModalRoot open onOpenChange={(o) => { if (!o) onCancel(); }} dismissOnScrimClick={false}>
      <ModalContent size="form" srTitle={title} data-testid="media-delete">
        <h2 className={LIBRARY_MODAL_TITLE} id="med-del-title" data-testid="media-delete-title">
          {title}
        </h2>

        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="media-delete-body">
            {body}
          </p>

        </ModalBody>

        <div className={LIBRARY_MODAL_FOOT} data-testid="media-delete-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} data-testid="media-delete-cancel" onClick={onCancel}>
            Cancel
          </Button>
          {replaceKey !== null && (
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              data-testid="media-delete-replace"
              onClick={() => onReplaceInstead?.(replaceKey)}
            >
              Replace instead
            </Button>
          )}
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_DANGER}
            data-testid="media-delete-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>

      </ModalContent>
    </ModalRoot>
  );
}
