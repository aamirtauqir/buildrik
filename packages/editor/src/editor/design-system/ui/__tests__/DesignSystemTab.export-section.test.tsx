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
    const { getAllByRole, getByTestId, getByText, getAllByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // Section switcher has Tokens / Styles / Components / Export — second
    // Export label belongs to header dropdown trigger.
    // Two buttons read "Export" (header dropdown trigger + section switcher
    // tab). Section tab has no aria-haspopup; dropdown does.
    const sectionExport = getAllByRole("tab").find((t) => t.textContent === "Export");
    if (!sectionExport) throw new Error("Export section tab missing");
    fireEvent.click(sectionExport);

    await waitFor(() => {
      expect(getByTestId("export-preview")).toBeTruthy();
    });
    // ImportCard heading visible.
    expect(getAllByText(/Import tokens/i).length).toBeGreaterThan(0);
    // Format radios present.
    expect(getByText(/CSS Variables/i)).toBeTruthy();
  });

  it("import flow stages a new color token + propagates dirty marker to Tokens section tab", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, getByLabelText, getByText, container, findByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    const sectionExport = getAllByRole("tab").find((t) => t.textContent === "Export");
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
      expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });
  });

  it("ADD via import lights the dirty marker (was silent before dirtyCount fix)", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, getByLabelText, getByText, container, findByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    const sectionExport = getAllByRole("tab").find((t) => t.textContent === "Export");
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
      expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });
  });
});
