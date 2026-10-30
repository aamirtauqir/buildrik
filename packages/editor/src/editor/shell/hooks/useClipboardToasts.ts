/**
 * Toasts for copy / cut / paste / duplicate / delete, and copy / paste style.
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
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";

type Named = { getId?: () => string; getType?: () => string; getCustomData?: (key: string) => unknown };

/** What the receipt calls an element: its layer name, else its type. */
const nameOf = (el: Named | undefined): string =>
  (el?.getCustomData ? getLayerName(el as { getCustomData(key: string): unknown }) : undefined) ??
  (el?.getType?.() ? elementTypeLabel(el.getType()) : "Element");


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

    /* 2L9 S10 (255:86840): "Hero heading duplicated. · Undo" — the original's
       name (the copy is "… copy", and is already selected by the command).
       One duplicate command clones every selected element in one
       transaction, one event per clone — speak once per burst. */
    let dupes: string[] = [];
    let dupeBurst: ReturnType<typeof setTimeout> | null = null;
    const duplicated = (e?: { original?: Named; clone?: Named }) => {
      dupes.push(nameOf(e?.original ?? e?.clone));
      if (dupeBurst) return;
      dupeBurst = setTimeout(() => {
        const [only] = dupes;
        addToast({
          description: dupes.length > 1 ? `${dupes.length} elements duplicated.` : `${only} duplicated.`,
          action: { label: "Undo", onClick: composer.history.captureUndo() },
        });
        dupes = [];
        dupeBurst = null;
      }, 0);
    };

    /* 2L9 S09 (255:86352): "Hero heading deleted. · Undo", Undo bound to the
       delete command's one transaction. Only that command's transaction
       speaks — ELEMENT_DELETED alone also fires for every descendant and for
       removals nobody asked for (sync, component re-mounts). The names are
       read at the transaction's start, while the selection still holds them;
       a locked element the command skips never fires ELEMENT_DELETED, so it
       is never named. */
    let deleting: { names: Map<string, string>; gone: string[] } | null = null;
    const transactionBegan = (e?: { label?: string }) => {
      if (e?.label !== "delete") return;
      const selected = (composer.selection?.getAllSelected?.() ?? []) as Named[];
      deleting = { names: new Map(selected.map((el) => [el.getId?.() ?? "", nameOf(el)])), gone: [] };
    };
    const elementDeleted = (el?: Named) => {
      const name = deleting?.names.get(el?.getId?.() ?? "");
      if (deleting && name !== undefined) deleting.gone.push(name);
    };
    const transactionEnded = (e?: { rolledBack?: boolean }) => {
      const done = deleting;
      deleting = null;
      if (!done || e?.rolledBack || done.gone.length === 0) return;
      const [only] = done.gone;
      addToast({
        description: done.gone.length > 1 ? `${done.gone.length} elements deleted.` : `${only} deleted.`,
        action: { label: "Undo", onClick: composer.history.captureUndo() },
      });
    };

    /* ⌥⌘C / ⌥⌘V and their menu rows — the copy-style / paste-style commands
       (moved out of useCanvasKeyboard, which toasted only over the canvas). */
    const stylesCopied = (e?: { count?: number }) => {
      const n = e?.count ?? 0;
      addToast(
        n > 0
          ? {
              /* 2L9 G01 (271:124080): what copy-style copies — the one
                 element's own base styles: Desktop, Default state. */
              description: `${plural(n, "1 style", "styles")} copied · This element only · Desktop / Default`,
              tone: "info",
              duration: 2000,
            }
          : { description: "No styles to copy", tone: "warning", duration: 2000 }
      );
    };
    /* 2L9 G02 (271:124383): paste-style merges onto the element's own base
       styles (pasteStyles → setStyle) — Desktop, Default state. */
    const stylesPasted = (e?: { count?: number }) =>
      addToast({
        description: `${plural(e?.count ?? 0, "1 style", "styles")} applied · Desktop / Default`,
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
    composer.on(EVENTS.TRANSACTION_BEGIN, transactionBegan);
    composer.on(EVENTS.ELEMENT_DELETED, elementDeleted);
    composer.on(EVENTS.TRANSACTION_END, transactionEnded);
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
      composer.off(EVENTS.TRANSACTION_BEGIN, transactionBegan);
      composer.off(EVENTS.ELEMENT_DELETED, elementDeleted);
      composer.off(EVENTS.TRANSACTION_END, transactionEnded);
    };
  }, [composer, addToast]);
}
