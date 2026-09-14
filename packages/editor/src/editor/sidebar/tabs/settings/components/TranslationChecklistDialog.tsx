/**
 * TranslationChecklistDialog — Clone 3737:44869 "<Language> · Translation
 * checklist" (640).
 *
 * Opened from a row of the Localization screen's Locales table. `<site> ·
 * /<code> · Draft · <n> of <total> pages` (`Live` once the locale is LIVE),
 * then one line: `Right-to-left locale. ` for the RTL set, and the pending
 * pages in site order — `Begin with Home, then Menu, Contact and Privacy.` —
 * or `Every page is translated.` when nothing is pending. One door, `Back
 * to localization`, which takes focus; Escape and the scrim are the same
 * door.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * button) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { RTL_LOCALES, localeLabel } from "../constants";
import type { LocaleRow } from "../screens/localesContract";

export interface TranslationChecklistDialogProps {
  open: boolean;
  siteName: string;
  /** The row that was clicked; null renders nothing. */
  locale: LocaleRow | null;
  /** Also Escape and the scrim. */
  onBack(): void;
}

/** `Begin with Home, then Menu, Contact and Privacy.` — or the all-done line. */
export function checklistLine(pending: ReadonlyArray<string>): string {
  if (pending.length === 0) return "Every page is translated.";
  const [first, ...rest] = pending;
  if (rest.length === 0) return `Begin with ${first}.`;
  const tail = rest.length === 1 ? rest[0] : `${rest.slice(0, -1).join(", ")} and ${rest[rest.length - 1]}`;
  return `Begin with ${first}, then ${tail}.`;
}

export function TranslationChecklistDialog({ open, siteName, locale, onBack }: TranslationChecklistDialogProps) {
  if (!locale) return null;
  const language = localeLabel(locale.code);
  const meta = [
    siteName,
    locale.path,
    locale.status === "LIVE" ? "Live" : "Draft",
    `${locale.translated} of ${locale.total} pages`,
  ]
    .filter(Boolean)
    .join(" · ");
  const line = `${RTL_LOCALES.has(locale.code) ? "Right-to-left locale. " : ""}${checklistLine(locale.pending)}`;
  return (
    <ModalRoot open={open} onClose={onBack}>
      <ModalContent size="table" srTitle={`${language} · Translation checklist`} data-testid="set-loc-check">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-loc-check-title">
          {language} · Translation checklist
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-loc-check-meta">
            {meta}
          </p>
          <p className={`${LIBRARY_MODAL_BODY} tw:mt-3`} data-testid="set-loc-check-line">
            {line}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-loc-check-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} autoFocus onClick={onBack} data-testid="set-loc-check-back">
            Back to localization
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
