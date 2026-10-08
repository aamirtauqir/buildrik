// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initThemeToggleRuntime, THEME_BOOT_SCRIPT, themeToggleCss, siteHasThemeToggle } from "../themeToggleRuntime";

const prefersDark = (dark: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: dark && q.includes("dark") }));

let dispose: () => void = () => {};
afterEach(() => dispose());

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
  document.body.innerHTML = `<div data-bk-theme-toggle="true" role="group"><button data-bk-tt="light">Light</button><button data-bk-tt="dark">Dark</button></div>`;
});

describe("theme toggle runtime (spec D12, test 22)", () => {
  const seg = (mode: "light" | "dark") => document.querySelector<HTMLElement>(`[data-bk-tt="${mode}"]`)!;

  it("a segment picks its theme, persists the choice and reports it (M12 published-dark)", () => {
    prefersDark(false);
    dispose = initThemeToggleRuntime(document);
    expect(seg("light").getAttribute("aria-pressed")).toBe("true");
    seg("dark").click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("buildrick-theme")).toBe("dark");
    expect(seg("dark").getAttribute("aria-pressed")).toBe("true");
    expect(seg("light").getAttribute("aria-pressed")).toBe("false");
    seg("dark").click(); // the current segment again keeps the theme
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    seg("light").click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("reports the visitor's OS theme before any choice (M12 published-auto)", () => {
    prefersDark(true);
    dispose = initThemeToggleRuntime(document);
    expect(seg("dark").getAttribute("aria-pressed")).toBe("true");
    seg("light").click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("the boot script applies a stored choice before paint (no flash)", () => {
    localStorage.setItem("buildrick-theme", "dark");
    new Function(THEME_BOOT_SCRIPT.replace(/^<script[^>]*>|<\/script>$/g, ""))();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("the boot script ignores anything that is not light or dark", () => {
    localStorage.setItem("buildrick-theme", "purple");
    new Function(THEME_BOOT_SCRIPT.replace(/^<script[^>]*>|<\/script>$/g, ""))();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("serializes without module references", () => {
    expect(initThemeToggleRuntime.toString()).not.toMatch(/THEME_|import\(|require\(/);
  });

  it("hide CSS hides every toggle; show CSS fills the current theme's segment; the Off canvas dims it", () => {
    expect(themeToggleCss("hide")).toContain("[data-bk-theme-toggle]{display:none!important}");
    const show = themeToggleCss("show");
    expect(show).toContain(':root[data-theme="dark"] [data-bk-theme-toggle] [data-bk-tt="dark"]{background-color:var(--buildrick-design-color-primary)!important;color:var(--buildrick-design-color-on-primary)!important;border-color:var(--buildrick-design-color-primary)!important}');
    expect(show).toContain(':root[data-theme="light"] [data-bk-theme-toggle] [data-bk-tt="light"]{background-color:var(--buildrick-design-color-primary)!important;color:var(--buildrick-design-color-on-primary)!important;border-color:var(--buildrick-design-color-primary)!important}');
    expect(show).toContain('@media (prefers-color-scheme: dark){:root:not([data-theme]) [data-bk-theme-toggle] [data-bk-tt="dark"]{background-color:var(--buildrick-design-color-primary)!important;color:var(--buildrick-design-color-on-primary)!important;border-color:var(--buildrick-design-color-primary)!important}}');
    expect(show).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(themeToggleCss("dimmed")).toContain("[data-bk-theme-toggle]{opacity:0.35}");
  });

  it("finds a toggle on any page", () => {
    const el = (attrs: Record<string, string>) => ({ getAttribute: (n: string) => attrs[n] });
    expect(siteHasThemeToggle([el({}), el({ "data-bk-theme-toggle": "true" })])).toBe(true);
    expect(siteHasThemeToggle([el({})])).toBe(false);
  });
});
