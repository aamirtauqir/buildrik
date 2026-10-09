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
vi.mock("@/editor/cms/CmsWorkspace", () => ({
  default: ({ onBackToCanvas }: { onBackToCanvas?: () => void }) => (
    <div data-testid="cms-workspace">
      {onBackToCanvas ? <button onClick={onBackToCanvas}>‹ Back to canvas</button> : null}
    </div>
  ),
}));
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

function selectingComposer(ids: string[]) {
  const base = makeComposer();
  const live = new Map(ids.map((id) => [id, { id }]));
  let selected: { id: string }[] = [];
  const selection = {
    getSelectedIds: () => selected.map((e) => e.id),
    getAllSelected: () => selected,
    clear: vi.fn(() => {
      selected = [];
    }),
    select: vi.fn((el: { id: string } | null) => {
      selected = el ? [el] : [];
    }),
    selectMultiple: vi.fn((els: { id: string }[]) => {
      selected = els;
    }),
  };
  return {
    ...base,
    selection,
    live,
    elements: { getElement: (id: string) => live.get(id) ?? null },
  };
}

function Harness({
  composer,
  leftPanelTab,
  initialOpen = true,
  ...rest
}: { composer: FakeComposer; initialOpen?: boolean } & Omit<Partial<StudioPanelsProps>, "composer">) {
  const [open, setOpen] = React.useState(initialOpen);
  /* The initial tab; afterwards the harness owns it, like AquibraStudio. */
  const [tab, setTab] = React.useState(leftPanelTab ?? "add");
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
    /* P-7a: covered, not unmounted. */
    expect(screen.getByTestId("inspector-body-host").getAttribute("aria-hidden")).toBe("true");

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


/* Board 36 (Inspector v4 · Inspector hidden): the canvas runs full width and
   carries its own way back — "Show inspector ⌘\" at its top right. That
   button replaced the "Inspector hidden · Show" toast (GW-3 / M-2), which was
   the way back only while no board drew one. */
describe("StudioPanels — Show inspector on the canvas (board 36)", () => {
  const showButton = () => screen.queryByRole("button", { name: "Show inspector" });

  it("hiding the inspector puts Show inspector ⌘\\ on the canvas; it brings the inspector back", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    expect(showButton()).toBeNull();
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");
    const button = showButton()!;
    expect(button.textContent).toContain("Show inspector");
    expect(button.textContent).toContain("⌘\\");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Meta+\\");
    /* On the canvas, not in the (hidden) column. */
    expect(inspectorColumn().contains(button)).toBe(false);
    fireEvent.click(button);
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
    expect(showButton()).toBeNull();
  });

  it("no toast any more — the button is the way back", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(screen.queryByText("Inspector hidden")).toBeNull();
  });

  it("⌘\\ (the toggle event) takes the button away again", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(showButton()).toBeNull();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("not drawn while a mode fills the column (AI) — the column is open", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    expect(showButton()).toBeNull();
  });

  it("the hidden state does not survive a remount (no persistence)", () => {
    const composer = makeComposer();
    const { unmount } = render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    unmount();
    render(<Harness composer={makeComposer()} />);
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
    expect(showButton()).toBeNull();
  });
});

/* M-1: "‹ Inspector" is a promise. With the inspector hidden it closed the
   mode and the whole column went with it — no inspector. It now goes where it
   says: the mode closes and the inspector shows. */
describe("StudioPanels — ‹ Inspector leads to the inspector (M-1)", () => {
  it("AI's back row shows the inspector even when it was hidden", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    fireEvent.click(screen.getByRole("button", { name: "‹ Inspector" }));
    expect(screen.queryByTestId("ai-tab")).toBeNull();
    expect(screen.getByTestId("pro-inspector")).toBeTruthy();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("AI's ✕ leaves a hidden inspector hidden", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    fireEvent.click(screen.getByRole("button", { name: "Close AI" }));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");
  });

  it("Issues' back row gets the same promise", () => {
    const composer = makeComposer();
    const onCloseIssues = vi.fn();
    const { rerender } = render(
      <Harness
        composer={composer}
        issuesOpen
        onCloseIssues={onCloseIssues}
        renderIssuesPanel={(onBack) => <button onClick={onBack}>Issues back</button>}
      />,
    );
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    fireEvent.click(screen.getByRole("button", { name: "Issues back" }));
    expect(onCloseIssues).toHaveBeenCalled();
    rerender(<Harness composer={composer} issuesOpen={false} onCloseIssues={onCloseIssues} />);
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });
});

/* A-14 / GW-2: every panel the column hosts opens the column, even with the
   inspector hidden (was a source-text check). */
describe("StudioPanels — the column opens for every panel it hosts", () => {
  it("AI, a column tab and Issues each open a hidden inspector's column", () => {
    const composer = makeComposer();
    const { rerender } = render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");

    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    expect(screen.getByTestId("ai-tab")).toBeTruthy();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Close AI" }));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");

    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "history" }));
    expect(screen.getByTestId("column-tab-history")).toBeTruthy();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");

    rerender(<Harness composer={composer} issuesOpen renderIssuesPanel={() => <div data-testid="issues" />} />);
    expect(screen.getByTestId("issues")).toBeTruthy();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });
});

