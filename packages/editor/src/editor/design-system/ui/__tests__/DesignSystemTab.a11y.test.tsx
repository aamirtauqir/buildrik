import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
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
      <TokenRegistryProvider projectId="a11y-test">
        <StylePresetRegistryProvider projectId="a11y-test">
          {ui}
        </StylePresetRegistryProvider>
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
});

/**
 * Brand navigation a11y — rewritten with M5.
 *
 * The seven tests replaced here asserted a WAI-ARIA TABLIST: four tabs, roving
 * tabindex, ArrowLeft/Right/Home/End, and a labelled tabpanel. That contract is
 * gone because the surface is gone — board `Brand · root` (152:2) is a drill-in
 * list of destinations, not a tab bar. They were pinning the old design, not
 * catching a regression, so they are rewritten in the same commit rather than
 * deleted or skipped.
 *
 * A list of links needs the opposite of roving focus: every row is a plain
 * button in the tab order, which is what these tests now hold.
 */
describe("DesignSystemTab — Brand root drill-in a11y", () => {
  const renderRoot = () => render(wrap(<DesignSystemTab composer={makeFakeComposer()} />));

  const rows = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLButtonElement>("[data-section-id]"));

  it("opens on the root list, not inside a section", () => {
    const { container, queryByRole } = renderRoot();
    expect(rows(container)).toHaveLength(7);
    // The tab bar it replaced must not survive anywhere in the panel.
    expect(queryByRole("tablist")).toBeNull();
    expect(queryByRole("tab")).toBeNull();
    expect(queryByRole("tabpanel")).toBeNull();
  });

  it("labels every row from the board, with a hint", () => {
    const { container, getByText } = renderRoot();
    const labels = rows(container).map((r) => r.textContent);
    for (const label of ["Tokens", "Presets", "Starters", "Components", "Colour mode", "Lint", "Import / export"]) {
      expect(labels.some((l) => l?.includes(label))).toBe(true);
    }
    expect(getByText("Component style presets")).toBeTruthy();
  });

  it("keeps every row in the tab order — no roving tabindex", () => {
    const { container } = renderRoot();
    for (const row of rows(container)) {
      expect(row.getAttribute("tabindex")).not.toBe("-1");
      expect(row.getAttribute("aria-selected")).toBeNull();
    }
  });

  it("drills into a destination and shows a back crumb naming it", () => {
    const { container, getByText } = renderRoot();
    fireEvent.click(rows(container).find((r) => r.textContent?.includes("Presets"))!);
    expect(rows(container)).toHaveLength(0); // root list is gone
    expect(getByText(/‹ Presets/)).toBeTruthy();
  });

  it("returns to the root from the back crumb", () => {
    const { container, getByText } = renderRoot();
    fireEvent.click(rows(container).find((r) => r.textContent?.includes("Tokens"))!);
    fireEvent.click(getByText(/‹ Tokens/));
    expect(rows(container)).toHaveLength(7);
  });

  it("hides the decorative chevron from assistive tech", () => {
    const { container } = renderRoot();
    const chevrons = container.querySelectorAll('[data-section-id] [aria-hidden="true"]');
    expect(chevrons.length).toBe(7);
  });
});
