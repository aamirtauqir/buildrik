/**
 * RemoveLocaleDialog — 8135:214262 `Remove French?` (560): asked only when the
 * locale has page translations (owner decision Q-B6). Removing a locale takes
 * it out of `Site.enabledLocales` and nothing else — the translations stay in
 * `Page.translations[<code>]` (`getLocales` reads them back the moment the
 * code is enabled again), which is what the body says.
 *
 * `Cancel` takes focus and is what Escape and the scrim answer.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface RemoveLocaleDialogProps {
  /** The locale to remove; `null` keeps the dialog closed. */
  locale: { name: string; translated: number; total: number } | null;
  /** While the write runs — both buttons wait for the answer. */
  busy?: boolean;
  onCancel(): void;
  onRemove(): void;
}

function removeLocaleBody(name: string, translated: number, total: number): string {
  const pages = translated === 1 ? "page has" : "pages have";
  return `${translated} of ${total} ${pages} ${name} translations. They are kept and come back if you add ${name} again.`;
}

export function RemoveLocaleDialog({ locale, busy = false, onCancel, onRemove }: RemoveLocaleDialogProps) {
  const title = `Remove ${locale?.name ?? ""}?`;
  return (
    <ModalRoot open={locale !== null} onClose={busy ? undefined : onCancel}>
      <ModalContent size="question" srTitle={title} data-testid="set-loc-remove-confirm">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-loc-remove-title">
          {title}
        </h2>
        <ModalBody>
          <p className={`${LIBRARY_MODAL_BODY} tw:text-[length:var(--bk-text-13)]`} data-testid="set-loc-remove-body">
            {locale ? removeLocaleBody(locale.name, locale.translated, locale.total) : null}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button
            size="xs"
            variant="ghost"
            className={LIBRARY_MODAL_BTN_GHOST}
            autoFocus
            disabled={busy}
            onClick={onCancel}
            data-testid="set-loc-remove-cancel"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={busy}
            onClick={onRemove}
            data-testid="set-loc-remove-ok"
          >
            {`Remove ${locale?.name ?? ""}`}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