/* m-1: a held section-focus request must not fire later, at a moment the user
   no longer connects with it. It lapses after PENDING_FOCUS_MS if the body
   never came up, and on any selection change. Here the column tab cannot be
   closed by the route (no toggle wired), so the body stays covered. */
describe("StudioPanels — a held focus request lapses (m-1)", () => {
  it("expires if the inspector body does not come up in time", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} leftPanelTab="history" onLeftPanelToggle={undefined} />);
    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    await act(() => new Promise<void>((r) => setTimeout(r, 600)));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    await flushFrame();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("");
  });

  it("is dropped when the selection changes", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} leftPanelTab="history" onLeftPanelToggle={undefined} />);
    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    act(() => composer.emit(EVENTS.SELECTION_CLEARED));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    await flushFrame();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("");
  });
});

/* P-5: a full page (Brand from a token chip, the Asset library from "Manage
   SVG", Settings) cleared the selection and never gave it back, so "Back to
   canvas" landed on an empty inspector. The clear stays (A-6: no stale
   highlight on a canvas nobody can see); the selection comes back on return. */
describe("StudioPanels — a full page keeps the selection to give back (P-5)", () => {
  it("Brand clears the selection while open and restores it on the way back", () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "design" }));
    expect(composer.selection.getSelectedIds()).toEqual([]);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    expect(composer.selection.getSelectedIds()).toEqual(["el-1"]);
  });

  it("a multi-selection comes back whole", () => {
    const composer = selectingComposer(["a", "b"]);
    composer.selection.selectMultiple([composer.live.get("a")!, composer.live.get("b")!]);
    render(<Harness composer={composer as unknown as FakeComposer} />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "settings" }));
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    expect(composer.selection.getSelectedIds()).toEqual(["a", "b"]);
  });

  it("an element deleted while the full page was open is not resurrected", () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "design" }));
    composer.live.delete("el-1");
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    expect(composer.selection.getSelectedIds()).toEqual([]);
  });
});

/* P-7a: the AI panel replaced ProInspector by unmounting it, so "‹ Inspector"
   came back to a fresh one — tab Style, scroll 0, :hover back to Base. The
   stub's revealed-section state stands in for all of that local state. */
describe("StudioPanels — the AI round trip keeps the inspector's state (P-7a)", () => {
  it("state held by the inspector survives AI open → ‹ Inspector", async () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "typography" }));
    await flushFrame();
    const before = screen.getByTestId("pro-inspector");
    expect(before.getAttribute("data-revealed")).toBe("typography");

    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }));
    expect(screen.getByTestId("ai-tab")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Inspector" }));

    const after = screen.getByTestId("pro-inspector");
    expect(after).toBe(before);
    expect(after.getAttribute("data-revealed")).toBe("typography");
    expect(screen.getByTestId("inspector-body-host").getAttribute("aria-hidden")).toBeNull();
  });
});

/* §13 "Open record ›" / "Open collection ›": the CMS workspace replaces the
   canvas and the inspector. It had no way back to where the door was opened —
   leaving meant the rail, and the drawer landed on the CMS list. "‹ Back to
   canvas" gives back the drawer tab, the drawer's open state and the
   selection; the inspector, mounted throughout, keeps its tab and scroll. */
describe("StudioPanels — the CMS workspace returns to the bound element (§13)", () => {
  it("Back to canvas restores the drawer tab and re-selects the element", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1", recordId: "rec-1" }));
    expect(await screen.findByTestId("cms-workspace")).toBeTruthy();
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("true");
    /* Anything may happen to the selection while the workspace is up. */
    act(() => composer.selection.clear());

    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));

    expect(screen.queryByTestId("cms-workspace")).toBeNull();
    expect(composer.selection.getSelectedIds()).toEqual(["el-1"]);
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
  });

  it("a drawer that was closed before the door is closed again", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" initialOpen={false} />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1" }));
    await screen.findByTestId("cms-workspace");
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));
    expect(screen.queryByTestId("cms-workspace")).toBeNull();
    expect(screen.getByTestId("layout-shell").className).not.toContain("layout-shell--drawer-open");
    expect(composer.selection.getSelectedIds()).toEqual(["el-1"]);
  });

  it("no Back to canvas when the workspace was opened with nothing selected (rail, ⌘K)", async () => {
    const composer = selectingComposer([]);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1" }));
    await screen.findByTestId("cms-workspace");
    expect(screen.queryByRole("button", { name: "‹ Back to canvas" })).toBeNull();
  });

  /* L1-027: Escape (×3) did not leave a CMS workspace opened from the rail. */
  it("Escape leaves a workspace opened from the rail", async () => {
    const composer = selectingComposer([]);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "content" }));
    await screen.findByTestId("cms-workspace");
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByTestId("cms-workspace")).toBeNull();
  });

  it("Escape after a bound-element door is Back to canvas", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1" }));
    await screen.findByTestId("cms-workspace");
    act(() => composer.selection.clear());
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByTestId("cms-workspace")).toBeNull();
    expect(composer.selection.getSelectedIds()).toEqual(["el-1"]);
  });

  it("leaving the workspace another way drops the return", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1" }));
    await screen.findByTestId("cms-workspace");
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" }));
    act(() => composer.selection.clear());
    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "content" }));
    await screen.findByTestId("cms-workspace");
    expect(screen.queryByRole("button", { name: "‹ Back to canvas" })).toBeNull();
  });
});
