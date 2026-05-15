import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
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

const PROJECT_ID = "styles-section-int";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId={PROJECT_ID}>
        <StylePresetRegistryProvider projectId={PROJECT_ID}>
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

describe("DesignSystemTab → StylesSection (Arc B1 drill-in integration)", () => {
  it("clicking Styles section reveals list view with 11 category rows", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container } = render(
      wrap(<DesignSystemTab composer={composer} />),
    );

    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    await waitFor(() => {
      expect(container.querySelector("[data-styles-router]")).toBeTruthy();
      expect(container.querySelector("[data-list-view]")).toBeTruthy();
      expect(container.querySelectorAll("[data-category-row]").length).toBe(11);
      expect(container.querySelector("[data-preset-detail-pane]")).toBeNull();
    });
  });

  it("clicking the Card category row drills into Card detail view", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container } = render(
      wrap(<DesignSystemTab composer={composer} />),
    );

    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    const cardRow = (await waitFor(() =>
      container.querySelector('[data-category-row="card"]'),
    )) as HTMLButtonElement;
    fireEvent.click(cardRow);

    await waitFor(() => {
      expect(container.querySelector("[data-detail-view]")).toBeTruthy();
      const pane = container.querySelector(
        "[data-preset-detail-pane]",
      ) as HTMLElement;
      expect(pane.getAttribute("data-category")).toBe("card");
    });
  });
});
