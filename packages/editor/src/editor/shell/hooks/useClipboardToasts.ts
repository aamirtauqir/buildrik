/**
 * Toasts for copy / cut / paste / duplicate.
 *
 * These used to live inside `useCanvasKeyboard`, which implemented those four
 * shortcuts a second time — the command registry already owned them, listens
 * capture-phase on window, and had therefore already run. Both firing is how
 * ⌘D produced two copies and ⌘V pasted twice (measured live: one heading
 * became three).
 *
 * The duplicate implementations are gone. The feedback is not: it hangs off
 * the events the commands emit, so it now appears wherever the shortcut is
 * pressed — including the palette — rather than only when the canvas happens
 * to hold focus.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { ToastInput } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";


export function useClipboardToasts(
  composer: Composer | null | undefined,
  addToast?: (t: ToastInput) => void
): void {
  React.useEffect(() => {
    if (!composer || !addToast) return;

    const plural = (n: number, one: string, many: string) =>
      n === 1 ? one : `${n} ${many}`;

    /* Copy and cut carry every selected id since 2026-08-23, so the toast says
       how many rather than always "Element". */
    const count = (e: unknown) =>
      Array.isArray((e as { elementIds?: unknown[] })?.elementIds)
        ? (e as { elementIds: unknown[] }).elementIds.length
        : 1;

    const copied = (e: unknown) =>
      addToast({ description: `${plural(count(e), "Element", "elements")} copied`, tone: "info", duration: 2000 });
    const cut = (e: unknown) =>
      addToast({ description: `${plural(count(e), "Element", "elements")} cut`, tone: "info", duration: 2000 });

    /* CLIPBOARD_PASTE is emitted by pasteElement, once PER element — so a
       three-element paste fired three toasts stacked on top of each other. The
       header above records that even TWO was a bug worth fixing. Collect the
       burst and speak once: they all arrive inside one transaction, so a single
       macrotask is enough and nothing user-visible waits on it. */
    let pastedInBurst = 0;
    let burst: ReturnType<typeof setTimeout> | null = null;
    const pasted = () => {
      pastedInBurst += 1;
      if (burst) return;
      burst = setTimeout(() => {
        addToast({
          description: `${plural(pastedInBurst, "Element", "elements")} pasted`,
          tone: "success",
          duration: 2000,
        });
        pastedInBurst = 0;
        burst = null;
      }, 0);
    };

    /* Board 5940:147595: "Section duplicated · Undo". The duplicate command
       clones every selected element in one transaction, one event per clone —
       speak once per burst, naming a lone copy by its type. */
    let dupes: string[] = [];
    let dupeBurst: ReturnType<typeof setTimeout> | null = null;
    const duplicated = (e?: { clone?: { getType?: () => string } }) => {
      dupes.push(e?.clone?.getType?.() ?? "");
      if (dupeBurst) return;
      dupeBurst = setTimeout(() => {
        const [only] = dupes;
        addToast({
          description:
            dupes.length > 1 ? `${dupes.length} elements duplicated` : `${only ? elementTypeLabel(only) : "Element"} duplicated`,
          action: { label: "Undo", onClick: () => composer.history.undo() },
        });
        dupes = [];
        dupeBurst = null;
      }, 0);
    };

    composer.on(EVENTS.CLIPBOARD_COPY, copied);
    composer.on(EVENTS.CLIPBOARD_CUT, cut);
    composer.on(EVENTS.CLIPBOARD_PASTE, pasted);
    composer.on(EVENTS.ELEMENT_DUPLICATED, duplicated);
    return () => {
      if (burst) clearTimeout(burst);
      if (dupeBurst) clearTimeout(dupeBurst);
      composer.off(EVENTS.CLIPBOARD_COPY, copied);
      composer.off(EVENTS.CLIPBOARD_CUT, cut);
      composer.off(EVENTS.CLIPBOARD_PASTE, pasted);
      composer.off(EVENTS.ELEMENT_DUPLICATED, duplicated);
    };
  }, [composer, addToast]);
}
