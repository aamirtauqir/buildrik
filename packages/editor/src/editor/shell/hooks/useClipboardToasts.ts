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
import { EVENTS } from "@/shared/constants/events";

interface ToastInput {
  description: string;
  tone?: "info" | "success" | "warning" | "error";
  duration?: number;
}

export function useClipboardToasts(
  composer: Composer | null | undefined,
  addToast?: (t: ToastInput) => void
): void {
  React.useEffect(() => {
    if (!composer || !addToast) return;

    const copied = () => addToast({ description: "Element copied", tone: "info", duration: 2000 });
    const cut = () => addToast({ description: "Element cut", tone: "info", duration: 2000 });
    const pasted = () => addToast({ description: "Element pasted", tone: "success", duration: 2000 });
    const duplicated = () =>
      addToast({ description: "Element duplicated", tone: "success", duration: 2000 });

    composer.on(EVENTS.CLIPBOARD_COPY, copied);
    composer.on(EVENTS.CLIPBOARD_CUT, cut);
    composer.on(EVENTS.CLIPBOARD_PASTE, pasted);
    composer.on(EVENTS.ELEMENT_DUPLICATED, duplicated);
    return () => {
      composer.off(EVENTS.CLIPBOARD_COPY, copied);
      composer.off(EVENTS.CLIPBOARD_CUT, cut);
      composer.off(EVENTS.CLIPBOARD_PASTE, pasted);
      composer.off(EVENTS.ELEMENT_DUPLICATED, duplicated);
    };
  }, [composer, addToast]);
}
