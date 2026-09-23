/**
 * CreateFolderModal — Clone 3700:20347 (New folder) with its second step,
 * 3700:20350 (Folder name already exists).
 *
 * `row/＋ New folder` opens an OVERLAY on every Clone screen. It replaces
 * V1 board 1205:4829's inline editing row (the field that opened inside the
 * rail with "Enter to create · Esc to cancel" under it) — the same door,
 * drawn as a dialog: title, `Folder name:`, one field, Cancel, Create folder.
 *
 * The taken-name case is a STEP of this dialog, not a second overlay: one
 * dialog at a time is the library's rule (audit A06), and the step's Cancel
 * returns to the library with nothing changed, exactly as the first step's
 * does. `Use <next free name>` is the primary there — the board's sample
 * reads "Use Campaign images"; the shape is "the first `<Name> N` nobody
 * holds yet".
 *
 * Phase-2 modal spec (founder, 2026-09-13): title 16/600, body 13 ink-soft,
 * buttons 32 on an 8 gap, ~560 wide. The Clone draws a 24 inset with the
 * buttons LEFT-aligned under the body and no rule above them, so the frame
 * is ModalContent with one padded column inside it (ReviewSentModal's shape)
 * and the heading is its own element at 16, the way the family's delete
 * confirm sets its own — the shared ModalTitle/ModalBody carry 14 / px-4 as
 * `tw:` classes, and a second same-property utility would be resolved by
 * stylesheet order, not by intent. Field: chrome-ui's 32 TextInput; buttons:
 * flowbite's `xs`, which IS h-8.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";

interface CreateFolderModalProps {
  open: boolean;
  /** Folder names already at the level the new folder will land in. */
  existingNames: readonly string[];
  onClose(): void;
  /** Receives a trimmed name no sibling holds. Creating stays upstream. */
  onCreate(name: string): void;
}

const TITLE_CLASS =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:text-[var(--bk-ink)]";
const FOOT_CLASS = "tw:mt-1 tw:flex tw:items-center tw:gap-2";

const fold = (name: string) => name.trim().toLowerCase();

/** `<Name> 2`, `<Name> 3`… — the first the level does not already hold. */
function nextFreeName(base: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames.map(fold));
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!taken.has(fold(candidate))) return candidate;
  }
}

export function CreateFolderModal({ open, existingNames, onClose, onCreate }: CreateFolderModalProps) {
  const [name, setName] = React.useState("");
  /* The sibling whose name the typed one collides with — non-null IS the
     second step. Its own spelling is shown, not the user's: "Products
     already exists" is a statement about the folder that exists. */
  const [taken, setTaken] = React.useState<string | null>(null);

  // A reopened dialog starts empty, on the name step — a stale name or a
  // stale refusal from last time is never what the user means now.
  React.useEffect(() => {
    if (open) {
      setName("");
      setTaken(null);
    }
  }, [open]);

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  const submit = () => {
    if (!canCreate) return;
    const clash = existingNames.find((n) => fold(n) === fold(trimmed));
    if (clash !== undefined) {
      setTaken(clash);
      return;
    }
    onCreate(trimmed);
    onClose();
  };

  const useNextFree = () => {
    if (taken === null) return;
    onCreate(nextFreeName(taken, existingNames));
    onClose();
  };

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent
        size="form"
        srTitle={taken === null ? "New folder" : "Folder name already exists"}
        data-testid="mgr-create-folder"
      >
        {taken === null ? (
          <div className="tw:flex tw:flex-col tw:gap-3 tw:p-6">
            <h2 className={TITLE_CLASS} data-testid="mgr-create-folder-title">
              New folder
            </h2>
            <p
              className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink)]"
              data-testid="mgr-create-folder-label"
            >
              Folder name:
            </p>
            <TextInput
              autoFocus
              value={name}
              placeholder="Folder name"
              aria-label="Folder name"
              data-testid="mgr-create-folder-input"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") submit();
              }}
            />
            <div className={FOOT_CLASS} data-testid="mgr-create-folder-foot">
              <Button type="button" color="light" size="xs" onClick={onClose} data-testid="mgr-create-folder-cancel">
                Cancel
              </Button>
              <Button type="button" size="xs" onClick={submit} disabled={!canCreate} data-testid="mgr-create-folder-go">
                Create folder
              </Button>
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-3 tw:p-6">
            <h2 className={TITLE_CLASS} data-testid="mgr-create-folder-title">
              Folder name already exists
            </h2>
            <p
              className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
              data-testid="mgr-create-folder-taken"
            >
              {taken} already exists. Choose a different name. Your assets have not changed.
            </p>
            <div className={FOOT_CLASS} data-testid="mgr-create-folder-foot">
              <Button type="button" color="light" size="xs" onClick={onClose} data-testid="mgr-create-folder-cancel">
                Cancel
              </Button>
              <Button type="button" size="xs" autoFocus onClick={useNextFree} data-testid="mgr-create-folder-use">
                Use {nextFreeName(taken, existingNames)}
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </ModalRoot>
  );
}
