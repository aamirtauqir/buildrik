/**
 * Modal runtime (design-2l9 C07 `245:39899`, C18 `252:46927`, B-17; model in
 * docs/design-2l9/engine-modal.md).
 *
 * Same single-source model as `accordionRuntime.ts`: ONE import-free function,
 * run by the canvas and serialized into the published page
 * (`lib/publish-widgets.ts`).
 *
 * A dialog is a `[role="dialog"]` carrying `data-modal-key`; a trigger points
 * at it with `data-modal-target`. A modal saved before the keys existed (a
 * `.modal-trigger` and the `.modal-overlay` the block placed after it) links
 * each un-keyed trigger to the first un-keyed dialog after it.
 *
 * Published page: a trigger opens its dialog — focus moves in and is trapped,
 * the rest of the page is made inert, Escape / a click on the backdrop itself
 * / any `[data-modal-close]` (or legacy `.modal-close`) closes it when allowed
 * (`data-modal-escape`, `data-modal-backdrop`), and focus returns to the
 * trigger. `data-modal-initial="open"` opens on load. A dialog with no name of
 * its own is labelled by its first heading (`aria-labelledby`).
 *
 * Canvas (`interactive: false`): dialogs stay closed unless `reveal` (the
 * selection) is the dialog or inside it — then it shows, without
 * trap or inertness, so it can be edited. Idempotent; returns a cleanup.
 *
 * @license BSD-3-Clause
 */

export interface ModalRuntimeOptions {
  interactive?: boolean;
  /** Canvas only: show the dialog holding this element. */
  reveal?: Element | null;
}

