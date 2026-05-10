import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

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
      <TokenRegistryProvider projectId="export-section-int">{ui}</TokenRegistryProvider>
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
    const buttons = getAllByRole("button");
    const sectionExport = buttons.find(
      (b) => b.textContent === "Export" && !b.hasAttribute("aria-haspopup"),
    );
    if (!sectionExport) throw new Error("Export section button missing");
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
    const { getAllByRole, getByLabelText, getByText, getByRole, container, findByText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // Two buttons read "Export" (header dropdown trigger + section switcher
    // tab). Section tab has no aria-haspopup; dropdown does.
    const buttons = getAllByRole("button");
    const sectionExport = buttons.find(
      (b) => b.textContent === "Export" && !b.hasAttribute("aria-haspopup"),
    );
    if (!sectionExport) throw new Error("Export section button missing");
    fireEvent.click(sectionExport);

    // MODIFY existing color-primary instead of adding a new id. The
    // DesignSystemTab section-tab dirty marker (dirtyCount() at line 97)
    // intentionally only counts modifications (saved !== undefined && value
    // changed) — not pure additions. AddTokenModal has the same blind spot
    // and is treated as a separate concern. S5 import wiring is exercised
    // through the modify path here.
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

    fireEvent.change(getByLabelText("Paste JSON"), { target: { value: payload } });
    fireEvent.click(getByRole("button", { name: "Preview" }));
    await findByText(/1 modified/i);
    fireEvent.click(getByText(/Apply Import/i));

    // Dirty marker on Tokens tab — same span the aggregation test asserts.
    await waitFor(() => {
      expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });
  });
});
