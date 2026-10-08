/**
 * Theme-toggle block (spec §2, D12; board BRP1-M12). A group carrying
 * `data-bk-theme-toggle` holds a Light and a Dark segment (`data-bk-tt`); a
 * click on a segment sets `data-theme` on <html> to it (a click elsewhere on
 * the group flips) and remembers the visitor's choice in localStorage. The
 * segment for the current theme is filled with the site's Primary by
 * `themeToggleCss("show")` — the theme decides, so no script runs for it. A tiny boot script in <head> applies a stored choice before
 * first paint (no flash). Same single-source model as `interactionRuntime.ts`:
 * the runtime function is serialized into the page, so it must not reference
 * anything outside itself — its literals repeat the constants below on purpose.
 *
 * Off sites: every toggle is hidden on export/publish (`themeToggleCss("hide")`)
 * and listed as a Brand check; the canvas still shows it, dimmed
 * (`themeToggleCss("dimmed")`), with the inspector's note.
 *
 * @license BSD-3-Clause
 */

export const THEME_TOGGLE_ATTR = "data-bk-theme-toggle";
export const THEME_TOGGLE_ICON_ATTR = "data-bk-tt";
const THEME_STORAGE_KEY = "buildrick-theme";

export function initThemeToggleRuntime(root: ParentNode): () => void {
  const html = document.documentElement;
  const current = (): "light" | "dark" => {
    const set = html.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const sync = () => {
    const mode = current();
    root.querySelectorAll("[data-bk-theme-toggle] [data-bk-tt]").forEach((b) =>
      b.setAttribute("aria-pressed", b.getAttribute("data-bk-tt") === mode ? "true" : "false"),
    );
  };
  const onClick = (e: Event) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || !target.closest("[data-bk-theme-toggle]")) return;
    const picked = target.closest("[data-bk-tt]")?.getAttribute("data-bk-tt");
    const next = picked === "light" || picked === "dark" ? picked : current() === "dark" ? "light" : "dark";
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

const SEGMENT = (mode: "light" | "dark") => `[${THEME_TOGGLE_ATTR}] [${THEME_TOGGLE_ICON_ATTR}="${mode}"]`;
/* The current theme's segment: the site's Primary, bound with no fallback. */
const ACTIVE =
  "{background-color:var(--buildrick-design-color-primary)!important;" +
  "color:var(--buildrick-design-color-on-primary)!important;" +
  "border-color:var(--buildrick-design-color-primary)!important}";

/** `show`: the current theme's segment is filled — an explicit choice wins,
 *  else the visitor's OS. `hide`: an Off site's published page. `dimmed`: an
 *  Off site's canvas (BRP1-M12 off-hidden-on-publish). */
export function themeToggleCss(state: "show" | "hide" | "dimmed"): string {
  if (state === "hide") return "\n[data-bk-theme-toggle]{display:none!important}\n";
  const show =
    `\n:root[data-theme="light"] ${SEGMENT("light")}${ACTIVE}` +
    `:root[data-theme="dark"] ${SEGMENT("dark")}${ACTIVE}` +
    `@media (prefers-color-scheme: light){:root:not([data-theme]) ${SEGMENT("light")}${ACTIVE}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme]) ${SEGMENT("dark")}${ACTIVE}}\n`;
  return state === "dimmed" ? `${show}[${THEME_TOGGLE_ATTR}]{opacity:0.35}\n` : show;
}

export function siteHasThemeToggle(elements: readonly { getAttribute(name: string): string | undefined }[]): boolean {
  return elements.some((el) => el.getAttribute(THEME_TOGGLE_ATTR) !== undefined);
}
