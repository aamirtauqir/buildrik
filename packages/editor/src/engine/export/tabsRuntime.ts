/**
 * Tabs runtime (design-2l9 C01 `245:36832`, B-21; model in
 * docs/design-2l9/engine-tabs.md).
 *
 * Same single-source model as `accordionRuntime.ts`: ONE function, run by the
 * canvas (`editor/canvas/hooks/useWidgetRuntimes.ts`) and serialized with
 * `Function.prototype.toString()` into the published page
 * (`lib/publish-widgets.ts`). No imports, no module-level references.
 *
 * A Tabs block is a root holding a `[role="tablist"]` of `[role="tab"]`
 * buttons and `[role="tabpanel"]` panels. Tabs and panels pair by
 * `data-tab-key`; a block saved before the keys existed pairs by position.
 * The root's `data-tabs-initial` names the pair shown first (else the tab
 * marked `aria-selected="true"`, else the first).
 *
 * Until 2026-10-20 nothing shipped for tabs, so clicking a tab on a
 * published site did nothing (REA audit R4 P0 #2). The per-element
 * stylesheet hides the inactive panels, so a shown panel gets the display
 * the initial one had; a tab whose look lives in that stylesheet rather than
 * inline gets the active look (colour, weight, bottom border) copied from the
 * tab that was active at load.
 *
 * Writes the ARIA the pattern needs (ids derived per load — element ids are
 * remapped on duplicate, so none are stored), hides inactive panels, and on a
 * published page activates on click and ArrowLeft / ArrowRight (Up / Down
 * too) / Home / End.
 * The canvas passes `interactive: false` and may `reveal` the panel holding
 * the selection. Idempotent per root; returns a cleanup.
 *
 * @license BSD-3-Clause
 */

export interface TabsRuntimeOptions {
  /** false on the canvas: show the saved initial pair, no switching. */
  interactive?: boolean;
  /** Canvas only: an element whose panel is shown instead (the selection). */
  reveal?: Element | null;
}

export function initTabsRuntime(root: ParentNode, opts: TabsRuntimeOptions = {}): () => void {
  const cleanups: Array<() => void> = [];
  const interactive = opts.interactive !== false;
  let seq = 0;
  const LOOK = ["color", "fontWeight", "borderBottomColor"] as const;

  const lists = root.querySelectorAll<HTMLElement>('[role="tablist"]');
  lists.forEach(function (list) {
    const box = list.parentElement;
    if (!box || box.getAttribute("data-bk-tabs-init") === "1") return;
    const tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const panels = (Array.prototype.slice.call(box.children) as HTMLElement[]).filter(function (c) {
      return c.getAttribute("role") === "tabpanel";
    });
    if (tabs.length === 0 || panels.length === 0) return;
    box.setAttribute("data-bk-tabs-init", "1");
    const n = ++seq + Math.floor(Math.random() * 1e6);

    const keyed = tabs.every(function (t) { return t.getAttribute("data-tab-key"); });
    function panelFor(tab: HTMLElement, i: number): HTMLElement | undefined {
      if (!keyed) return panels[i];
      const key = tab.getAttribute("data-tab-key");
      return panels.filter(function (p) { return p.getAttribute("data-tab-key") === key; })[0];
    }

    /* The block's own look for a selected / unselected tab, as it was saved:
       legacy blocks style each button inline, so switching swaps them. */
    const savedSelected = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
    const onLook = savedSelected ? savedSelected.getAttribute("style") : null;
    const offTab = tabs.filter(function (t) { return t !== savedSelected; })[0];
    const offLook = offTab ? offTab.getAttribute("style") : null;
    const win = box.ownerDocument.defaultView;
    const looks = function (el: HTMLElement | undefined): Record<string, string> | null {
      if (!el || !win) return null;
      const cs = win.getComputedStyle(el);
      const out: Record<string, string> = {};
      LOOK.forEach(function (k) { out[k] = cs[k]; });
      return out;
    };
    const inlineLooks = onLook !== null && offLook !== null;
    const onComputed = interactive && !inlineLooks ? looks(savedSelected || tabs[0]) : null;
    const offComputed = interactive && !inlineLooks ? looks(tabs.filter(function (t) { return t !== (savedSelected || tabs[0]); })[0]) : null;
    let shownDisplay = "block";

    tabs.forEach(function (tab, i) {
      const key = tab.getAttribute("data-tab-key") || "p" + i;
      const tabId = tab.id || "bk-tabs-" + n + "-" + key + "-tab";
      const panel = panelFor(tab, i);
      tab.id = tabId;
      if (panel) {
        const panelId = panel.id || "bk-tabs-" + n + "-" + key + "-panel";
        panel.id = panelId;
        tab.setAttribute("aria-controls", panelId);
        panel.setAttribute("aria-labelledby", tabId);
        panel.setAttribute("tabindex", "0");
      }
    });

    function select(index: number, focus: boolean): void {
      tabs.forEach(function (tab, i) {
        const on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
        tab.classList.toggle("active", on);
        const look = on ? onLook : offLook;
        if (look !== null && inlineLooks) tab.setAttribute("style", look);
        const computed = on ? onComputed : offComputed;
        if (computed) LOOK.forEach(function (k) { tab.style[k] = computed[k]; });
        const panel = panelFor(tab, i);
        if (panel) {
          panel.classList.toggle("active", on);
          if (on) {
            panel.removeAttribute("hidden");
            if (panel.style.display === "none") panel.style.display = "";
            if (win && win.getComputedStyle(panel).display === "none") panel.style.display = shownDisplay;
          } else {
            panel.setAttribute("hidden", "");
            panel.style.display = "none";
          }
        }
      });
      if (focus) tabs[index].focus();
    }

    let start = -1;
    const reveal = opts.reveal;
    if (reveal) {
      tabs.forEach(function (tab, i) {
        const panel = panelFor(tab, i);
        if (panel && (panel === reveal || panel.contains(reveal) || tab === reveal || tab.contains(reveal))) start = i;
      });
    }
    if (start < 0) {
      const initial = box.getAttribute("data-tabs-initial");
      if (initial) {
        tabs.forEach(function (tab, i) {
          if (tab.getAttribute("data-tab-key") === initial) start = i;
        });
      }
    }
    if (start < 0) start = savedSelected ? tabs.indexOf(savedSelected) : 0;
    const loadPanel = panelFor(savedSelected || tabs[0], savedSelected ? tabs.indexOf(savedSelected) : 0);
    const loadDisplay = loadPanel && win ? win.getComputedStyle(loadPanel).display : "";
    if (loadDisplay && loadDisplay !== "none") shownDisplay = loadDisplay;
    select(start, false);

    if (!interactive) {
      cleanups.push(function () { box.removeAttribute("data-bk-tabs-init"); });
      return;
    }
    tabs.forEach(function (tab, i) {
      const onClick = function (): void { select(i, false); };
      const onKey = function (e: KeyboardEvent): void {
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
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
    cleanups.push(function () { box.removeAttribute("data-bk-tabs-init"); });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
