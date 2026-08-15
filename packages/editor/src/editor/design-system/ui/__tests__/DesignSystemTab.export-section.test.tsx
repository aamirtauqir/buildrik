import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";

function makeFakeComposer() {
  const settings: Record<string, unknown> = {
    designTokens: [],
    designTokensSchemaVersion: 2,
  };
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: Record<string, unknown>) => Object.assign(settings, next),
    on: (e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (...a: unknown[]) => void) => {
      handlers.get(e)?.delete(h);
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
  } as unknown as Parameters<typeof DesignSystemTab>[0]["composer"];
}

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="export-section-int">
        <StylePresetRegistryProvider projectId="export-section-int">{ui}</StylePresetRegistryProvider>
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  if (!(document as Document & { fonts?: unknown }).fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    });
  }
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

describe("DesignSystemTab → ExportSection (S5 integration)", () => {
  it("clicking Export section reveals import card + export preview", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, getByTestId, getByText, getAllByText, container } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // Section switcher has Tokens / Styles / Components / Export — second
    // Export label belongs to header dropdown trigger.
    // Two buttons read "Export" (header dropdown trigger + section switcher
    // tab). Section tab has no aria-haspopup; dropdown does.
    // M5: sections are drill-in rows on the Brand root, not tabs. The board
    // calls this one "Import / export"; the id is unchanged.
    const sectionExport = container.querySelector<HTMLButtonElement>('[data-section-id="export"]');
    if (!sectionExport) throw new Error("Export section tab missing");
    fireEvent.click(sectionExport);

    await waitFor(() => {
      expect(getByTestId("export-preview")).toBeTruthy();
    });
    // ImportCard heading visible.
    expect(getAllByText(/Import tokens/i).length).toBeGreaterThan(0);
    // Format radios present.
    expect(getByText(/Custom properties/i)).toBeTruthy(); // board 153:120 copy
  });

  it("import flow stages a new color token + propagates dirty marker to Tokens section tab", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, getByLabelText, getByText, container, findByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // M5: sections are drill-in rows on the Brand root, not tabs. The board
    // calls this one "Import / export"; the id is unchanged.
    const sectionExport = container.querySelector<HTMLButtonElement>('[data-section-id="export"]');
    if (!sectionExport) throw new Error("Export section tab missing");
    fireEvent.click(sectionExport);

    // D4 rewrite: drop-zone primary, paste textarea collapsed. Expand
    // paste fallback → Parse → "Apply N valid only" (not "Preview" / "Apply
    // Import" anymore). Modify path triggers ID collision → default
    // "replace" strategy → applyCount=1 still.
    const payload = JSON.stringify([
      {
        id: "color-primary",
        name: "Primary",
        value: "#FF00AA",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
        kind: "color",
      },
    ]);

    fireEvent.click(getByText(/or paste JSON/i));
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: payload } });
    fireEvent.click(getByText(/^Parse$/i));
    await findByText(/Apply 1 valid only/i);
    fireEvent.click(getByText(/Apply 1 valid only/i));

    await waitFor(() => {
      // M5: the per-section dot is a root-list affordance, and the root cannot
      // be reached while dirty — the guard intercepts exactly that move. The
      // footer carries the signal inside a section.
      expect(getByText(/previewing/)).toBeTruthy();
    });
  });

  it("ADD via import lights the dirty marker (was silent before dirtyCount fix)", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, getByLabelText, getByText, container, findByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // M5: sections are drill-in rows on the Brand root, not tabs. The board
    // calls this one "Import / export"; the id is unchanged.
    const sectionExport = container.querySelector<HTMLButtonElement>('[data-section-id="export"]');
    if (!sectionExport) throw new Error("Export section tab missing");
    fireEvent.click(sectionExport);

    const payload = JSON.stringify([
      {
        id: "color-brand-new",
        name: "Brand New",
        value: "#00FF99",
        category: "colors",
        cssVar: "--buildrick-design-color-brand-new",
        type: "color",
        kind: "color",
      },
    ]);

    fireEvent.click(getByText(/or paste JSON/i));
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: payload } });
    fireEvent.click(getByText(/^Parse$/i));
    await findByText(/Apply 1 valid only/i);
    fireEvent.click(getByText(/Apply 1 valid only/i));

    // Dirty marker MUST appear for adds, not just modifications. Pre-fix,
    // dirtyCount() at DesignSystemTab.tsx:97 only counted saved !== undefined
    // → adds passed silently and the user lost visual confirmation.
    await waitFor(() => {
      // M5: the per-section dot is a root-list affordance, and the root cannot
      // be reached while dirty — the guard intercepts exactly that move. The
      // footer carries the signal inside a section.
      expect(getByText(/previewing/)).toBeTruthy();
    });
  });

  /* The Figma emitter was a hand-rolled envelope, not the schema Figma's
     importer reads, so the row downloaded a convincing wrong file under exactly
     the right name. Board 153:120 greys it with the workaround in its own copy.
     This test is the thing that stops a future change re-enabling a stub. */
  /* Board 153:120 names Figma and greys it, with no Copy and no Download —
     the board refusing to hand over a file it cannot make. The row carries no
     radio any more (nothing selects a format), so the promise is the missing
     actions and the reason printed on the row itself. */
  it("names Figma Variables but offers no way to take it", async () => {
    const composer = makeFakeComposer();
    const { container } = render(wrap(<DesignSystemTab composer={composer} />));
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-section-id="export"]')!);

    await waitFor(() => expect(container.textContent).toMatch(/Figma Variables JSON/));
    expect(container.textContent).toMatch(/Coming soon/);
    expect(container.querySelector('[data-download-format="figma"]')).toBeNull();
    for (const id of ["css", "json", "tailwind"]) {
      expect(container.querySelector(`[data-download-format="${id}"]`)).toBeTruthy();
    }
  });
});
