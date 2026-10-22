/**
 * Modal runtime for the Modal / Dialog block (`blocks/Components/Modal.tsx`).
 *
 * Same single-source model as `accordionRuntime.ts`: one import-free function,
 * serialized with `Function.prototype.toString()` into the shipped page by
 * `publishPostProcess.ts` (Publish and the ZIP export). Keep everything it uses
 * declared inside it.
 *
 * Until 2026-10-20 nothing wired the trigger, and the overlay is hidden by a
 * static per-element `display:none`, so the dialog could never open on a
 * published site (REA audit R4 P0 #3).
 *
 * Markup, read structurally (no editor attributes): a `.modal-trigger` button
 * followed by its `[role="dialog"]` overlay (or the one its `aria-controls`
 * names), holding an optional `.modal-close` button.
 *
 * Open: shows the overlay, locks page scroll, moves focus to the first
 * focusable inside and traps Tab there. Close (Esc, the close button, a click
 * on the backdrop): hides it and returns focus to the trigger. Adds no
 * animation, so there is nothing for prefers-reduced-motion to turn off.
 *
 * Idempotent per trigger (`data-bk-modal-init`); returns a cleanup that
 * removes every listener it added.
 *
 * @license BSD-3-Clause
 */
export function initModalRuntime(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  const triggers = root.querySelectorAll<HTMLElement>(".modal-trigger");
  triggers.forEach(function (trigger, index) {
    if (trigger.getAttribute("data-bk-modal-init") === "1") return;
    const doc = trigger.ownerDocument;
    const controls = trigger.getAttribute("aria-controls");
    const next = trigger.nextElementSibling as HTMLElement | null;
    const overlay = controls
      ? doc.getElementById(controls)
      : next && next.getAttribute("role") === "dialog"
        ? next
        : null;
    if (!overlay) return;
    trigger.setAttribute("data-bk-modal-init", "1");

    const base = "bk-modal-" + index;
    if (!overlay.id) overlay.id = base;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", overlay.id);
    trigger.setAttribute("aria-expanded", "false");
    const heading = overlay.querySelector<HTMLElement>("h1,h2,h3,h4,h5,h6");
    if (heading && !overlay.hasAttribute("aria-labelledby") && !overlay.hasAttribute("aria-label")) {
      if (!heading.id) heading.id = base + "-title";
      overlay.setAttribute("aria-labelledby", heading.id);
    }
    const closeBtn = overlay.querySelector<HTMLElement>(".modal-close");
    if (closeBtn && !closeBtn.hasAttribute("aria-label")) closeBtn.setAttribute("aria-label", "Close");

    let open = false;
    let prevOverflow = "";

    function focusables(): HTMLElement[] {
      return Array.prototype.slice.call(overlay!.querySelectorAll(FOCUSABLE)) as HTMLElement[];
    }

    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        hide();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = doc.activeElement;
      if (e.shiftKey && (active === first || !overlay!.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !overlay!.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    function show(): void {
      if (open) return;
      open = true;
      overlay!.style.display = "flex";
      overlay!.removeAttribute("aria-hidden");
      trigger.setAttribute("aria-expanded", "true");
      prevOverflow = doc.body.style.overflow;
      doc.body.style.overflow = "hidden";
      doc.addEventListener("keydown", onKey);
      const items = focusables();
      if (items.length > 0) items[0].focus();
      else {
        overlay!.tabIndex = -1;
        overlay!.focus();
      }
    }

    function hide(): void {
      if (!open) return;
      open = false;
      overlay!.style.display = "none";
      overlay!.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-expanded", "false");
      doc.body.style.overflow = prevOverflow;
      doc.removeEventListener("keydown", onKey);
      trigger.focus();
    }

    const onBackdrop = function (e: Event): void {
      if (e.target === overlay) hide();
    };
    trigger.addEventListener("click", show);
    overlay.addEventListener("click", onBackdrop);
    if (closeBtn) closeBtn.addEventListener("click", hide);
    cleanups.push(function () {
      trigger.removeEventListener("click", show);
      overlay.removeEventListener("click", onBackdrop);
      if (closeBtn) closeBtn.removeEventListener("click", hide);
      doc.removeEventListener("keydown", onKey);
    });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
