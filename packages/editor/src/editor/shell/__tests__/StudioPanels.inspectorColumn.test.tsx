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

/* The Canvas stub keeps the props it was last given (A-12 reads them). */
const canvasProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("@/editor/canvas/Canvas", () => ({
  Canvas: React.forwardRef((props: Record<string, unknown>) => {
    canvasProps.current = props;
    return null;
  }),
}));
vi.mock("@/editor/sidebar/LeftSidebar", () => ({ LeftSidebar: () => null }));
vi.mock("@/editor/sidebar/FullPageView", () => ({ FullPageView: () => null }));
vi.mock("@/editor/sidebar/TabRouter", () => ({
  TabRouter: ({ activeTab }: { activeTab: string }) => <div data-testid={`column-tab-${activeTab}`} />,
}));
vi.mock("@/editor/cms/CmsWorkspace", () => ({
  default: ({ onBackToCanvas }: { onBackToCanvas?: () => void }) => (
    <div data-testid="cms-workspace">
      {onBackToCanvas ? <button onClick={onBackToCanvas}>‹ Back to canvas</button> : null}
    </div>
  ),
}));
vi.mock("@/editor/media/components/SiteFontsModal", () => ({ SiteFontsModal: () => null }));
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
vi.mock("@/editor/sidebar/tabs/pages/usePageCommands", () => ({ usePageCommands: () => {} }));
/* The real BottomBar renders; the shell's page list is one page, "Home". */
vi.mock("../usePageSummaries", () => ({
  usePageSummaries: () => [{ id: "home", name: "Home", slug: "/", kind: "static", isHome: true, dirty: false, depth: 0 }],
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@shared/utils/editorViewMode", () => ({ getEditorViewMode: () => ({ readOnlyView: false }) }));
vi.mock("../hooks/useEditorRole", () => ({ useViewerChrome: () => false }));

/* The inspector body: listens for the section-focus request the way the real
   one does (usePropertyJump), and shows what it last revealed. */
vi.mock("@/editor/inspector/ProInspector", () => ({
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

import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { StudioPanels, type StudioPanelsProps } from "../StudioPanels";

function makeComposer() {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    readOnly: false,
    setEditLock: vi.fn(),
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string, p?: unknown) => [...(handlers.get(ev) ?? [])].forEach((fn) => fn(p)),
    selection: { clear: vi.fn(), select: vi.fn() },
    elements: { getElement: () => null, getActivePage: () => ({ id: "home" }) },
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
    elements: { getElement: (id: string) => live.get(id) ?? null, getActivePage: () => ({ id: "home" }) },
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
    expect(screen.queryByTestId("show-inspector")).not.toBeNull(); // hidden: S30's reserved column

    act(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "content" }));
    await flushFrame();

    expect(screen.queryByTestId("show-inspector")).toBeNull();
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


/* 2L9 S30 (258:36770, Inspector hidden): the column stays reserved and empty,
   with "Show Inspector" at its top right (it was board 36's full-width canvas
   with the button on it). That button replaced the "Inspector hidden · Show"
   toast (GW-3 / M-2). The inspector stays mounted, invisible, under it. */
describe("StudioPanels — Show Inspector in the reserved column (2L9 S30)", () => {
  const showButton = () => screen.queryByRole("button", { name: "Show Inspector" });

  it("hiding the inspector keeps its column with Show Inspector in it; the button brings the inspector back", () => {
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    expect(showButton()).toBeNull();
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(inspectorColumn().getAttribute("aria-hidden")).toBe("false");
    expect(screen.getByTestId("inspector-body-host").getAttribute("aria-hidden")).toBe("true");
    const button = showButton()!;
    /* 2L9 S30 (258:36770): "Show Inspector"; ⌘\ is announced and in the tooltip. */
    expect(button.textContent).toBe("Show Inspector");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Meta+\\");
    expect(button.getAttribute("title")).toBe("Show Inspector (⌘\\)");
    /* In the reserved column. */
    expect(inspectorColumn().contains(button)).toBe(true);
    fireEvent.click(button);
    expect(screen.getByTestId("inspector-body-host").getAttribute("aria-hidden")).toBeNull();
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
    expect(screen.queryByTestId("show-inspector")).toBeNull();
  });

  it("the hidden state does not survive a remount (no persistence)", () => {
    const composer = makeComposer();
    const { unmount } = render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    unmount();
    render(<Harness composer={makeComposer()} />);
    expect(screen.queryByTestId("show-inspector")).toBeNull();
    expect(showButton()).toBeNull();
  });
});

/* M-1: "‹ Inspector" is a promise. With the inspector hidden it closed the
   mode and the whole column went with it — no inspector. It now goes where it
   says: the mode closes and the inspector shows. */
describe("StudioPanels — ‹ Inspector leads to the inspector (M-1)", () => {
  it("Issues' back row shows the inspector even when it was hidden", () => {
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
    expect(screen.queryByTestId("show-inspector")).toBeNull();
  });
});

/* A-14 / GW-2: every panel the column hosts opens the column, even with the
   inspector hidden (was a source-text check). */
describe("StudioPanels — the column opens for every panel it hosts", () => {
  it("a column tab and Issues each open a hidden inspector's column", () => {
    const composer = makeComposer();
    const { rerender } = render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR));
    expect(screen.queryByTestId("show-inspector")).not.toBeNull(); // hidden: S30's reserved column

    act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "history" }));
    expect(screen.getByTestId("column-tab-history")).toBeTruthy();
    expect(screen.queryByTestId("show-inspector")).toBeNull();

    rerender(<Harness composer={composer} issuesOpen renderIssuesPanel={() => <div data-testid="issues" />} />);
    expect(screen.getByTestId("issues")).toBeTruthy();
    expect(screen.queryByTestId("show-inspector")).toBeNull();
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

  /* C-12 / Play F2.12 302:16675: the round trip ends on the binding the
     door was opened from, not on the bare canvas. */
  it("Back to canvas reopens the inspector on the originating binding", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() =>
      composer.emit(EVENTS.UI_CMS_OPEN, {
        collectionId: "col-1",
        recordId: "rec-1",
        binding: { section: "cms-binding", property: "title" },
      }),
    );
    await screen.findByTestId("cms-workspace");
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));
    await flushFrame();
    await flushFrame();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("cms-binding");
    expect(screen.queryByTestId("show-inspector")).toBeNull();
  });

  it("a door without a binding returns to the bare canvas", async () => {
    const composer = selectingComposer(["el-1"]);
    composer.selection.select(composer.live.get("el-1")!);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
    act(() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: "col-1", recordId: "rec-1" }));
    await screen.findByTestId("cms-workspace");
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));
    await flushFrame();
    await flushFrame();
    expect(screen.getByTestId("pro-inspector").getAttribute("data-revealed")).toBe("");
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

