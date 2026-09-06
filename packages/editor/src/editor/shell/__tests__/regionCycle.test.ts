/**
 * regionCycle tests — F6/⇧F6 region navigation (keyboard board 58:2):
 * board order, wrap-around, hidden regions dropping out, focus placement.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cycleRegion, visibleRegions } from "../regionCycle";

function buildShell({ drawerClosed = false, pageTabs = true, inspector = true } = {}) {
  document.body.innerHTML = `
    <div role="banner"><button id="topbar-btn">t</button></div>
    <div class="ls-rail"><button id="rail-btn">r</button></div>
    <div class="ls-panel${drawerClosed ? " ls-panel--closed" : ""}"><button id="drawer-btn">d</button></div>
    ${pageTabs ? '<div role="tablist" aria-label="Site pages"><button id="tab-btn">p</button></div>' : ""}
    <div id="layout-canvas"></div>
    ${inspector ? '<div class="bdi-panel"><button id="insp-btn">i</button></div>' : ""}
    <div role="contentinfo"><button id="footer-btn">f</button></div>
  `;
  // jsdom: offsetParent is null for everything — patch it so isVisible passes.
  for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
    Object.defineProperty(el, "offsetParent", { get: () => document.body, configurable: true });
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("visibleRegions", () => {
  it("returns the full board order when everything is visible", () => {
    buildShell();
    const ids = visibleRegions().map((r) => r.getAttribute("role") ?? r.className ?? r.id);
    expect(visibleRegions()).toHaveLength(7);
    expect(ids[0]).toBe("banner");
    expect(ids[6]).toBe("contentinfo");
  });

  it("drops the closed drawer out of the cycle (board note)", () => {
    buildShell({ drawerClosed: true });
    const classes = visibleRegions().map((r) => r.className);
    expect(classes.some((c) => c.includes("ls-panel"))).toBe(false);
  });
});

describe("cycleRegion", () => {
  it("F6 from nowhere focuses region 1 (topbar)", () => {
    buildShell();
    const region = cycleRegion(1);
    expect(region?.getAttribute("role")).toBe("banner");
    expect(document.activeElement?.id).toBe("topbar-btn");
  });

  it("cycles 1 → 2 → … and wraps 7 → 1", () => {
    buildShell();
    cycleRegion(1); // topbar
    cycleRegion(1); // rail
    expect(document.activeElement?.id).toBe("rail-btn");
    for (let i = 0; i < 6; i++) cycleRegion(1); // …through footer, then wrap
    expect(document.activeElement?.id).toBe("topbar-btn");
  });

  it("Shift+F6 goes backwards and wraps 1 → 7", () => {
    buildShell();
    cycleRegion(1); // topbar
    cycleRegion(-1);
    expect(document.activeElement?.id).toBe("footer-btn");
  });

  it("focuses the region itself when it has no focusable children", () => {
    buildShell();
    cycleRegion(1); // topbar
    cycleRegion(1); // rail
    cycleRegion(1); // drawer
    cycleRegion(1); // page tabs
    const region = cycleRegion(1); // canvas — empty
    expect(region?.id).toBe("layout-canvas");
    expect(region?.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(region);
  });
});

/* SH-C-16 / SH-C-18: F6 walked regions the user cannot see.
   `offsetParent === null` is true only for display:none, position:fixed and
   detached nodes. Fullpage mode hides the drawer, canvas and inspector with
   `visibility:hidden; position:absolute; width:0; height:0`
   (LayoutShell.css:310-320), so all three stayed in the cycle — and
   `.layout-shell__fullpage`, a real role="region", was not in the list at all,
   so the one region actually on screen was unreachable. */
describe("regionCycle — hidden regions drop out", () => {
  function shell(html: string) {
    document.body.innerHTML = html;
    // jsdom: offsetParent is null for everything — patch it, as buildShell does.
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      Object.defineProperty(el, "offsetParent", { get: () => document.body, configurable: true });
    }
    return document.body;
  }

  it("skips a region hidden the way fullpage mode hides it", () => {
    const root = shell(`
      <header role="banner">a</header>
      <div id="layout-canvas" style="visibility:hidden;position:absolute;width:0;height:0">b</div>
      <footer role="contentinfo">c</footer>
    `);
    const names = visibleRegions(root).map((e) => e.tagName.toLowerCase());
    expect(names).toEqual(["header", "footer"]);
  });

  it("skips a region hidden the way the closed inspector hides it", () => {
    const root = shell(`
      <header role="banner">a</header>
      <div class="bdi-panel" style="opacity:0;width:0">b</div>
      <footer role="contentinfo">c</footer>
    `);
    expect(visibleRegions(root).some((e) => e.classList.contains("bdi-panel"))).toBe(false);
  });

  it("includes the fullpage view, which replaces canvas and inspector", () => {
    const root = shell(`
      <header role="banner">a</header>
      <div id="layout-canvas" style="visibility:hidden;position:absolute;width:0;height:0">b</div>
      <div class="layout-shell__fullpage" role="region" aria-label="Full-page view">c</div>
      <footer role="contentinfo">d</footer>
    `);
    const cls = visibleRegions(root).map((e) => e.className || e.tagName.toLowerCase());
    expect(cls).toContain("layout-shell__fullpage");
    expect(cls.some((c) => c === "layout-canvas")).toBe(false);
  });
});
