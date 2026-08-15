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
  /* Board 153:120 lists four formats under EXPORT — three live, Figma greyed
     — as plain rows. The radios that used to lead each row are gone with the
     selection they expressed. */
  it("lists every format the board draws", () => {
    const { container } = render(wrap(<ExportSection />));
    /* Scoped to the EXPORT card: the preview's own format select repeats
       three of these names in its options. */
    const rows = Array.from(container.querySelectorAll("[data-testid^='format-row-'], .tw\\:border-gray-200"));
    const text = container.textContent ?? "";
    for (const label of ["CSS", "JSON", "Tailwind", "Figma Variables JSON"]) {
      expect(text.includes(label), label).toBe(true);
    }
    expect(rows.length).toBeGreaterThan(0);
  });

  /* Board 153:120 draws no chips on rows — title + muted desc, actions right.
     The chip assertion pinned a decoration the board does not have; lossy
     info (N dropped) now rides the Tailwind desc line. */
  it("puts the description on its own muted line, chipless", () => {
    const { queryByTestId, getByText } = render(wrap(<ExportSection />));
    expect(queryByTestId("format-chip-css")).toBeNull();
    expect(getByText("Custom properties")).toBeTruthy();
  });

  it("stats line shows kinds · tokens · alias edges · dark variants", () => {
    const { getByTestId } = render(wrap(<ExportSection />));
    const stats = getByTestId("export-stats").textContent ?? "";
    expect(stats).toMatch(/14 kinds/);
    expect(stats).toMatch(/\d+ tokens/);
    expect(stats).toMatch(/\d+ alias edges/);
    expect(stats).toMatch(/\d+ dark variants/);
  });

  /* The format rows carry no selection any more (board 153:120 gives each its
     own Copy and Download), so the thing that has a format is the preview. */
  function chooseFormat(getByLabelText: (t: RegExp | string) => HTMLElement, value: string) {
    fireEvent.change(getByLabelText(/preview format/i), { target: { value } });
  }

  it("Tailwind warning callout visible when Tailwind is previewed", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    chooseFormat(getByLabelText, "tailwind");
    expect(getByTestId("tailwind-warning")).toBeTruthy();
    expect(getByTestId("tailwind-warning").textContent).toMatch(/Tailwind warning/i);
  });

  it("Tailwind warning hidden for any other format", () => {
    const { getByLabelText, queryByTestId } = render(wrap(<ExportSection />));
    // Default is CSS — no warning.
    expect(queryByTestId("tailwind-warning")).toBeNull();
    chooseFormat(getByLabelText, "json");
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
    chooseFormat(getByLabelText, "json");
    const preview = getByTestId("export-preview");
    expect(preview.textContent?.trim().startsWith("[")).toBe(true);
  });

  it("switching to Tailwind re-renders preview as JS module", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    chooseFormat(getByLabelText, "tailwind");
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain("module.exports");
  });

  it("CSS format includes dark mode block via CSSBundler", () => {
    // Default tokens shipped via migration0002 carry darkValue on 9 colors.
    const { getByTestId } = render(wrap(<ExportSection />));
    const preview = getByTestId("export-preview");
    expect(preview.textContent).toContain("@media (prefers-color-scheme: dark)");
  });

  /* Board 153:120 leads with one "Dark strategy" row and its value at the
     right, not three radios buried under the CSS format — where a JSON
     exporter would never see the choice they are exporting under. */
  it("dark strategy swaps @media for :root[data-theme]", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    const select = getByLabelText(/dark mode strategy/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "data-attr" } });
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

  it("offers no way to preview or take the Figma stub", () => {
    const { container, getByLabelText, getByTestId } = render(wrap(<ExportSection />));
    const options = Array.from(
      (getByLabelText(/preview format/i) as HTMLSelectElement).options,
    ).map((o) => o.value);
    expect(options).not.toContain("figma");
    expect(container.querySelector('[data-download-format="figma"]')).toBeNull();
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
