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
  document.body.innerHTML = `<button data-bk-theme-toggle="true"><span data-bk-tt="light"></span><span data-bk-tt="dark"></span></button>`;
});

describe("theme toggle runtime (spec D12, test 22)", () => {
  it("flips data-theme from the OS default, persists the choice and reports it", () => {
    prefersDark(false);
    dispose = initThemeToggleRuntime(document);
    const btn = document.querySelector("button")!;
    btn.click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("buildrick-theme")).toBe("dark");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    btn.querySelector("span")!.click(); // a click on the icon counts
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("starts from dark when the visitor's OS is dark", () => {
    prefersDark(true);
    dispose = initThemeToggleRuntime(document);
    document.querySelector("button")!.click();
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

  it("hide CSS hides every toggle; show CSS swaps the icons by theme", () => {
    expect(themeToggleCss("hide")).toContain("[data-bk-theme-toggle]{display:none!important}");
    expect(themeToggleCss("show")).toContain(':root[data-theme="dark"] [data-bk-theme-toggle] [data-bk-tt="light"]{display:none!important}');
  });

  it("finds a toggle on any page", () => {
    const el = (attrs: Record<string, string>) => ({ getAttribute: (n: string) => attrs[n] });
    expect(siteHasThemeToggle([el({}), el({ "data-bk-theme-toggle": "true" })])).toBe(true);
    expect(siteHasThemeToggle([el({})])).toBe(false);
  });
});
