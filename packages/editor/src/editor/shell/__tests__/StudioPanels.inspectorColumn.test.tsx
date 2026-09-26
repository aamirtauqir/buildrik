// @vitest-environment jsdom
/**
 * StudioPanels' inspector column, rendered — not read as source text.
 *
 * The column hosts the inspector body OR one mode that replaces it (AI,
 * Issues, a column tab). The heavy children are stubs; the column logic under
 * test (which branch renders, whether the column is open, where a
 * section-focus request lands) is the real StudioPanels.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";

vi.mock("../../canvas/Canvas", () => ({ Canvas: React.forwardRef(() => null) }));
vi.mock("../../sidebar/LeftSidebar", () => ({ LeftSidebar: () => null }));
vi.mock("../../sidebar/FullPageView", () => ({ FullPageView: () => null }));
vi.mock("../../sidebar/TabRouter", () => ({
  TabRouter: ({ activeTab }: { activeTab: string }) => <div data-testid={`column-tab-${activeTab}`} />,
}));
vi.mock("../PageTabBar", () => ({ PageTabBar: () => null }));
vi.mock("../../media/components/SiteFontsModal", () => ({ SiteFontsModal: () => null }));
vi.mock("@/editor/design-system", () => {
  const Pass = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return { TokenRegistryProvider: Pass, DSModeProvider: Pass, StylePresetRegistryProvider: Pass };
});
vi.mock("@/editor/design-system/ui/MigrationProgressMount", () => ({ MigrationProgressMount: () => null }));
vi.mock("@/editor/design-system/ui/DSLintRunner", () => ({ DSLintRunner: () => null }));
vi.mock("@/editor/design-system/ui/ProjectTokensApplier", () => ({ ProjectTokensApplier: () => null }));
vi.mock("../hooks/useBlockInsertion", () => ({ useBlockInsertion: () => ({ handleBlockClick: () => {} }) }));
vi.mock("../hooks/useClipboardToasts", () => ({ useClipboardToasts: () => {} }));
vi.mock("../hooks/useAltTextAutoTrigger", () => ({ useAltTextAutoTrigger: () => {} }));
vi.mock("../../sidebar/tabs/pages/usePageCommands", () => ({ usePageJumpList: () => [], usePageCommands: () => {} }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@shared/utils/editorViewMode", () => ({ getEditorViewMode: () => ({ readOnlyView: false }) }));
vi.mock("../hooks/useEditorRole", () => ({ useViewerChrome: () => false }));

/* The inspector body: listens for the section-focus request the way the real
   one does (usePropertyJump), and shows what it last revealed. */
vi.mock("../../inspector/ProInspector", () => ({
  ProInspector: ({ composer }: { composer: { on: Function; off: Function } }) => {
    const [revealed, setRevealed] = React.useState<string | null>(null);
    React.useEffect(() => {
      const focus = (p: { section: string }) => setRevealed(p.section);
      composer.on("ui:inspector-focus-section", focus);
      return () => composer.off("ui:inspector-focus-section", focus);
    }, [composer]);
    return <div data-testid="pro-inspector" data-revealed={revealed ?? ""} />;
  },
}));
vi.mock("../../sidebar/tabs/ai/AITab", () => ({
  AITab: ({ onBack, onClose }: { onBack?: () => void; onClose: () => void }) => (
    <div data-testid="ai-tab">
      {onBack ? <button onClick={onBack}>‹ Inspector</button> : null}
      <button onClick={onClose}>Close AI</button>
    </div>
  ),
}));

import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { StudioPanels, type StudioPanelsProps } from "../StudioPanels";

function makeComposer() {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    readOnly: false,
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string, p?: unknown) => [...(handlers.get(ev) ?? [])].forEach((fn) => fn(p)),
    selection: { clear: vi.fn(), select: vi.fn() },
    elements: { getElement: () => null },
  };
}
type FakeComposer = ReturnType<typeof makeComposer>;

function Harness({ composer, ...rest }: { composer: FakeComposer } & Partial<StudioPanelsProps>) {
  const [open, setOpen] = React.useState(true);
  const [tab, setTab] = React.useState(rest.leftPanelTab ?? "add");
  return (
    <ToastProvider>
      <StudioPanels
        composer={composer as unknown as StudioPanelsProps["composer"]}
        selectedElement={null}
        device="desktop"
        zoom={100}
        onZoomChange={() => {}}
        blocks={[]}
        onQuickAdd={() => {}}
        isLeftPanelOpen={open}
        onLeftPanelToggle={() => setOpen((v) => !v)}
        leftPanelTab={tab}
        onLeftPanelTabChange={(t, done) => {
          setTab(t);
          done?.();
        }}
        {...rest}
      />
    </ToastProvider>
  );
}

const inspectorColumn = () => screen.getByTestId("layout-shell-inspector");
const flushFrame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("StudioPanels — a section-focus request always lands on a visible inspector (I-1)", () => {
  it("with AI open: AI closes, the inspector mounts, the section is revealed", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    expect(screen.getByTestId("ai-tab")).toBeTruthy();
    expect(screen.queryByTestId("pro-inspector")).toBeNull();

    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    await flushFrame();

    expect(screen.queryByTestId("ai-tab")).toBeNull();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("content");
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("with a column tab (History) open: the tab closes and the section is revealed", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} leftPanelTab="history" />);
    expect(screen.getByTestId("column-tab-history")).toBeTruthy();

    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "interactions" }));
    await flushFrame();

    expect(screen.queryByTestId("column-tab-history")).toBeNull();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("interactions");
  });

  it("with the inspector hidden: it is shown again, then the section is revealed", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");

    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    await flushFrame();

    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("content");
  });

  it("does not re-route a request the visible inspector already took", async () => {
    const composer = makeComposer();
    const emit = vi.spyOn(composer, "emit");
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    await flushFrame();
    expect(emit.mock.calls.filter(([ev]) => ev === EVENTS.UI_INSPECTOR_FOCUS_SECTION)).toHaveLength(1);
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("content");
  });
});


describe("StudioPanels — Hide inspector (GW-3 / M-2)", () => {
  it("hiding the visible inspector raises a toast whose Show brings it back", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Inspector hidden")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("the hidden state does not survive a remount (no persistence)", () => {
    const composer = makeComposer();
    const { unmount } = render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    unmount();
    render(<Harness composer={makeComposer()} />);
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("no toast when a mode covers the inspector — nothing on screen changed", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(screen.getByTestId("ai-tab")).toBeTruthy();
    expect(screen.queryByText("Inspector hidden")).toBeNull();
  });
});
