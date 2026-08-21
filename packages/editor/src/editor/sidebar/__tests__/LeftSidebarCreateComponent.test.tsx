// @vitest-environment jsdom
/**
 * LeftSidebar — "Create component" with nothing selected.
 *
 * The Components panel's empty state offers three ways in (the header +, an
 * inline link, a footer button) and all three call one handler. That handler
 * used to return silently when the selection was empty — which is exactly the
 * state the empty state exists for. Measured live 2026-08-22: three clicks,
 * zero dialogs, no toast, no console error. It now says what is missing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";

vi.mock("../tabs/build", () => ({ BuildTab: () => null }));
vi.mock("../tabs/layers/LayersTab", () => ({ default: () => null }));
vi.mock("../tabs/pages/PagesTab", () => ({ default: () => null }));
vi.mock("../tabs/media/MediaTab", () => ({ MediaTab: () => null }));
vi.mock("../tabs/publish/PublishTab", () => ({ default: () => null }));
vi.mock("../tabs/history/HistoryTab", () => ({ default: () => null }));
vi.mock("../tabs/settings/SettingsTab", () => ({ default: () => null }));
/* Stand in for the real panel with just the door the bug was behind. */
vi.mock("../tabs/ComponentsTab", () => ({
  default: ({ onCreateNew }: { onCreateNew?: () => void }) => (
    <button data-testid="comp-create" onClick={() => onCreateNew?.()}>
      + Create component
    </button>
  ),
}));

const toasts: Array<{ description: string }> = [];
vi.mock("@/editor/chrome-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useToast: () => ({ addToast: (t: { description: string }) => toasts.push(t) }),
  };
});

import { LeftSidebar } from "../LeftSidebar";
import { EVENTS } from "../../../shared/constants/events";

beforeAll(() => {
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

function makeComposer(selectedIds: string[]) {
  const emit = vi.fn();
  return {
    emit,
    on: vi.fn(),
    off: vi.fn(),
    components: { isAvailable: () => true },
    selection: { getSelectedIds: () => selectedIds },
    elements: { getAllPages: () => [], getActivePage: () => null },
  } as unknown as Parameters<typeof LeftSidebar>[0]["composer"] & { emit: ReturnType<typeof vi.fn> };
}

function renderWith(composer: ReturnType<typeof makeComposer>) {
  render(
    <LeftSidebar
      composer={composer}
      activeTab="components"
      onTabChange={vi.fn()}
      drawerOpen
      onDrawerToggle={vi.fn()}
    />,
  );
}

describe("Create component with an empty selection", () => {
  it("says what is missing instead of doing nothing", async () => {
    toasts.length = 0;
    const composer = makeComposer([]);
    renderWith(composer);
    /* TabRouter loads the panel through React.lazy, so the door is not in the
       tree on the first paint. */
    const btn = await waitFor(() => screen.getByTestId("comp-create"));
    fireEvent.click(btn);
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit)
      .not.toHaveBeenCalledWith(EVENTS.COMPONENT_CREATE_REQUESTED, expect.anything());
    expect(toasts.map((t) => t.description).join(" ")).toMatch(/select an element/i);
  });

  it("still asks for the component when something IS selected", async () => {
    toasts.length = 0;
    const composer = makeComposer(["el-1"]);
    renderWith(composer);
    const btn2 = await waitFor(() => screen.getByTestId("comp-create"));
    fireEvent.click(btn2);
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit)
      .toHaveBeenCalledWith(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId: "el-1" });
    expect(toasts).toHaveLength(0);
  });
});
