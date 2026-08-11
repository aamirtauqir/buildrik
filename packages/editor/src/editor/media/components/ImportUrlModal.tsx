/**
 * ImportUrlModal — the Import URL button's own dialog.
 *
 * Replaces `window.prompt("Paste image or media URL:")`. A native prompt is an
 * OS chrome dialog dropped into the middle of a designed product: it cannot be
 * styled, cannot say why a URL was rejected, blocks the page while it is up,
 * and in an automated browser it freezes the session outright.
 *
 * The boards draw the `⭳ Import URL` button (1163:13726) but no dialog behind
 * it, so the shape here follows the product's own modal contract rather than
 * inventing a screen: chrome-ui Modal, one field, the action disabled with a
 * stated reason until the URL is usable.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Modal, TextField } from "@/editor/chrome-ui";

interface ImportUrlModalProps {
  open: boolean;
  onClose(): void;
  /** Receives a trimmed, http(s) URL. Fetching and error toasts stay upstream. */
  onImport(url: string): void;
}

/** http/https only — a data: or blob: URL is already local, and file:// cannot be read. */
function isFetchableUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ImportUrlModal({ open, onClose, onImport }: ImportUrlModalProps) {
  const [url, setUrl] = React.useState("");

  // A reopened dialog starts empty — a stale URL from a previous import is
  // never what the user means the second time.
  React.useEffect(() => {
    if (open) setUrl("");
  }, [open]);

  const trimmed = url.trim();
  const valid = isFetchableUrl(trimmed);

  const submit = () => {
    if (!valid) return;
    onImport(trimmed);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      kind="form"
      title="Import from URL"
      subtitle="Paste a link to an image or video and it lands in this library."
      footer={
        <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
          <Button type="button" color="light" onClick={onClose} data-testid="import-url-cancel">
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!valid} data-testid="import-url-go">
            Import
          </Button>
        </div>
      }
    >
      {/* Board 1205:4804 labels the field, the way the family's other
          modals label their sections ("PAGES" on 1164:4738). */}
      <p className="tw:mb-1 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
        Media URL
      </p>
      <TextField
        type="url"
        autoFocus
        value={url}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="https://…"
        aria-label="Media URL"
        data-testid="import-url-input"
      />
      {/* The Button doc's rule: "disabled without a reason is a bug." */}
      {trimmed && !valid ? (
        <p
          className="tw:mt-1.5 tw:text-[12px] tw:leading-[18px] tw:text-red-700"
          role="alert"
          data-testid="import-url-error"
        >
          That is not a web address. It needs to start with http:// or https://.
        </p>
      ) : null}
    </Modal>
  );
}
