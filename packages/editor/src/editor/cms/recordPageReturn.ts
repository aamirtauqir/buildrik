/**
 * recordPageReturn — the way back from a collection page to the Card whose
 * Link row made it (2L9 B5-D98 195:29753, "‹ Home · Team card"). Set when
 * the make's "Open page" receipt opens the page; the page's Inspector reads
 * it. Session-only: one return at a time, dropped once used.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";

export interface RecordPageReturn {
  /** The collection page that was opened. */
  pageId: string;
  /** Where the user came from. */
  originPageId: string;
  originElementId: string;
  /** "Home · Team card". */
  label: string;
}

let current: RecordPageReturn | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const recordPageReturn = {
  set(r: RecordPageReturn): void {
    current = r;
    emit();
  },
  forPage: (pageId: string): RecordPageReturn | null => (current?.pageId === pageId ? current : null),
  /** Back on the origin page with the Card selected; the return is spent. */
  go(composer: Composer): void {
    if (!current) return;
    const { originPageId, originElementId } = current;
    current = null;
    emit();
    composer.elements.setActivePage(originPageId);
    const el = composer.elements.getElement(originElementId);
    if (el) composer.selection.select(el);
  },
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Tests only. */
  reset(): void {
    current = null;
    emit();
  },
};
