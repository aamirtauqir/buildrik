import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ExportSection } from "../ExportSection";
import { TokenRegistryProvider } from "@/editor/design-system/state/TokenRegistryContext";
import { ToastProvider } from "@/editor/chrome-ui";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider>{ui}</TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:mock",
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined,
    });
  }
});

/** Opens the Export tab and picks a format. */
function exportTab(u: ReturnType<typeof render>, format?: "css" | "json" | "tailwind") {
  fireEvent.click(u.getByTestId("brand-io-tab-export"));
  if (format) fireEvent.click(u.getByTestId(`format-row-${format}`));
}

describe("ExportSection — Import | Export (2L9 B6-B15 / B6-B48)", () => {
  it("opens on Import; the tabs switch", () => {
    const u = render(wrap(<ExportSection />));
    expect(u.getByTestId("brand-io-tab-import").getAttribute("aria-selected")).toBe("true");
    expect(u.getByTestId("brand-import")).toBeTruthy();
    exportTab(u);
    expect(u.getByTestId("brand-export")).toBeTruthy();
    expect(u.queryByTestId("brand-import")).toBeNull();
  });

  it("Format offers CSS variables, JSON and Tailwind config — no Figma row", () => {
    const u = render(wrap(<ExportSection />));
    exportTab(u);
    expect(["css", "json", "tailwind"].map((id) => u.getByTestId(`format-row-${id}`).textContent)).toEqual([
      "CSS variables", "JSON tokens", "Tailwind config",
    ]);
    expect(u.container.textContent).not.toMatch(/Figma Variables JSON/);
  });

  it("CSS shows the :root block with its dark block, and '{n} tokens · includes dark values.'", () => {
    const u = render(wrap(<ExportSection />));
    exportTab(u);
    const preview = u.getByTestId("export-preview").textContent ?? "";
    expect(preview).toContain(":root");
    expect(preview).toContain("@media (prefers-color-scheme: dark)");
    expect(u.getByTestId("export-stats").textContent).toMatch(/^\d+ tokens · includes dark values\.$/);
  });

  it("JSON is an array, Tailwind a JS module that says it drops dark values", () => {
    const u = render(wrap(<ExportSection />));
    exportTab(u, "json");
    expect(u.getByTestId("export-preview").textContent?.trim().startsWith("[")).toBe(true);
    fireEvent.click(u.getByTestId("format-row-tailwind"));
    expect(u.getByTestId("export-preview").textContent).toContain("module.exports");
    expect(u.getByTestId("export-stats").textContent).toMatch(/Tailwind config can’t carry dark values; \d+ (is|are) left out\./);
  });

  it("dark strategy is a menu on CSS: a pick swaps @media for :root[data-theme]", () => {
    const u = render(wrap(<ExportSection />));
    exportTab(u);
    expect(u.getByTestId("brand-export-dark-value").textContent).toBe("media-query");
    fireEvent.click(u.getByTestId("brand-export-dark-trigger"));
    fireEvent.click(u.getByTestId("brand-export-dark-option-data-attr"));
    expect(u.getByTestId("brand-export-dark-value").textContent).toBe("data-attr");
    const preview = u.getByTestId("export-preview").textContent ?? "";
    expect(preview).toContain(':root[data-theme="dark"]');
    expect(preview).not.toContain("@media (prefers-color-scheme: dark)");
    fireEvent.click(u.getByTestId("format-row-json"));
    expect(u.queryByTestId("brand-export-dark-row")).toBeNull();
  });

  it("Download names the file type and downloads it, with the Export ready toast", async () => {
    const clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === "a") Object.defineProperty(el, "click", { value: clickSpy, configurable: true });
      return el;
    });
    const u = render(wrap(<ExportSection />));
    exportTab(u);
    const download = u.getByTestId("brand-format-download-css");
    expect(download.textContent).toBe("Download .css");
    fireEvent.click(download);
    expect(clickSpy).toHaveBeenCalled();
    expect(await u.findByText("Export ready")).toBeTruthy();
    createSpy.mockRestore();
    fireEvent.click(u.getByTestId("format-row-tailwind"));
    expect(u.getByTestId("brand-format-download-tailwind").textContent).toBe("Download .js");
  });
});
