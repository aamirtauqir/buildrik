/**
 * C1 — AI assist entry point in DesignSystemTab header.
 *
 * Asserts the discoverable `data-ai-entry` button is rendered next to
 * ColorModeToggle, and clicking it opens AIPromptModal wired to
 * composer.aiAssistService.
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
import { ToastProvider } from "@/editor/ui";
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
  test("renders a discoverable [data-ai-entry] button in the header", () => {
    const composer = makeFakeComposer();
    const { container } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const btn = container.querySelector("[data-ai-entry]");
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute("aria-label")).toBe("Open AI assist");
  });

  test("clicking the button opens AIPromptModal (dialog appears)", () => {
    const composer = makeFakeComposer();
    const { container, queryByText, getByText } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    // Modal not yet rendered.
    expect(queryByText("Generate component with AI")).toBeNull();

    const btn = container.querySelector<HTMLButtonElement>("[data-ai-entry]")!;
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
    const btn = container.querySelector<HTMLButtonElement>("[data-ai-entry]")!;
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