/* 2L9 Shell/BottomBar Context=Resource area (497:99474): while CMS, Brand,
   Settings or Assets cover the canvas, the bottom bar drops the page switcher
   and says the page is still open, with the way back. */
describe("StudioPanels — bottom bar in resource areas", () => {
  it("the editor shows the page switcher in the bottom bar", () => {
    render(<Harness composer={makeComposer()} />);
    expect(screen.getByTestId("page-switcher-trigger")).toBeTruthy();
    expect(screen.queryByTestId("bottom-bar-resource")).toBeNull();
  });

  it.each(["content", "design", "settings"])(
    "resource area %s renders no page switcher; ‹ Back to Editor returns to Home",
    async (tab) => {
      const composer = selectingComposer([]);
      render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab="layers" />);
      act(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab }));
      const bar = await screen.findByTestId("bottom-bar-resource");
      expect(screen.queryByTestId("page-switcher-trigger")).toBeNull();
      expect(bar.textContent).toBe("Editor keeps Home open — return with‹ Back to Editor");

      fireEvent.click(screen.getByRole("button", { name: "‹ Back to Editor" }));

      expect(screen.queryByTestId("bottom-bar-resource")).toBeNull();
      expect(screen.queryByTestId("cms-workspace")).toBeNull();
      expect(screen.getByTestId("layout-shell").className).not.toContain("layout-shell--fullpage");
      expect(screen.getByTestId("page-switcher-trigger").textContent).toContain("Home");
    },
  );

  /* C-10 / D-10 / E-10: Brand, Settings and Assets render in the fullpage
     slot, not a window-wide portal — so the slot has to be in fullpage mode
     whenever one of them is the active surface, drawer open or not (Settings
     stays the active tab when the drawer is closed under it). */
  it.each(["design", "settings"])("%s keeps the resource-area layout with the drawer closed", (tab) => {
    const composer = selectingComposer([]);
    render(<Harness composer={composer as unknown as FakeComposer} leftPanelTab={tab} initialOpen={false} />);
    expect(screen.getByTestId("layout-shell").className).toContain("layout-shell--fullpage");
    expect(screen.getByTestId("bottom-bar-resource")).toBeTruthy();
  });
});