export function initModalRuntime(root: ParentNode, opts: ModalRuntimeOptions = {}): () => void {
  const cleanups: Array<() => void> = [];
  const interactive = opts.interactive !== false;
  const doc = (root as Node).ownerDocument || (root as Document);
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Only the Modal block's dialogs — keyed, or the legacy `.modal-overlay` —
     never any other `role="dialog"` a page may carry (it is not ours to hide). */
  const dialogs = Array.prototype.slice.call(root.querySelectorAll('[role="dialog"][data-modal-key], [role="dialog"].modal-overlay')) as HTMLElement[];
  if (dialogs.length === 0) return function () {};
  const all = Array.prototype.slice.call(root.querySelectorAll("*")) as Element[];
  const order = function (el: Element): number { return all.indexOf(el); };

  /* Which dialog each trigger opens. */
  const pairs: Array<{ trigger: HTMLElement; dialog: HTMLElement }> = [];
  const byKey: Record<string, HTMLElement> = {};
  dialogs.forEach(function (d) {
    const key = d.getAttribute("data-modal-key");
    if (key && !byKey[key]) byKey[key] = d;
  });
  (Array.prototype.slice.call(root.querySelectorAll("[data-modal-target]")) as HTMLElement[]).forEach(function (t) {
    const d = byKey[t.getAttribute("data-modal-target") || ""];
    if (d) pairs.push({ trigger: t, dialog: d });
  });
  const legacyDialogs = dialogs.filter(function (d) { return !d.getAttribute("data-modal-key"); });
  (Array.prototype.slice.call(root.querySelectorAll(".modal-trigger:not([data-modal-target])")) as HTMLElement[]).forEach(function (t) {
    const at = order(t);
    const d = legacyDialogs.filter(function (x) { return order(x) > at; })[0];
    if (d) pairs.push({ trigger: t, dialog: d });
  });

  let seq = Math.floor(Math.random() * 1e6);
  dialogs.forEach(function (d) {
    if (d.getAttribute("data-bk-modal-init") === "1") return;
    d.setAttribute("data-bk-modal-init", "1");
    cleanups.push(function () { d.removeAttribute("data-bk-modal-init"); });
    if (!d.id) d.id = "bk-modal-" + ++seq;
    if (!d.getAttribute("aria-modal")) d.setAttribute("aria-modal", "true");
    /* C08 "Labelled by": the dialog is named by its first heading unless it
       already carries a name. Derived per load, like the dialog's own id. */
    const heading = d.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading && !d.getAttribute("aria-labelledby") && !d.getAttribute("aria-label")) {
      const minted = !heading.id;
      if (minted) heading.id = d.id + "-title";
      d.setAttribute("aria-labelledby", heading.id);
      cleanups.push(function () {
        d.removeAttribute("aria-labelledby");
        if (minted) heading.removeAttribute("id");
      });
    }
    const shown = d.style.display && d.style.display !== "none" ? d.style.display : d.getAttribute("data-modal-display") || "flex";
    let openedBy: HTMLElement | null = null;
    let inerted: Element[] = [];
    let restore: (() => void) | null = null;

    function setShown(on: boolean): void {
      d.style.display = on ? shown : "none";
      if (on) d.removeAttribute("hidden");
      pairs.forEach(function (p) {
        if (p.dialog === d) p.trigger.setAttribute("aria-expanded", on ? "true" : "false");
      });
    }

    function open(by: HTMLElement | null): void {
      if (d.style.display !== "none" && openedBy !== null) return;
      openedBy = by;
      setShown(true);
      /* Everything outside the dialog's path to <body> goes inert. */
      inerted = [];
      for (let node: Element | null = d; node && node.parentElement; node = node.parentElement) {
        (Array.prototype.slice.call(node.parentElement.children) as Element[]).forEach(function (sib) {
          if (sib === node || sib.tagName === "SCRIPT" || sib.hasAttribute("inert")) return;
          sib.setAttribute("inert", "");
          sib.setAttribute("aria-hidden", "true");
          inerted.push(sib);
        });
      }
      const first = d.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
      else {
        if (!d.hasAttribute("tabindex")) d.setAttribute("tabindex", "-1");
        d.focus();
      }
      const onKey = function (e: KeyboardEvent): void {
        if (e.key === "Escape" && d.getAttribute("data-modal-escape") !== "false") {
          e.preventDefault();
          close();
          return;
        }
        if (e.key !== "Tab") return;
        const items = (Array.prototype.slice.call(d.querySelectorAll(FOCUSABLE)) as HTMLElement[]);
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        const active = doc.activeElement;
        if (e.shiftKey && (active === firstItem || active === d)) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && active === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      };
      const onClick = function (e: MouseEvent): void {
        const target = e.target as Element | null;
        if (target === d) {
          if (d.getAttribute("data-modal-backdrop") !== "false") close();
          return;
        }
        if (target && target.closest && target.closest("[data-modal-close], .modal-close")) close();
      };
      doc.addEventListener("keydown", onKey, true);
      d.addEventListener("click", onClick);
      restore = function () {
        doc.removeEventListener("keydown", onKey, true);
        d.removeEventListener("click", onClick);
      };
    }

    function close(): void {
      if (restore) restore();
      restore = null;
      inerted.forEach(function (el) {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      });
      inerted = [];
      setShown(false);
      const back = openedBy;
      openedBy = null;
      if (back) back.focus();
    }

    const mine = pairs.filter(function (p) { return p.dialog === d; });
    mine.forEach(function (p) {
      p.trigger.setAttribute("aria-haspopup", "dialog");
      p.trigger.setAttribute("aria-controls", d.id);
    });

    if (!interactive) {
      const reveal = opts.reveal;
      /* Not for a selected trigger: a revealed dialog is a full-page overlay
         and would cover the canvas the moment a modal is inserted. */
      const revealed = Boolean(reveal && (d === reveal || d.contains(reveal)));
      setShown(revealed);
      return;
    }

    setShown(false);
    mine.forEach(function (p) {
      const onOpen = function (e: Event): void {
        e.preventDefault();
        open(p.trigger);
      };
      const onKey = function (e: KeyboardEvent): void {
        if (p.trigger.tagName === "BUTTON" || (e.key !== "Enter" && e.key !== " ")) return;
        onOpen(e);
      };
      p.trigger.addEventListener("click", onOpen);
      p.trigger.addEventListener("keydown", onKey);
      cleanups.push(function () {
        p.trigger.removeEventListener("click", onOpen);
        p.trigger.removeEventListener("keydown", onKey);
      });
    });
    if (d.getAttribute("data-modal-initial") === "open") open(null);
    cleanups.push(function () { if (openedBy !== null || restore) close(); });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
