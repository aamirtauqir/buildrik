/**
 * C1 — AI assist entry point.
 *
 * The entry used to be a ✨ button in the panel's header strip; board 152:2
 * draws the Brand root as a list and nothing else, so it now lives where the
 * thing it generates lives — the Components screen's "✨ Generate with AI".
 * Same modal, same service, one route instead of two.
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { AIAssistService } from "../../../../engine/designSystem/services/AIAssistService";
import { EventEmitter } from "../../../../engine/EventEmitter";

type Listener = (payload: unknown) => void;

function makeFakeComposer() {
  const settings: Record<string, unknown> = {
    designTokens: [],
    designTokensSchemaVersion: 2,
  };
  const handlers = new Map<string, Set<Listener>>();
  const colorMode = {
    get: vi.fn(() => "light" as const),
    set: vi.fn(),
    resolved: vi.fn(() => "light" as const),
  };
  const events = new EventEmitter();
  const aiAssistService = new AIAssistService(events, { generate: vi.fn() });
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: Record<string, unknown>) => Object.assign(settings, next),
    on: vi.fn((evt: string, cb: Listener) => {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt)!.add(cb);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      handlers.get(evt)?.delete(cb);
    }),
    colorMode,
    aiAssistService,
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
  };
}

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="ai-entry-test">
        <StylePresetRegistryProvider projectId="ai-entry-test">
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
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("DesignSystemTab AI assist entry (C1)", () => {
  /** Walks the same two clicks a user does: Brand root → Components. */
  function openComponents(container: HTMLElement) {
    const row = container.querySelector<HTMLButtonElement>('[data-section-id="components"]')!;
    act(() => {
      fireEvent.click(row);
    });
    return container.querySelector<HTMLButtonElement>("[data-open-ai-assist]")!;
  }

  test("the Components screen offers the AI entry", () => {
    const composer = makeFakeComposer();
    const { container } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const btn = openComponents(container);
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain("Generate with AI");
  });

  test("clicking the button opens AIPromptModal (dialog appears)", () => {
    const composer = makeFakeComposer();
    const { container, queryByText, getByText } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    // Modal not yet rendered.
    expect(queryByText("Generate component with AI")).toBeNull();

    const btn = openComponents(container);
    act(() => {
      fireEvent.click(btn);
    });

    // Modal title appears (AIPromptModal mounts in open=true state).
    expect(getByText("Generate component with AI")).toBeTruthy();
  });

  test("modal receives composer.aiAssistService — Generate flow reachable", () => {
    const composer = makeFakeComposer();
    const { container, getByLabelText, getByText } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const btn = openComponents(container);
    act(() => {
      fireEvent.click(btn);
    });

    // The textarea is rendered → service prop wired (otherwise AIPromptModal
    // would still render but the Generate path would not be reachable;
    // textarea existence is the proxy for the modal being live).
    expect(getByLabelText("Component description")).toBeTruthy();
    expect(getByText("Generate")).toBeTruthy();
  });
});