/* A-12 / board 145:64586: "Show outlines" is the shell's canvas-view
   preference — personal, kept across reloads, handed to the canvas (and so
   to the footer's View menu). Other overlay rows still go to the caller. */
describe("StudioPanels — the Show outlines preference (A-12)", () => {
  type OverlayChange = (overlay: string, enabled: boolean) => void;
  it("toggling outlines reaches the canvas and survives a remount; other rows pass through", () => {
    const onOverlayChange = vi.fn();
    const composer = makeComposer();
    const view = render(<Harness composer={composer} onOverlayChange={onOverlayChange} />);
    expect(canvasProps.current.showOutlines).toBe(false);
    act(() => (canvasProps.current.onOverlayChange as OverlayChange)("outlines", true));
    expect(canvasProps.current.showOutlines).toBe(true);
    expect(onOverlayChange).not.toHaveBeenCalled();
    act(() => (canvasProps.current.onOverlayChange as OverlayChange)("rulers", true));
    expect(onOverlayChange).toHaveBeenCalledWith("rulers", true);
    view.unmount();
    render(<Harness composer={makeComposer()} />);
    expect(canvasProps.current.showOutlines).toBe(true);
  });
});

describe("StudioPanels — ‹ Back to Issues after Fix › (A-39, Play F4.02 303:32650)", () => {
  const ISSUES = (onBack: () => void) => <div data-testid="issues-panel-stub" onClick={onBack} />;
  function mountAt(issuesOpen: boolean, selected: string | null, composer: FakeComposer) {
    return (
      <Harness
        composer={composer}
        issuesOpen={issuesOpen}
        renderIssuesPanel={ISSUES}
        onCloseIssues={() => {}}
        selectedElement={selected ? ({ id: selected, type: "container" } as never) : null}
      />
    );
  }

  it("a Fix › that selects an element heads the Inspector with the way back, which reopens Issues", () => {
    const composer = makeComposer();
    const open = vi.fn();
    composer.on(EVENTS.UI_OPEN_ISSUES, open);
    const { rerender } = render(mountAt(true, null, composer));
    rerender(mountAt(false, "list-1", composer));
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to Issues" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("inspector-back-to-issues")).toBeNull();
  });

  it("a plain close draws nothing, and selecting something else drops the row", () => {
    const composer = makeComposer();
    const { rerender } = render(mountAt(true, "a", composer));
    rerender(mountAt(false, "a", composer));
    expect(screen.queryByTestId("inspector-back-to-issues")).toBeNull();
    rerender(mountAt(true, "a", composer));
    rerender(mountAt(false, "b", composer));
    expect(screen.getByTestId("inspector-back-to-issues")).toBeInTheDocument();
    rerender(mountAt(false, "c", composer));
    expect(screen.queryByTestId("inspector-back-to-issues")).toBeNull();
  });
});
