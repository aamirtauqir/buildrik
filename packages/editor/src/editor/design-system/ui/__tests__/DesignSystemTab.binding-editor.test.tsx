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

const PROJECT_ID = "binding-editor-int";

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

describe("DesignSystemTab → BindingEditor (S2.1 integration)", () => {
  it("clicking a binding-count chip on a preset row reveals the inline BindingEditor", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container, getAllByLabelText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    // Switch to Styles section.
    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    // The button-primary preset's binding-count chip is now an Edit button.
    const editBtns = await waitFor(() =>
      getAllByLabelText(/Edit bindings for button-primary/i),
    );
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(container.querySelector('[data-binding-editor="button-primary"]')).toBeTruthy();
    });
  });

  it("changing a binding via the inline editor lights the Styles dirty marker", async () => {
    const composer = makeFakeComposer();
    const { getAllByRole, container, getAllByLabelText } =
      render(wrap(<DesignSystemTab composer={composer} />));

    const stylesBtn = getAllByRole("tab").find((b) => b.textContent === "Styles");
    if (!stylesBtn) throw new Error("Styles section button missing");
    fireEvent.click(stylesBtn);

    const editBtns = await waitFor(() =>
      getAllByLabelText(/Edit bindings for button-primary/i),
    );
    fireEvent.click(editBtns[0]);

    // Delete the background-color binding — simplest mutation that doesn't
    // require the TokenPickerPopover keyboard nav (covered in BindingRow tests).
    const deleteBtns = await waitFor(() =>
      getAllByLabelText("Delete binding for background-color"),
    );
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      // Section-tab dirty marker rendered for "styles" tab specifically.
      expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });
  });
});
