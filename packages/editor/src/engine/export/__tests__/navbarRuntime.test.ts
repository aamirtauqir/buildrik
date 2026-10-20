/**
 * R4 P0 #4 (REA audit 2026-10-20): the Navbar block had no mobile menu — at
 * 375px its links overflowed, the page scrolled sideways and the last link was
 * clipped.
 *
 * Markup is the Navbar block's as exported (blocks/Sections/Navbar.tsx). jsdom
 * evaluates no media queries, so the collapse itself is proven in a real
 * browser by the R4 harness; these pin the behaviour and the breakpoint.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { initNavbarRuntime, NAVBAR_RUNTIME_CSS } from "../navbarRuntime";
import { injectPageRuntimes } from "../publishPostProcess";
import { BREAKPOINT_QUERIES } from "@/shared/constants/breakpoints";

const NAV = `<nav class="n">
  <div><span>Logo</span></div>
  <div class="links"><a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a></div>
</nav>`;

const nav = () => document.querySelector<HTMLElement>("nav")!;
const toggle = () => document.querySelector<HTMLButtonElement>("nav button")!;
const links = () => document.querySelector<HTMLElement>(".links")!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initNavbarRuntime", () => {
  it("adds one accessible menu button that controls the links", () => {
    document.body.innerHTML = NAV;
    initNavbarRuntime(document);
    initNavbarRuntime(document);
    expect(document.querySelectorAll("nav button")).toHaveLength(1);
    expect(toggle().type).toBe("button");
    expect(toggle().getAttribute("aria-label")).toBe("Menu");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(toggle().getAttribute("aria-controls")).toBe(links().id);
  });

  it("the button opens and closes the menu", () => {
    document.body.innerHTML = NAV;
    initNavbarRuntime(document);
    toggle().click();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(nav().classList.contains("bk-nav-open")).toBe(true);
    toggle().click();
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(nav().classList.contains("bk-nav-open")).toBe(false);
  });

  it("Escape closes an open menu and returns focus to the button", () => {
    document.body.innerHTML = NAV;
    initNavbarRuntime(document);
    toggle().click();
    links().querySelector("a")!.focus();
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle());
  });

  it("choosing a link closes the menu", () => {
    document.body.innerHTML = NAV;
    initNavbarRuntime(document);
    toggle().click();
    links().querySelector("a")!.click();
    expect(nav().classList.contains("bk-nav-open")).toBe(false);
  });

  it("leaves a nav that is only a list of links alone", () => {
    document.body.innerHTML = '<nav><a href="#">A</a><a href="#">B</a></nav>';
    initNavbarRuntime(document);
    expect(document.querySelector("nav button")).toBeNull();
  });
});

describe("NAVBAR_RUNTIME_CSS", () => {
  it("collapses at the editor's own mobile breakpoint", () => {
    expect(NAVBAR_RUNTIME_CSS).toContain(`@media ${BREAKPOINT_QUERIES.mobile}`);
  });

  it("respects prefers-reduced-motion (no transition anywhere)", () => {
    expect(NAVBAR_RUNTIME_CSS).not.toMatch(/transition|animation/);
  });
});

describe("injectPageRuntimes — navbar", () => {
  it("injects the navbar runtime + CSS only on a page with a nav, and the injected script works", () => {
    const plain = "<html><body><p>hi</p></body></html>";
    expect(injectPageRuntimes(plain)).toBe(plain);
    const out = injectPageRuntimes(`<html><body>${NAV}</body></html>`);
    expect(out).toContain("<style data-buildrick-navbar-runtime>");
    expect(out).toContain("<script data-buildrick-navbar-runtime>");
    expect(injectPageRuntimes(out)).toBe(out);

    document.body.innerHTML = out.slice(out.indexOf("<body>") + 6, out.indexOf("</body>"));
    for (const s of Array.from(document.querySelectorAll("script"))) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(s.textContent ?? "")();
    }
    toggle().click();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });
});
