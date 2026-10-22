/**
 * Tabs runtime for the Tabs block (`blocks/Components/Tabs.tsx`).
 *
 * Same single-source model as `accordionRuntime.ts`: one import-free function,
 * serialized with `Function.prototype.toString()` into the shipped page by
 * `publishPostProcess.ts` (Publish and the ZIP export). Keep everything it uses
 * declared inside it.
 *
 * Until 2026-10-20 nothing shipped for tabs, so clicking a tab on a published
 * site did nothing (REA audit R4 P0 #2).
 *
 * Markup, read structurally (no editor attributes): a `[role="tablist"]` of
 * `[role="tab"]`s, whose parent holds the `[role="tabpanel"]`s in the same
 * order. The per-element stylesheet hides the inactive panels, so selection is
 * applied with inline styles; the tab's active look (colour, weight, bottom
 * border) is copied from the tab that was active at load.
 *
 * Keyboard: WAI-ARIA tabs pattern with automatic activation — roving tabindex,
 * Left/Right (Up/Down too) wrap, Home/End. Adds no animation, so there is
 * nothing for prefers-reduced-motion to turn off.
 *
 * Idempotent per tablist (`data-bk-tabs-init`); returns a cleanup that removes
 * every listener it added.
 *
 * @license BSD-3-Clause
 */
export function initTabsRuntime(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  const LOOK = ["color", "fontWeight", "borderBottomColor"] as const;

  const lists = root.querySelectorAll<HTMLElement>('[role="tablist"]');
  lists.forEach(function (list, listIndex) {
    if (list.getAttribute("data-bk-tabs-init") === "1") return;
    const wrapper = list.parentElement;
    const tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const panels = wrapper
      ? (Array.prototype.slice.call(wrapper.children) as HTMLElement[]).filter(function (c) {
          return c.getAttribute("role") === "tabpanel";
        })
      : [];
    if (tabs.length === 0 || panels.length === 0) return;
    list.setAttribute("data-bk-tabs-init", "1");

    let current = 0;
    tabs.forEach(function (t, i) {
      if (t.getAttribute("aria-selected") === "true") current = i;
    });
    const win = list.ownerDocument.defaultView;
    const looks = function (el: HTMLElement | undefined): Record<string, string> | null {
      if (!el || !win) return null;
      const cs = win.getComputedStyle(el);
      const out: Record<string, string> = {};
      LOOK.forEach(function (k) { out[k] = cs[k]; });
      return out;
    };
    const onLook = looks(tabs[current]);
    const offLook = looks(tabs[current === 0 ? 1 : 0]);
    const shownDisplay = (win && win.getComputedStyle(panels[current]).display) || "block";

    tabs.forEach(function (tab, i) {
      const base = "bk-tabs-" + listIndex + "-" + i;
      if (!tab.id) tab.id = base + "-tab";
      const panel = panels[i];
      if (!panel) return;
      if (!panel.id) panel.id = base + "-panel";
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
    });

    function select(index: number, focus: boolean): void {
      current = index;
      tabs.forEach(function (tab, i) {
        const on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        tab.classList.toggle("active", on);
        const look = on ? onLook : offLook;
        if (look) LOOK.forEach(function (k) { tab.style[k] = look[k]; });
        const panel = panels[i];
        if (panel) {
          panel.classList.toggle("active", on);
          panel.hidden = !on;
          panel.style.display = on ? (shownDisplay === "none" ? "block" : shownDisplay) : "none";
        }
      });
      if (focus) tabs[index].focus();
    }
    select(current, false);

    tabs.forEach(function (tab, i) {
      const onClick = function (): void { select(i, false); };
      const onKey = function (e: KeyboardEvent): void {
        const n = tabs.length;
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + n) % n;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = n - 1;
        if (next < 0) return;
        e.preventDefault();
        select(next, true);
      };
      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKey);
      cleanups.push(function () {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKey);
      });
    });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
