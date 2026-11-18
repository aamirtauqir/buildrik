/**
 * Mobile menu for the Navbar block (`blocks/Sections/Navbar.tsx`).
 *
 * Same single-source model as `accordionRuntime.ts`: one import-free function,
 * serialized with `Function.prototype.toString()` into the shipped page by
 * `publishPostProcess.ts` (Publish and the ZIP export), with the CSS below.
 *
 * Until 2026-10-20 the navbar had no mobile menu: at 375px its links
 * overflowed, the page scrolled sideways and the last link was clipped (REA
 * audit R4 P0 #4).
 *
 * Markup, read structurally (no editor attributes): a `<nav>` with at least two
 * element children, one of which holds two or more links. The runtime marks
 * the nav and that links group with classes and appends a menu button
 * (`aria-expanded`, `aria-controls`). Below the mobile breakpoint the CSS hides
 * the links and shows the button; open, the links stack on their own row.
 * Esc or choosing a link closes it. A nav that already has an `aria-expanded`
 * control, or is only a list of links, is left alone.
 *
 * Idempotent per nav (`data-bk-nav-init`); returns a cleanup that removes the
 * button and every listener it added.
 *
 * @license BSD-3-Clause
 */

/** Collapse rules. The query is `BREAKPOINT_QUERIES.mobile`
 *  (`shared/constants/breakpoints.ts` — kept literal so this file stays
 *  import-free for the dashboard; a test pins the two together). Rules sit one
 *  class deeper than the per-element `.buildrick-*` rules they override. No
 *  transition or animation, so prefers-reduced-motion has nothing to stop. */
export const NAVBAR_RUNTIME_CSS =
  ".bk-nav-toggle{display:none}" +
  "@media (max-width: 767px){" +
  "nav.bk-nav{flex-wrap:wrap}" +
  "nav.bk-nav .bk-nav-toggle{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;" +
  "gap:4px;width:40px;height:40px;margin-left:auto;padding:0;border:0;background:transparent;color:inherit;cursor:pointer}" +
  "nav.bk-nav .bk-nav-toggle span{display:block;width:20px;height:2px;background:currentColor}" +
  "nav.bk-nav .bk-nav-links{display:none}" +
  "nav.bk-nav.bk-nav-open .bk-nav-links{display:flex;flex-direction:column;flex-basis:100%;width:100%;gap:12px;padding-top:12px}" +
  "}";

export function initNavbarRuntime(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];

  const navs = root.querySelectorAll<HTMLElement>("nav");
  navs.forEach(function (nav, index) {
    if (nav.getAttribute("data-bk-nav-init") === "1") return;
    if (nav.querySelector("[aria-expanded]")) return;
    const kids = Array.prototype.slice.call(nav.children) as HTMLElement[];
    if (kids.length < 2) return;
    const links = kids.filter(function (c) {
      return c.querySelectorAll("a").length >= 2;
    })[0];
    if (!links) return;
    nav.setAttribute("data-bk-nav-init", "1");
    const doc = nav.ownerDocument;

    if (!links.id) links.id = "bk-nav-links-" + index;
    nav.classList.add("bk-nav");
    links.classList.add("bk-nav-links");

    const toggle = doc.createElement("button");
    toggle.type = "button";
    toggle.className = "bk-nav-toggle";
    toggle.setAttribute("aria-label", "Menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", links.id);
    for (let i = 0; i < 3; i++) {
      const bar = doc.createElement("span");
      bar.setAttribute("aria-hidden", "true");
      toggle.appendChild(bar);
    }
    nav.appendChild(toggle);

    function setOpen(open: boolean): void {
      nav.classList.toggle("bk-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    const onToggle = function (): void {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    };
    const onKey = function (e: KeyboardEvent): void {
      if (e.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
      setOpen(false);
      toggle.focus();
    };
    const onLink = function (e: Event): void {
      const target = e.target as Element | null;
      if (target && target.closest && target.closest("a")) setOpen(false);
    };
    toggle.addEventListener("click", onToggle);
    links.addEventListener("click", onLink);
    doc.addEventListener("keydown", onKey);
    cleanups.push(function () {
      toggle.removeEventListener("click", onToggle);
      links.removeEventListener("click", onLink);
      doc.removeEventListener("keydown", onKey);
      toggle.remove();
    });
  });

  return function () {
    cleanups.forEach(function (fn) { fn(); });
  };
}
