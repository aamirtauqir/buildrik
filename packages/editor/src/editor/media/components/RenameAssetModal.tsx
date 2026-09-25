/**
 * RenameAssetModal — Clone 3701:20353 "Rename hero-dark.jpg" and its
 * validation frame 3701:20400 "A file with that name exists".
 *
 * Displaces the library's Rename door onto the drawer's asset drill-in hub
 * (`AssetDetailOverlay`, board 146:2), which has no name field at all — the
 * button opened a screen that could not rename anything.
 *
 * The field shows and accepts the FULL filename. The engine stores the stem
 * (MediaManager strips the extension at upload; `toLibraryItem` restores it
 * for display), so saving takes the real extension back off before the name
 * reaches `renameItem`, and an asset the engine already holds with its
 * extension keeps it — either way the display name still ends in the real
 * extension. A clash is judged on the display name the library would print,
 * case-insensitively, against every other asset.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, TextField } from "@/editor/chrome-ui";
import type { LibraryItem } from "../../sidebar/tabs/media/data/mediaTypes";
import { displayNameFor } from "../../sidebar/tabs/media/data/mediaUtils";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_GHOST, LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface RenameAssetModalProps {
  item: LibraryItem;
  /** Every library item — the taken-name check reads their display names. */
  libraryItems: LibraryItem[];
  /** The engine's `name` contract: the stem when that is what it holds. */
  onRename(key: string, name: string): Promise<void>;
  onClose(): void;
}

/** What `renameItem` should store for the name the person typed. */
function toStoredName(item: LibraryItem, typed: string): string {
  const display = item.displayName ?? item.name;
  const engineHoldsStem = display !== item.name;
  const ext = engineHoldsStem
    ? display.slice(item.name.length).toLowerCase()
    : (display.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? "");
  const stem = ext && typed.toLowerCase().endsWith(ext) ? typed.slice(0, -ext.length) : typed;
  return engineHoldsStem ? stem : stem + ext;
}

export function RenameAssetModal({ item, libraryItems, onRename, onClose }: RenameAssetModalProps) {
  const display = item.displayName ?? item.name;
  const [draft, setDraft] = React.useState(display);
  const [taken, setTaken] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /* Focus lands with the stem selected, so typing replaces the name and
     leaves the extension standing. */
  React.useEffect(() => {
    if (taken) return;
    const el = inputRef.current;
    if (!el) return;
    const dot = el.value.lastIndexOf(".");
    el.focus();
    el.setSelectionRange(0, dot > 0 ? dot : el.value.length);
  }, [taken]);

  const next = draft.trim();
  const canSave = next !== "" && next !== display;

  const save = () => {
    if (!canSave) return;
    const stored = toStoredName(item, next);
    const nextDisplay = displayNameFor(stored, item.mimeType).toLowerCase();
    const clash = libraryItems.some(
      (i) => i.key !== item.key && (i.displayName ?? i.name).toLowerCase() === nextDisplay,
    );
    if (clash) {
      setTaken(true);
      return;
    }
    void onRename(item.key, stored).then(onClose);
  };

  if (taken) {
    return (
      <ModalRoot open onClose={onClose}>
        <ModalContent size="form" srTitle="A file with that name exists" data-testid="mgr-rename">
          <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-rename-title">
            A file with that name exists
          </h2>
          <ModalBody>
            <p className={LIBRARY_MODAL_BODY} data-testid="mgr-rename-body">
              Choose a different file name. The original file name has not changed.
            </p>
          </ModalBody>
          <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-rename-foot">
            <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_GHOST} data-testid="mgr-rename-cancel" onClick={onClose}>
              Cancel
            </Button>
            <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="mgr-rename-edit" onClick={() => setTaken(false)}>
              Edit name
            </Button>
          </div>
        </ModalContent>
      </ModalRoot>
    );
  }

  return (
    /* Board 183:16 — a typed, unsaved name pulses on a stray scrim click
       instead of vanishing. */
    <ModalRoot open onClose={onClose} dirty={canSave}>
      <ModalContent size="form" srTitle={`Rename ${display}`} data-testid="mgr-rename">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-rename-title">
          Rename {display}
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="mgr-rename-body">
            Changing the file name will not move or replace its site usages.
          </p>
          <TextField
            ref={inputRef}
            className="tw:mt-3"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") save();
            }}
            aria-label="File name"
            data-testid="mgr-rename-input"
          />
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-rename-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_GHOST} data-testid="mgr-rename-cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="mgr-rename-save" onClick={save} disabled={!canSave}>
            Save name
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
