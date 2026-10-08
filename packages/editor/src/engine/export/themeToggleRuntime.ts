/**
 * Theme-toggle block (spec §2, D12). A button carrying `data-bk-theme-toggle`
 * flips `data-theme` on <html> and remembers the visitor's choice in
 * localStorage. A tiny boot script in <head> applies a stored choice before
 * first paint (no flash). Same single-source model as `interactionRuntime.ts`:
 * the runtime function is serialized into the page, so it must not reference
 * anything outside itself — its literals repeat the constants below on purpose.
 *
 * Off sites: every toggle is hidden on export/publish (`themeToggleCss("hide")`)
 * and listed as a Brand check; the canvas still shows it, with the board's note.
 *
 * @license BSD-3-Clause
 */

export const THEME_TOGGLE_ATTR = "data-bk-theme-toggle";
const THEME_TOGGLE_ICON_ATTR = "data-bk-tt";
const THEME_STORAGE_KEY = "buildrick-theme";

export function initThemeToggleRuntime(root: ParentNode): () => void {
  const html = document.documentElement;
  const current = (): "light" | "dark" => {
    const set = html.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const sync = () => {
    const pressed = current() === "dark" ? "true" : "false";
    root.querySelectorAll("[data-bk-theme-toggle]").forEach((b) => b.setAttribute("aria-pressed", pressed));
  };
  const onClick = (e: Event) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || !target.closest("[data-bk-theme-toggle]")) return;
    const next = current() === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try {
      localStorage.setItem("buildrick-theme", next);
    } catch (_) {
      /* storage blocked (private mode): the choice lasts this page view */
    }
    sync();
  };
  root.addEventListener("click", onClick);
  sync();
  return () => root.removeEventListener("click", onClick);
}

export const THEME_BOOT_SCRIPT =
  `<script data-buildrick-theme-boot>try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");` +
  'if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>';

export function buildThemeToggleRuntimeScript(): string {
  const call = `(${initThemeToggleRuntime.toString()})(document);`;
  return (
    `<script data-buildrick-theme-toggle-runtime>(function(){if(document.readyState==="loading"){` +
    `document.addEventListener("DOMContentLoaded",function(){${call}});}else{${call}}})();</script>`
  );
}

const DARK = '[data-theme="dark"]';
const OS_DARK_SCOPE = ':root:not([data-theme="light"])';
const ICON = (mode: "light" | "dark") => `[${THEME_TOGGLE_ATTR}] [${THEME_TOGGLE_ICON_ATTR}="${mode}"]`;

export function themeToggleCss(state: "show" | "hide"): string {
  if (state === "hide") return "\n[data-bk-theme-toggle]{display:none!important}\n";
  return (
    `\n${ICON("dark")}{display:none!important}` +
    `@media (prefers-color-scheme: dark){${OS_DARK_SCOPE} ${ICON("light")}{display:none!important}${OS_DARK_SCOPE} ${ICON("dark")}{display:inline-flex!important}}` +
    `:root${DARK} ${ICON("light")}{display:none!important}:root${DARK} ${ICON("dark")}{display:inline-flex!important}\n`
  );
}

export function siteHasThemeToggle(elements: readonly { getAttribute(name: string): string | undefined }[]): boolean {
  return elements.some((el) => el.getAttribute(THEME_TOGGLE_ATTR) !== undefined);
}
