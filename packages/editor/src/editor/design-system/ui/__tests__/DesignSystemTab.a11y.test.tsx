import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
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

describe("DesignSystemTab — DD3 WAI-ARIA tablist a11y", () => {
  it("section switcher has role=tablist with descriptive label", () => {
    const composer = makeFakeComposer();
    const { getByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tablist = getByRole("tablist", { name: "Design workspace sections" });
    expect(tablist).toBeTruthy();
  });

  it("renders 4 tabs with aria-selected reflecting active section", () => {
    const composer = makeFakeComposer();
    const { getAllByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tabs = getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    const labels = tabs.map((t) => t.textContent);
    expect(labels).toContain("Tokens");
    expect(labels).toContain("Styles");
    expect(labels).toContain("Components");
    expect(labels).toContain("Export");
    // Tokens is the default active section.
    const tokensTab = tabs.find((t) => t.textContent === "Tokens")!;
    expect(tokensTab.getAttribute("aria-selected")).toBe("true");
    expect(tokensTab.getAttribute("tabindex")).toBe("0");
    // Others are not selected and roving-tabindex=-1.
    const stylesTab = tabs.find((t) => t.textContent === "Styles")!;
    expect(stylesTab.getAttribute("aria-selected")).toBe("false");
    expect(stylesTab.getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowRight on the active tab activates the next tab", () => {
    const composer = makeFakeComposer();
    const { getAllByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tokensTab = getAllByRole("tab").find((t) => t.textContent === "Tokens")!;
    fireEvent.keyDown(tokensTab, { key: "ArrowRight" });
    const stylesTab = getAllByRole("tab").find((t) => t.textContent === "Styles")!;
    expect(stylesTab.getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowLeft on the first tab wraps to the last", () => {
    const composer = makeFakeComposer();
    const { getAllByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tokensTab = getAllByRole("tab").find((t) => t.textContent === "Tokens")!;
    fireEvent.keyDown(tokensTab, { key: "ArrowLeft" });
    const exportTab = getAllByRole("tab").find((t) => t.textContent === "Export")!;
    expect(exportTab.getAttribute("aria-selected")).toBe("true");
  });

  it("End jumps to the last tab; Home jumps back to the first", () => {
    const composer = makeFakeComposer();
    const { getAllByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tokensTab = getAllByRole("tab").find((t) => t.textContent === "Tokens")!;
    fireEvent.keyDown(tokensTab, { key: "End" });
    let exportTab = getAllByRole("tab").find((t) => t.textContent === "Export")!;
    expect(exportTab.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(exportTab, { key: "Home" });
    const tokensAgain = getAllByRole("tab").find((t) => t.textContent === "Tokens")!;
    expect(tokensAgain.getAttribute("aria-selected")).toBe("true");
  });

  it("renders the active section as a labelled tabpanel", () => {
    const composer = makeFakeComposer();
    const { getByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const panel = getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe("design-tab-tokens");
    expect(panel.getAttribute("id")).toBe("design-tabpanel-tokens");
  });

  it("ignores unrelated keys (no nav on Space, Tab, etc.)", () => {
    const composer = makeFakeComposer();
    const { getAllByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const tokensTab = getAllByRole("tab").find((t) => t.textContent === "Tokens")!;
    fireEvent.keyDown(tokensTab, { key: "Tab" });
    fireEvent.keyDown(tokensTab, { key: " " });
    fireEvent.keyDown(tokensTab, { key: "a" });
    expect(tokensTab.getAttribute("aria-selected")).toBe("true");
  });
});
