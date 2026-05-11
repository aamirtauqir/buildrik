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

describe("DesignSystemTab → StylesSection (S2 integration)", () => {
  it("clicking Styles section reveals 11 PresetCategoryCards", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container } = render(wrap(<DesignSystemTab composer={composer} />));

    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    await waitFor(() => {
      expect(container.querySelectorAll("[data-preset-category-card]").length).toBe(11);
    });
  });

  it("editing a preset friendly-name lights the Styles section-tab dirty marker", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container, getAllByLabelText } = render(
      wrap(<DesignSystemTab composer={composer} />),
    );

    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    // Buttons card defaults open (DEFAULT_PRESETS includes 3 button entries
    // and isCommon=true). Find the friendly-name input for button-primary.
    const inputs = await waitFor(() =>
      getAllByLabelText(/button preset button-primary friendly name/i),
    );
    fireEvent.change(inputs[0], { target: { value: "Renamed primary" } });

    await waitFor(() => {
      // dirty marker is rendered with aria-label "unsaved changes" inside
      // the Styles section-tab button (and only the Styles tab — Tokens has
      // no edits in this scenario).
      expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });
  });
});
