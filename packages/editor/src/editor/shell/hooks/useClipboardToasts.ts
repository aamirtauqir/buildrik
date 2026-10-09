/**
 * Toasts for copy / cut / paste / duplicate, and copy / paste style.
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

    /* LOCKED_ELEMENTS_SKIPPED (delete,
       cut, nudge — A-5) had no listener anywhere, so a locked element quietly
       staying put looked identical to nothing having been selected at all. */
    /* P-1: every Inspector write on a locked element raises it too, and a
       field typed into writes per keystroke — one toast while it is up. */
    const LOCKED_TOAST_MS = 2500;
    let lockedShownAt = -Infinity;
    const lockedSkipped = (e?: { reason?: string }) => {
      const now = Date.now();
      if (now - lockedShownAt < LOCKED_TOAST_MS) return;
      lockedShownAt = now;
      /* L2-016: a component part is refused for a different reason. */
      const description =
        e?.reason === "instance" ? "Part of a component — detach the instance to change it" : "Locked elements were skipped";
      addToast({ description, tone: "info", duration: LOCKED_TOAST_MS });
    };

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
          action: { label: "Undo", onClick: composer.history.captureUndo() },
        });
        dupes = [];
        dupeBurst = null;
      }, 0);
    };

    /* ⌥⌘C / ⌥⌘V and their menu rows — the copy-style / paste-style commands
       (moved out of useCanvasKeyboard, which toasted only over the canvas). */
    const stylesCopied = (e?: { count?: number }) => {
      const n = e?.count ?? 0;
      addToast(
        n > 0
          ? { description: `${plural(n, "1 style", "styles")} copied`, tone: "info", duration: 2000 }
          : { description: "No styles to copy", tone: "warning", duration: 2000 }
      );
    };
    const stylesPasted = (e?: { count?: number }) =>
      addToast({
        description: `${plural(e?.count ?? 0, "1 style", "styles")} applied`,
        tone: "success",
        duration: 2000,
        action: { label: "Undo", onClick: composer.history.captureUndo() },
      });

    composer.on(EVENTS.CLIPBOARD_COPY, copied);
    composer.on(EVENTS.STYLES_COPIED, stylesCopied);
    composer.on(EVENTS.STYLES_PASTED, stylesPasted);
    composer.on(EVENTS.CLIPBOARD_CUT, cut);
    composer.on(EVENTS.CLIPBOARD_PASTE, pasted);
    composer.on(EVENTS.ELEMENT_DUPLICATED, duplicated);
    composer.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, lockedSkipped);
    return () => {
      if (burst) clearTimeout(burst);
      if (dupeBurst) clearTimeout(dupeBurst);
      composer.off(EVENTS.CLIPBOARD_COPY, copied);
      composer.off(EVENTS.STYLES_COPIED, stylesCopied);
      composer.off(EVENTS.STYLES_PASTED, stylesPasted);
      composer.off(EVENTS.CLIPBOARD_CUT, cut);
      composer.off(EVENTS.CLIPBOARD_PASTE, pasted);
      composer.off(EVENTS.ELEMENT_DUPLICATED, duplicated);
      composer.off(EVENTS.LOCKED_ELEMENTS_SKIPPED, lockedSkipped);
    };
  }, [composer, addToast]);
}
