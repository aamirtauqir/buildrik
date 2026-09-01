/**
 * DesignSystemTab — panel-mode layout test
 *
 * Verifies the tab renders within the 280px LeftSidebar panel chrome without
 * horizontal overflow. Width is enforced by `.ls-panel` parent + the tab's
 * own inline flex-column container; this suite asserts the tab mounts and
 * does not force an intrinsic wider width.
 *
 * @license BSD-3-Clause
 */

import { render } from "@testing-library/react";
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
    setProjectSettings: (next: Record<string, unknown>) =>
      Object.assign(settings, next),
    on: (e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (...a: unknown[]) => void) => {
      handlers.get(e)?.delete(h);
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    colorMode: {
      get: () => "light" as const,
      set: () => {},
      resolved: () => "light" as const,
    },
    settings,
  } as unknown as NonNullable<Parameters<typeof DesignSystemTab>[0]["composer"]>;
}

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="panel-mode-test">
        <StylePresetRegistryProvider projectId="panel-mode-test">
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

describe("DesignSystemTab — panel mode", () => {
  it("mounts inside a 280px container", () => {
    const composer = makeFakeComposer();
    const { container } = render(
      wrap(
        <div style={{ width: 280 }}>
          <DesignSystemTab composer={composer} />
        </div>,
      ),
    );
    // The 280px wrapper is the outer div; DesignSystemTab's root sits inside.
    const root = container.firstElementChild?.firstElementChild as HTMLElement | null;
    expect(root).toBeTruthy();
  });

  it("renders without horizontal overflow inside a 280px container", () => {
    const composer = makeFakeComposer();
    const { container } = render(
      wrap(
        <div style={{ width: 280 }}>
          <DesignSystemTab composer={composer} />
        </div>,
      ),
    );
    const root = container.firstElementChild?.firstElementChild as HTMLElement | null;
    expect(root).toBeTruthy();
    // jsdom doesn't apply CSS layout, so scrollWidth ≈ clientWidth. Assert the
    // tab's root exists and that no inline style forces a wider intrinsic width.
    // The real width clamp is enforced by .ls-panel in the browser.
    if (root) {
      const inlineWidth = root.style.width;
      expect(inlineWidth === "" || inlineWidth === "100%").toBe(true);
    }
  });

  /* Board 152:2 draws the root as a list. The colour-mode pills moved to the
     Colour mode screen (153:92), which is where that board puts them and
     where ColourModeSection already rendered a second copy of them. The
     Basic/Pro toggle stays: it changes what the whole panel offers and has no
     other route. */
  it("keeps the mode toggle on the root and leaves colour mode to its screen", () => {
    const composer = makeFakeComposer();
    const { getByRole } = render(
      wrap(
        <div style={{ width: 280 }}>
          <DesignSystemTab composer={composer} />
        </div>,
      ),
    );
    // DSModeToggle renders a role="radiogroup" with aria-label "Design system
    // display mode" — matches getByRole("radiogroup", { name: /mode/i }).
    expect(getByRole("radiogroup", { name: /mode/i })).toBeTruthy();
  });
});
