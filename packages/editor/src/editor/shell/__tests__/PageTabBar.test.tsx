/**
 * PageTabBar.test.tsx — rename flow with validation (F2 / Enter / Escape),
 * delete guards (home page + last page), set-home action, and the 8-second
 * post-delete undo window carried by the toast.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
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
  let activeId: string | null = pages[0]?.id ?? null;
  const handlers = new Map<string, Set<EventHandler>>();
  const emit = (ev: string) => handlers.get(ev)?.forEach((fn) => fn());

  const elements = {
    getAllPages: vi.fn(() => pages),
    getActivePage: vi.fn(() => pages.find((p) => p.id === activeId) ?? null),
    setActivePage: vi.fn((id: string) => {
      activeId = id;
      emit("page:changed");
    }),
    createPage: vi.fn((name: string) => {
      pages = [...pages, makePage({ id: `p-${pages.length + 1}-new`, name })];
      emit("page:created");
    }),
    updatePage: vi.fn((id: string, patch: Partial<PageData>) => {
      pages = pages.map((p) => (p.id === id ? { ...p, ...patch } : p));
      emit("page:updated");
    }),
    deletePage: vi.fn((id: string) => {
      pages = pages.filter((p) => p.id !== id);
      emit("page:deleted");
    }),
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
    history: { undo: vi.fn() },
    elements,
  };
  return { composer: composer as unknown as Composer, elements, history: composer.history };
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

  it("renders nothing without a composer", () => {
    const { container } = render(
      <ToastProvider>
        <PageTabBar composer={null} />
      </ToastProvider>
    );
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(0);
  });

  // ── rename flow ────────────────────────────────────────────────────────────
  describe("rename flow", () => {
    it("F2 on a tab starts rename with the current name prefilled", () => {
      const { composer } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      expect(screen.getByDisplayValue("About")).toBeInTheDocument();
    });

    it("Enter commits a valid rename", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      const input = screen.getByDisplayValue("About");
      fireEvent.change(input, { target: { value: "Landing Page" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(elements.updatePage).toHaveBeenCalledWith("p-2", { name: "Landing Page" });
      expect(screen.queryByDisplayValue("Landing Page")).toBeNull(); // edit mode exited
    });

    it("empty name shows the validation error and Enter does NOT commit", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      const input = screen.getByDisplayValue("About");
      fireEvent.change(input, { target: { value: "   " } });
      expect(screen.getByRole("alert")).toHaveTextContent("Page name is required");
      expect(input).toHaveAttribute("aria-invalid", "true");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(elements.updatePage).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toBeInTheDocument(); // still editing
    });

    it("short names warn but still commit on Enter", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      const input = screen.getByDisplayValue("About");
      fireEvent.change(input, { target: { value: "Hi" } });
      expect(screen.getByText("Short name — consider 3+ characters")).toBeInTheDocument();
      fireEvent.keyDown(input, { key: "Enter" });
      expect(elements.updatePage).toHaveBeenCalledWith("p-2", { name: "Hi" });
    });

    it("shows the slug preview derived from the name", () => {
      const { composer } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      fireEvent.change(screen.getByDisplayValue("About"), {
        target: { value: "Our Team!" },
      });
      expect(screen.getByText("/our-team")).toBeInTheDocument();
    });

    it("Escape cancels the rename without committing", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.keyDown(screen.getByRole("tab", { name: "About" }), { key: "F2" });
      const input = screen.getByDisplayValue("About");
      fireEvent.change(input, { target: { value: "Something else" } });
      fireEvent.keyDown(input, { key: "Escape" });
      expect(elements.updatePage).not.toHaveBeenCalled();
      expect(screen.queryByDisplayValue("Something else")).toBeNull();
      expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    });

    it("rename is also reachable from the context menu", () => {
      const { composer } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Rename/ }));
      expect(screen.getByDisplayValue("About")).toBeInTheDocument();
    });
  });

  // ── delete guards ──────────────────────────────────────────────────────────
  describe("delete guards", () => {
    it("home page cannot be deleted — warns via toast instead of confirming", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Home, Homepage" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Delete/ }));
      expect(
        screen.getByText("Set another page as Homepage before deleting this one.")
      ).toBeInTheDocument();
      expect(elements.deletePage).not.toHaveBeenCalled();
      // No confirm dialog opened.
      expect(screen.queryByText(/All content on this page will be permanently removed/)).toBeNull();
    });

    it("last page cannot be deleted — the Delete item is absent from the menu", () => {
      const { composer } = makeComposer([makePage({ id: "p-1", name: "Only", isHome: false })]);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Only" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: /Delete/ })).toBeNull();
    });

    it("non-home page delete goes through the confirm dialog", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Delete/ }));
      expect(elements.deletePage).not.toHaveBeenCalled(); // not before confirm
      expect(screen.getByText('Delete "About"?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Delete Page" }));
      expect(elements.deletePage).toHaveBeenCalledWith("p-2");
      expect(screen.queryByRole("tab", { name: "About" })).toBeNull();
    });

    it("cancelling the confirm dialog keeps the page", () => {
      const { composer, elements } = makeComposer(TWO_PAGES);
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Delete/ }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(elements.deletePage).not.toHaveBeenCalled();
      expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    });
  });

  // ── set-home ───────────────────────────────────────────────────────────────
  it("'Set as Home' calls composer.elements.setHomePage", () => {
    const { composer, elements } = makeComposer(TWO_PAGES);
    renderBar(composer);
    fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Set as Home/ }));
    expect(elements.setHomePage).toHaveBeenCalledWith("p-2");
  });

  // ── other actions ──────────────────────────────────────────────────────────
  it("'Duplicate' creates a '[Name] Copy' page", () => {
    const { composer, elements } = makeComposer(TWO_PAGES);
    renderBar(composer);
    fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Duplicate/ }));
    expect(elements.createPage).toHaveBeenCalledWith("About Copy");
  });

  it("'+' adds a page with the smart default name", () => {
    const { composer, elements } = makeComposer(TWO_PAGES);
    renderBar(composer);
    fireEvent.click(screen.getByRole("button", { name: "Add new page" }));
    expect(elements.createPage).toHaveBeenCalledWith("Page 3");
  });

  // ── 8-second undo window ───────────────────────────────────────────────────
  describe("8-second undo window after delete", () => {
    function deleteAboutPage(composer: Composer) {
      renderBar(composer);
      fireEvent.contextMenu(screen.getByRole("tab", { name: "About" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Delete/ }));
      fireEvent.click(screen.getByRole("button", { name: "Delete Page" }));
    }

    it("the delete toast exposes an Undo action that restores via history.undo", () => {
      const { composer, history } = makeComposer(TWO_PAGES);
      deleteAboutPage(composer);
      expect(screen.getByText('"About" deleted')).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(history.undo).toHaveBeenCalledTimes(1);
    });

    it("after 8 seconds the toast (and its Undo) expires — delete is final", () => {
      vi.useFakeTimers();
      const { composer, history } = makeComposer(TWO_PAGES);
      deleteAboutPage(composer);
      expect(screen.getByText('"About" deleted')).toBeInTheDocument();
      // Just before the window closes, Undo is still available.
      act(() => {
        vi.advanceTimersByTime(7900);
      });
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
      // Past the 8000ms duration the toast auto-dismisses.
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByText('"About" deleted')).toBeNull();
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
      expect(history.undo).not.toHaveBeenCalled();
    });
  });
});
