/**
 * ImportUrlModal — Clone 3397:18835 "Import image from URL".
 *
 * Opened by the library's `⭳ Import URL` and by the picker's `From URL`
 * (over the picker — edge `Action / From URL|CLIC|OVE>3397:18835`). Title,
 * one line that says what importing does NOT do, the URL field, Cancel and
 * `Import image` — primary, disabled until the address is fetchable, with the
 * field's own error line for a string that is not a web address at all.
 *
 * Displaces V1 1205:4804 / 1205:4816 (the "Import from URL" dialog with a
 * MEDIA URL label and an "Import" button), which itself replaced
 * `window.prompt("Paste image or media URL:")` — a native prompt cannot be
 * styled, cannot say why a URL was rejected, and freezes an automated walk.
 *
 * `onImport` is awaited: the dialog stays open and busy while the fetch runs
 * (the prototype's `Import image|CLIC|COND` step), then closes. What it
 * settled into — Image imported, or Image could not be imported — is the
 * orchestrator's dialog (`ImportResultModal`); the Edit URL door there hands
 * the address back through `initialUrl`, so nobody retypes it.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px buttons,
 * 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
import { isFetchableUrl } from "../fetchUrlAsFile";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface ImportUrlModalProps {
  open: boolean;
  /** Pre-filled address — 3695:43876's Edit URL reopens on the one that failed. */
  initialUrl?: string;
  onClose(): void;
  /** Receives a trimmed http(s) URL. Resolves once the import has settled either way. */
  onImport(url: string): Promise<unknown>;
}

export function ImportUrlModal({ open, initialUrl, onClose, onImport }: ImportUrlModalProps) {
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // A reopened dialog starts on what it was handed — the failed address on
  // Edit URL, nothing otherwise: a stale URL from a previous import is never
  // what the user means the second time.
  React.useEffect(() => {
    if (open) {
      setUrl(initialUrl ?? "");
      setBusy(false);
    }
  }, [open, initialUrl]);

  const trimmed = url.trim();
  const valid = isFetchableUrl(trimmed);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onImport(trimmed);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="table" srTitle="Import image from URL" data-testid="import-url">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="import-url-title">
          Import image from URL
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="import-url-body">
            Add an image to your library. Importing does not replace an image on the canvas.
          </p>
          {/* chrome-ui's 32 TextInput; `aria-invalid` is what its theme reads
              for the error border, and it survives focus (textInputTheme's
              `aria-invalid:focus:` compound). `className` lands on the
              wrapper — the field's own box is the theme's. */}
          <TextInput
            type="url"
            autoFocus
            aria-invalid={Boolean(trimmed) && !valid ? true : undefined}
            value={url}
            disabled={busy}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="https://"
            aria-label="Image URL"
            className="tw:mt-3"
            data-testid="import-url-input"
          />
          {/* The Button doc's rule: "disabled without a reason is a bug." */}
          {trimmed && !valid ? (
            <p
              className="tw:m-0 tw:mt-1.5 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-error-text)]"
              role="alert"
              data-testid="import-url-error"
            >
              That is not a web address. It needs to start with http:// or https://.
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="import-url-foot">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={onClose}
            disabled={busy}
            data-testid="import-url-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            onClick={() => void submit()}
            disabled={!valid || busy}
            data-testid="import-url-go"
          >
            {busy ? "Importing…" : "Import image"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
