import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ExportSection } from "../ExportSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { DEFAULT_TOKENS } from "../../../constants";

const PROJECT_ID = "export-test";
const STORAGE_KEY = `buildrick-design-tokens-${PROJECT_ID}-v1`;

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider projectId={PROJECT_ID}>{ui}</TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  // Seed darkValue on the first color token so CSSBundler emits a dark block.
  // Mirrors what migration0002 does on real project loads (which run through
  // Composer, not the default-bootstrap path).
  const seeded = DEFAULT_TOKENS.map((t, i) =>
    i === 0 && t.category === "colors" ? { ...t, darkValue: "#000000" } : t,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, tokens: seeded }));
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

describe("ExportSection", () => {
  it("renders 4 format radio options", () => {
    const { getByLabelText } = render(wrap(<ExportSection />));
    expect(getByLabelText("CSS Variables")).toBeTruthy();
    expect(getByLabelText("JSON")).toBeTruthy();
    expect(getByLabelText("Tailwind Config")).toBeTruthy();
    expect(getByLabelText("Figma Variables JSON")).toBeTruthy();
  });

  it("each format row renders a status chip", () => {
    const { getByTestId } = render(wrap(<ExportSection />));
    expect(getByTestId("format-chip-css").textContent).toBe("lossless");
    expect(getByTestId("format-chip-json").textContent).toBe("lossless");
    expect(getByTestId("format-chip-figma").textContent).toBe("lossless");
    // Tailwind chip is either "N dropped" or the fallback "dark variants dropped"
    const twChip = getByTestId("format-chip-tailwind").textContent ?? "";
    expect(/dropped/.test(twChip)).toBe(true);
  });

  it("stats line shows kinds · tokens · alias edges · dark variants", () => {
    const { getByTestId } = render(wrap(<ExportSection />));
    const stats = getByTestId("export-stats").textContent ?? "";
    expect(stats).toMatch(/14 kinds/);
    expect(stats).toMatch(/\d+ tokens/);
    expect(stats).toMatch(/\d+ alias edges/);
    expect(stats).toMatch(/\d+ dark variants/);
  });

  it("Tailwind warning callout visible when Tailwind selected", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    fireEvent.click(getByLabelText("Tailwind Config"));
    expect(getByTestId("tailwind-warning")).toBeTruthy();
    expect(getByTestId("tailwind-warning").textContent).toMatch(/Tailwind warning/i);
  });

  it("Tailwind warning hidden when non-Tailwind format selected", () => {
    const { getByLabelText, queryByTestId } = render(wrap(<ExportSection />));
    // Default is CSS — no warning.
    expect(queryByTestId("tailwind-warning")).toBeNull();
    fireEvent.click(getByLabelText("JSON"));
    expect(queryByTestId("tailwind-warning")).toBeNull();
    // Figma is disabled now; selecting JSON above is the real assertion here.
  });

  it("preview pane shows :root block by default (CSS format)", () => {
    const { getByTestId } = render(wrap(<ExportSection />));
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain(":root");
    expect(preview.textContent).toContain("--buildrick-design-");
  });

  it("switching to JSON re-renders preview as JSON array", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    fireEvent.click(getByLabelText("JSON"));
    const preview = getByTestId("export-preview");
    expect(preview.textContent?.trim().startsWith("[")).toBe(true);
  });

  it("switching to Tailwind re-renders preview as JS module", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    fireEvent.click(getByLabelText("Tailwind Config"));
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain("module.exports");
  });

  it("CSS format includes dark mode block via CSSBundler", () => {
    // Default tokens shipped via migration0002 carry darkValue on 9 colors.
    const { getByTestId } = render(wrap(<ExportSection />));
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain("@media (prefers-color-scheme: dark)");
  });

  it("dark strategy radio swaps @media for :root[data-theme]", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    const dataAttr = getByLabelText(/data-attr/i) as HTMLInputElement;
    fireEvent.click(dataAttr);
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain(':root[data-theme="dark"]');
    expect(preview.textContent).not.toContain("@media (prefers-color-scheme: dark)");
  });

  /* Board 153:120 gives every LIVE row its own Copy and Download and leaves the
     greyed Figma line with neither — the board refusing to hand over a file it
     cannot make. This replaces an assertion on a single button whose LABEL
     changed with the selection; that button is gone. */
  it("gives every live format its own Download, and Figma none", () => {
    const { container } = render(wrap(<ExportSection />));
    for (const id of ["css", "json", "tailwind"]) {
      expect(container.querySelector(`[data-download-format="${id}"]`)).toBeTruthy();
    }
    expect(container.querySelector('[data-download-format="figma"]')).toBeNull();
  });

  it("does not let Figma Variables be selected at all", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    expect(getByLabelText("Figma Variables JSON")).toBeDisabled();
    // Preview stays on the default CSS output rather than the stub envelope.
    expect(getByTestId("export-preview").textContent).toContain(":root");
  });

  it("download button triggers exportUtils.downloadFile-style anchor click", () => {
    const clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy, configurable: true });
      }
      return el;
    });

    /* Every format row carries its own Download now (board 153:120), so the
       old bare name match is ambiguous — target one row. */
    const { container } = render(wrap(<ExportSection />));
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-download-format="css"]')!);
    expect(clickSpy).toHaveBeenCalled();
    createSpy.mockRestore();
  });
});
