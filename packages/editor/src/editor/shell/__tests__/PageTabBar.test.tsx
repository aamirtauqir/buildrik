/**
 * PageTabBar.test.tsx — tabs only switch (owner decision 14, 2026-09-21):
 * click / Enter / Space switch the page; right-click, ⇧F10 and F2 do
 * nothing here — rename, duplicate, homepage and delete live in the Pages
 * panel's row menu. Plus the + button and pages that arrive after mount.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import { PageTabBar } from "../PageTabBar";
import { ToastProvider } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import type { PageData } from "../../../shared/types";

type EventHandler = () => void;

function makePage(over: Partial<PageData>): PageData {
  return {
    id: "p-x",
    name: "Page",
    isHome: false,
    root: {} as PageData["root"],
    ...over,
  };
}

function makeComposer(initialPages: PageData[]) {
  let pages = [...initialPages];
  /* Lets a test load pages AFTER mount — the real sequence, and the one that
     hid the whole bar. */
  const loadPages = (next: PageData[]) => {
    pages = [...next];
    activeId = pages[0]?.id ?? null;
    emit(EVENTS.PROJECT_LOADED, {});
  };
  let activeId: string | null = pages[0]?.id ?? null;
  const handlers = new Map<string, Set<EventHandler>>();
  const emit = (ev: string, _payload?: unknown) => handlers.get(ev)?.forEach((fn) => fn());

  const elements = {
    getAllPages: vi.fn(() => pages),
    getActivePage: vi.fn(() => pages.find((p) => p.id === activeId) ?? null),
    setActivePage: vi.fn((id: string) => {
      activeId = id;
      emit(EVENTS.PROJECT_CHANGED, { type: "page:changed" });
    }),
    createPage: vi.fn((name: string) => {
      pages = [...pages, makePage({ id: `p-${pages.length + 1}-new`, name })];
      emit(EVENTS.PROJECT_CHANGED, { type: "page:created" });
    }),
    /* None of these belong to the bar any more (decision 14); a call to
       any of them is the regression this file guards against. */
    duplicatePage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    setHomePage: vi.fn(),
  };
  const composer = {
    on: (ev: string, fn: EventHandler) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: EventHandler) => {
      handlers.get(ev)?.delete(fn);
    },
    emit: vi.fn(emit),
    history: { undo: vi.fn() },
    elements,
  };
  return { composer: composer as unknown as Composer, elements, history: composer.history, loadPages };
}

const TWO_PAGES = [
  makePage({ id: "p-1", name: "Home", isHome: true }),
  makePage({ id: "p-2", name: "About" }),
];

function renderBar(composer: Composer) {
  return render(
    <ToastProvider>
      <PageTabBar composer={composer} />
    </ToastProvider>
  );
}

describe("PageTabBar", () => {
  beforeEach(() => {
    // Toast queue lives in a module-level globalThis store — reset per test.
    delete (globalThis as Record<string, unknown>).__VIBCODER_TOAST_STORE__;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders one tab per page, home page flagged in the accessible name", () => {
    const { composer } = makeComposer(TWO_PAGES);
    renderBar(composer);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Home, Homepage" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
  });

  /* Board 435:2348: the active tab's white surface reaches the bar's own
     bottom edge — the row wraps its bottom padding into a per-tab margin
     instead, so only the (invisible) resting tabs carry the 4px gap. */
  it("keeps the active tab flush with the bar bottom (board 435:2348)", () => {
    const { composer } = makeComposer(TWO_PAGES);
    renderBar(composer);
    const row = screen.getByRole("tablist").parentElement;
    expect(row?.className).not.toMatch(/tw:pb-1\b/);
    expect(screen.getByRole("tab", { name: "Home, Homepage" }).className).not.toMatch(/tw:mb-1\b/);
    expect(screen.getByRole("tab", { name: "About" }).className).toMatch(/tw:mb-1\b/);
  });

  it("renders nothing without a composer", () => {
    const { container } = render(
      <ToastProvider>
        <PageTabBar composer={null} />
      </ToastProvider>
    );
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(0);
  });

  // ── tabs only switch (decision 14) ─────────────────────────────────────────
  describe("tabs only switch", () => {
    it("click, Enter and Space switch the active page", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      /* Names carry ", unsaved changes" once the mock's PROJECT_CHANGED has
         marked the pages dirty — match the head. */
      fireEvent.click(screen.getByRole("tab", { name: /^About/ }));
      expect(elements.setActivePage).toHaveBeenLastCalledWith("p-2");
      fireEvent.keyDown(screen.getByRole("tab", { name: /^Home/ }), { key: "Enter" });
      expect(elements.setActivePage).toHaveBeenLastCalledWith("p-1");
      fireEvent.keyDown(screen.getByRole("tab", { name: /^About/ }), { key: " " });
      expect(elements.setActivePage).toHaveBeenLastCalledWith("p-2");
    });

    it("right-click and ⇧F10 open no menu — the row menu lives in the Pages panel", () => {
      const { composer } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      expect(screen.queryByRole("menu")).toBeNull();
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F10", shiftKey: true });
      expect(screen.queryByRole("menu")).toBeNull();
      expect(screen.queryByRole("menuitem")).toBeNull();
    });

    it("F2 starts no inline rename; the name stays a label", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(screen.getByTestId("page-tab-name-p-2")).toHaveTextContent("About");
      expect(elements.updatePage).not.toHaveBeenCalled();
    });

    it("never duplicates, deletes or re-homes a page from here", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "Delete" });
      expect(elements.duplicatePage).not.toHaveBeenCalled();
      expect(elements.deletePage).not.toHaveBeenCalled();
      expect(elements.setHomePage).not.toHaveBeenCalled();
    });
  });

  /* Decision #19: "+" opens the New-page modal like every Add-page door; it
     no longer creates a page by itself. */
  it("'+' asks for the New-page modal and creates nothing", () => {
    const { composer, elements } = makeComposer(TWO_PAGES);
    renderBar(composer);
    fireEvent.click(screen.getByRole("button", { name: "Add new page" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_NEW_PAGE_REQUESTED, {});
    expect(elements.createPage).not.toHaveBeenCalled();
  });

});

/* The bar mounts against an empty project and the pages arrive after: the
   project load emits PROJECT_LOADED, which this component did not listen for,
   so a plain page load produced NO tab bar at all — it appeared only once some
   unrelated edit happened to fire PROJECT_CHANGED. Board 435:2348 draws the
   bar at the canvas foot on every load. */
describe("PageTabBar — pages that arrive after mount", () => {
  it("renders once the project finishes loading", async () => {
    const { composer, loadPages } = makeComposer([]);
    renderBar(composer);

    // Nothing to show yet — this is the state the bar was stuck in.
    expect(screen.queryByRole("tab")).toBeNull();

    act(() => {
      loadPages([
        makePage({ id: "p-1", name: "Home", isHome: true }),
        makePage({ id: "p-2", name: "About" }),
      ]);
    });

    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument());
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});
