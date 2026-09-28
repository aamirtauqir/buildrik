/**
 * Accordion runtime for the Accordion / FAQ block (Inspector v4 board 13, Q5).
 *
 * Same single-source model as `sliderRuntime.ts`: ONE function, run directly
 * by the canvas (`editor/canvas/hooks/useAccordionRuntime.ts`) and serialized
 * with `Function.prototype.toString()` into the published page by the
 * dashboard (`lib/publish-widgets.ts`). Keep it free of imports and of any
 * module-level reference — everything it uses is declared inside it.
 *
 * The block's markup: a root carrying `data-allow-multiple`, holding
 * `.accordion-item`s, each a `.accordion-header` button and an
 * `.accordion-content` panel. The type block writes which items start open
 * (`data-accordion-state="open" | "closed"` on the item; an item without it
 * falls back to its `open` class) and whether several may be open at once
 * (`data-allow-multiple`: "true", or present with no value, allows it).
 *
 * Found STRUCTURALLY as well as by class, on purpose: the block keeps its
 * classes in the `class` attribute, which the publish writer drops (it emits
 * only the element's class list) — so on a published page an item is the
 * root's child, its header the first button (or first child), its panel the
 * last child. On the canvas, where "false"-valued attributes are not emitted,
 * the root is found by its `data-buildrick-type`.
 *
 * The runtime applies that state (panel height, `aria-expanded`) and, on a
 * published page, toggles an item when its header is clicked — closing the
 * others unless several may be open. The canvas passes `interactive: false`:
 * a click there selects, it does not toggle.
 *
 * Idempotent per accordion (`data-bk-accordion-init`); returns a cleanup that
 * removes every listener it added.
 *
 * @license BSD-3-Clause
 */

export interface AccordionRuntimeOptions {
  /** false on the canvas: show the saved open/closed state, no click toggling. */
  interactive?: boolean;
}

export function initAccordionRuntime(root: ParentNode, opts: AccordionRuntimeOptions = {}): () => void {
  const cleanups: Array<() => void> = [];
  const interactive = opts.interactive !== false;

  function kids(parent: Element): HTMLElement[] {
    return Array.prototype.slice.call(parent.children) as HTMLElement[];
  }
  function headerOf(item: Element): HTMLElement | undefined {
    const all = kids(item);
    return (
      all.filter(function (c) { return c.classList.contains("accordion-header"); })[0] ||
      all.filter(function (c) { return c.tagName === "BUTTON"; })[0] ||
      all[0]
    );
  }
  function panelOf(item: Element): HTMLElement | undefined {
    const all = kids(item);
    const byClass = all.filter(function (c) { return c.classList.contains("accordion-content"); })[0];
    const last = all[all.length - 1];
    return byClass || (last && last !== headerOf(item) ? last : undefined);
  }

  const accordions = root.querySelectorAll<HTMLElement>('[data-allow-multiple], [data-buildrick-type="accordion"]');
  accordions.forEach(function (acc) {
    if (acc.getAttribute("data-bk-accordion-init") === "1") return;
    const classed = kids(acc).filter(function (c) { return c.classList.contains("accordion-item"); });
    const items = classed.length > 0 ? classed : kids(acc);
    if (items.length === 0) return;
    acc.setAttribute("data-bk-accordion-init", "1");
    const flag = acc.getAttribute("data-allow-multiple");
    const allowMultiple = flag === "" || flag === "true";

    function savedOpen(item: HTMLElement): boolean {
      const state = item.getAttribute("data-accordion-state");
      return state ? state === "open" : item.classList.contains("open");
    }

    function apply(item: HTMLElement, open: boolean): void {
      item.classList.toggle("open", open);
      const header = headerOf(item);
      const panel = panelOf(item);
      if (header) header.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) {
        panel.style.overflow = "hidden";
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
        if (open) panel.removeAttribute("aria-hidden");
        else panel.setAttribute("aria-hidden", "true");
      }
    }

    let seenOpen = false;
    items.forEach(function (item) {
      /* With one-at-a-time, only the first item saved open stays open. */
      const open = savedOpen(item) && (allowMultiple || !seenOpen);
      if (open) seenOpen = true;
      apply(item, open);
    });

    if (!interactive) return;
    items.forEach(function (item) {
      const header = headerOf(item);
      if (!header) return;
      const onClick = function (): void {
        const open = !item.classList.contains("open");
        if (open && !allowMultiple) {
          items.forEach(function (other) {
            if (other !== item) apply(other, false);
          });
        }
        apply(item, open);
      };
      header.addEventListener("click", onClick);
      cleanups.push(function () {
        header.removeEventListener("click", onClick);
      });
    });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
