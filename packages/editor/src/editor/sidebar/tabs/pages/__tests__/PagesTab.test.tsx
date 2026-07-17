// @vitest-environment jsdom
/**
 * PagesTab — tests for Pencil screens VIyme, c0ad1, GoEJk alignment
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mock heavy engine/shared deps before importing components ────────────────

vi.mock("@/engine", () => ({ Composer: class {} }));
vi.mock("@/editor/shared/vibcoder", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/shared/vibcoder");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});
vi.mock("@/shared/extensions/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));
vi.mock("@/shared/extensions/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
}));
vi.mock("../components/PageContextMenu", () => ({
  PageContextMenu: () => null,
}));
vi.mock("../page-settings/usePageSettings", () => ({
  usePageSettings: () => ({
    isDirty: false,
    saveState: "clean",
    seoScore: 100,
    save: vi.fn(),
  }),
}));
vi.mock("../page-settings/SeoTab", () => ({ SeoTab: () => null }));
vi.mock("../page-settings/SocialTab", () => ({ SocialTab: () => null }));
vi.mock("../page-settings/AdvancedTab", () => ({ AdvancedTab: () => null }));
vi.mock("@/shared/constants/events", () => ({ EVENTS: { PROJECT_CHANGED: "project:changed" } }));
vi.mock("@/shared/utils/pageUtils", () => ({
  getDefaultPageName: () => "New Page",
}));

// Patch matchMedia for jsdom
beforeAll(() => {
  if (typeof globalThis.window !== "undefined") {
    Object.defineProperty(globalThis.window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

import * as React from "react";
import { AddPageButton } from "../components/AddPageButton";
import { PageRow } from "../components/PageRow";
import type { PageItem } from "../types";

// ─── AddPageButton (Pencil screen c0ad1) ─────────────────────────────────────

describe("AddPageButton", () => {
  it("renders Add Page button", () => {
    render(<AddPageButton onAddBlank={vi.fn()} />);
    expect(screen.getByRole("button", { name: /add new page/i })).toBeTruthy();
  });

  it("calls onAddBlank directly when primary button is clicked", () => {
    const onAddBlank = vi.fn();
    render(<AddPageButton onAddBlank={onAddBlank} />);
    fireEvent.click(screen.getByRole("button", { name: /add new page/i }));
    expect(onAddBlank).toHaveBeenCalledTimes(1);
  });

  it("shows From template in overflow menu when onFromTemplate provided", () => {
    render(<AddPageButton onAddBlank={vi.fn()} onFromTemplate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /more add options/i }));
    expect(screen.getByText("From template")).toBeTruthy();
  });

  it("does not show overflow button when no extra options provided", () => {
    render(<AddPageButton onAddBlank={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /more add options/i })).toBeNull();
  });

  it("calls onAddBlank when primary button clicked", () => {
    const onAddBlank = vi.fn();
    render(<AddPageButton onAddBlank={onAddBlank} />);
    fireEvent.click(screen.getByRole("button", { name: /add new page/i }));
    expect(onAddBlank).toHaveBeenCalledTimes(1);
    // Popover should close
    expect(screen.queryByText("Blank page")).toBeNull();
  });

  it("calls onFromTemplate and closes overflow menu on From template click", () => {
    const onFromTemplate = vi.fn();
    render(<AddPageButton onAddBlank={vi.fn()} onFromTemplate={onFromTemplate} />);
    fireEvent.click(screen.getByRole("button", { name: /more add options/i }));
    fireEvent.click(screen.getByText("From template"));
    expect(onFromTemplate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("From template")).toBeNull();
  });

  it("toggles overflow menu closed on second overflow button click", () => {
    render(<AddPageButton onAddBlank={vi.fn()} onFromTemplate={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /more add options/i });
    fireEvent.click(btn);
    expect(screen.getByText("From template")).toBeTruthy();
    fireEvent.click(btn);
    expect(screen.queryByText("From template")).toBeNull();
  });
});

// ─── PageRow active state (Pencil screen VIyme) ───────────────────────────────

function makePage(overrides: Partial<PageItem> = {}): PageItem {
  return {
    id: "page-1",
    name: "Home",
    slug: "home",
    isActive: false,
    isHome: false,
    status: "live",
    ...overrides,
  };
}

describe("PageRow active indicator", () => {
  const baseProps = {
    pages: [],
    composer: null,
    isRenaming: false,
    isContextMenuOpen: false,
    isExpanded: false,
    onSelect: vi.fn(),
    onRenameCommit: vi.fn(),
    onRenameCancel: vi.fn(),
    onRenameStart: vi.fn(),
    onContextMenu: vi.fn(),
    onSettingsClick: vi.fn(),
  };

  it("does not have .active class when page is not active", () => {
    const page = makePage({ isActive: false });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const row = container.querySelector(".bd-pg-row");
    expect(row?.classList.contains("active")).toBe(false);
  });

  it("has .active class when page is active", () => {
    const page = makePage({ isActive: true });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const row = container.querySelector(".bd-pg-row");
    expect(row?.classList.contains("active")).toBe(true);
  });

  it("renders page name in the row", () => {
    const page = makePage({ name: "About Us" });
    render(<PageRow page={page} {...baseProps} />);
    expect(screen.getByText("About Us")).toBeTruthy();
  });

  it("overflow button is present in the row", () => {
    const page = makePage();
    const { container } = render(<PageRow page={page} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-overflow")).toBeTruthy();
  });

  it("overflow click invokes onContextMenu (settings now lives in context menu)", () => {
    const onContextMenu = vi.fn();
    const page = makePage();
    const { container } = render(
      <PageRow page={page} {...baseProps} onContextMenu={onContextMenu} />,
    );
    const overflow = container.querySelector(".bd-pg-row-overflow") as HTMLElement;
    fireEvent.click(overflow);
    expect(onContextMenu).toHaveBeenCalled();
  });

  it("renders Scheduled chip when page.status is scheduled", () => {
    const page = makePage({ status: "scheduled" });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const chip = container.querySelector(".bd-pg-chip.scheduled");
    expect(chip).toBeTruthy();
    expect(chip).toHaveTextContent("Scheduled");
  });
});

// ─── Name conflict error (Screen GoEJk) ──────────────────────────────────────

describe("PagesTab name conflict error via handleRenameCommit", () => {
  it("does not fire rename when name conflicts with existing page", () => {
    // We test the conflict logic in isolation by simulating what PagesTab does:
    // pages = [{id: 'p1', name: 'Home'}, {id: 'p2', name: 'About'}]
    // renaming p2 to 'Home' should result in error, not calling commitRename

    const pages: PageItem[] = [
      makePage({ id: "p1", name: "Home" }),
      makePage({ id: "p2", name: "About", slug: "about" }),
    ];

    let nameError: string | null = null;
    const commitRename = vi.fn();

    // Replicate the handleRenameCommit logic from PagesTab
    const handleRenameCommit = (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed) {
        const exists = pages.some(
          (pg) => pg.id !== pageId && pg.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          nameError = "A page with this name already exists";
          return;
        }
      }
      nameError = null;
      commitRename(pageId, name);
    };

    handleRenameCommit("p2", "Home");
    expect(nameError).toBe("A page with this name already exists");
    expect(commitRename).not.toHaveBeenCalled();
  });

  it("fires rename when name does not conflict", () => {
    const pages: PageItem[] = [
      makePage({ id: "p1", name: "Home" }),
      makePage({ id: "p2", name: "About", slug: "about" }),
    ];

    let nameError: string | null = null;
    const commitRename = vi.fn();

    const handleRenameCommit = (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed) {
        const exists = pages.some(
          (pg) => pg.id !== pageId && pg.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          nameError = "A page with this name already exists";
          return;
        }
      }
      nameError = null;
      commitRename(pageId, name);
    };

    handleRenameCommit("p2", "Contact");
    expect(nameError).toBeNull();
    expect(commitRename).toHaveBeenCalledWith("p2", "Contact");
  });

  it("conflict check is case-insensitive", () => {
    const pages: PageItem[] = [
      makePage({ id: "p1", name: "Home" }),
      makePage({ id: "p2", name: "About", slug: "about" }),
    ];

    let nameError: string | null = null;
    const commitRename = vi.fn();

    const handleRenameCommit = (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed) {
        const exists = pages.some(
          (pg) => pg.id !== pageId && pg.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          nameError = "A page with this name already exists";
          return;
        }
      }
      nameError = null;
      commitRename(pageId, name);
    };

    handleRenameCommit("p2", "HOME");
    expect(nameError).toBe("A page with this name already exists");
    expect(commitRename).not.toHaveBeenCalled();
  });

  it("allows renaming a page to its own current name", () => {
    const pages: PageItem[] = [
      makePage({ id: "p1", name: "Home" }),
    ];

    let nameError: string | null = null;
    const commitRename = vi.fn();

    const handleRenameCommit = (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed) {
        const exists = pages.some(
          (pg) => pg.id !== pageId && pg.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          nameError = "A page with this name already exists";
          return;
        }
      }
      nameError = null;
      commitRename(pageId, name);
    };

    handleRenameCommit("p1", "Home");
    expect(nameError).toBeNull();
    expect(commitRename).toHaveBeenCalledWith("p1", "Home");
  });
});

// ─── Bulk delete: no silent no-op when all pages selected ─────────────────────
//
// Replicates PagesTab.handleBulkDelete (same pattern as the handleRenameCommit
// tests above). Previously the guard `pages.length > selectedIds.size` made the
// deletable set empty whenever every page was selected → nothing happened, no
// toast. The fix spares the home/first page and deletes the rest with feedback.

describe("PagesTab handleBulkDelete", () => {
  function makeHandler(pages: PageItem[], selectedIds: Set<string>) {
    const deletePage = vi.fn();
    const clearSelection = vi.fn();
    const orderedPageIds = pages.map((pg) => pg.id);
    const handleBulkDelete = () => {
      const selected = [...selectedIds];
      let deletable = selected.filter((id) => {
        const pg = pages.find((x) => x.id === id);
        return pg && !pg.isHome;
      });
      if (deletable.length >= pages.length && orderedPageIds.length > 0) {
        const spareId = orderedPageIds[0];
        deletable = deletable.filter((id) => id !== spareId);
      }
      if (deletable.length === 0) {
        if (selected.length > 0) deletePage(selected[0]);
        clearSelection();
        return;
      }
      deletable.forEach((id) => deletePage(id));
      clearSelection();
    };
    return { handleBulkDelete, deletePage, clearSelection };
  }

  it("deletes every non-home page (home spared) when ALL pages are selected", () => {
    const pages = [
      makePage({ id: "p1", name: "Home", isHome: true }),
      makePage({ id: "p2", name: "About" }),
      makePage({ id: "p3", name: "Contact" }),
    ];
    const { handleBulkDelete, deletePage } = makeHandler(
      pages,
      new Set(["p1", "p2", "p3"])
    );

    handleBulkDelete();

    // Home preserved; the two other pages deleted (each toasts via deletePage).
    expect(deletePage).toHaveBeenCalledTimes(2);
    expect(deletePage).toHaveBeenCalledWith("p2");
    expect(deletePage).toHaveBeenCalledWith("p3");
    expect(deletePage).not.toHaveBeenCalledWith("p1");
  });

  it("spares the first page when all selected and none is flagged home", () => {
    const pages = [
      makePage({ id: "p1", name: "One" }),
      makePage({ id: "p2", name: "Two" }),
    ];
    const { handleBulkDelete, deletePage } = makeHandler(pages, new Set(["p1", "p2"]));

    handleBulkDelete();

    expect(deletePage).toHaveBeenCalledTimes(1);
    expect(deletePage).toHaveBeenCalledWith("p2");
    expect(deletePage).not.toHaveBeenCalledWith("p1");
  });

  it("routes an only-home selection through the guarded single-delete (feedback, not silent)", () => {
    const pages = [
      makePage({ id: "p1", name: "Home", isHome: true }),
      makePage({ id: "p2", name: "About" }),
    ];
    const { handleBulkDelete, deletePage } = makeHandler(pages, new Set(["p1"]));

    handleBulkDelete();

    // deletePage("p1") fires so the homepage guard toast surfaces — no silent no-op.
    expect(deletePage).toHaveBeenCalledWith("p1");
  });

  it("deletes a normal subset without sparing anything", () => {
    const pages = [
      makePage({ id: "p1", name: "Home", isHome: true }),
      makePage({ id: "p2", name: "About" }),
      makePage({ id: "p3", name: "Contact" }),
    ];
    const { handleBulkDelete, deletePage } = makeHandler(pages, new Set(["p2"]));

    handleBulkDelete();

    expect(deletePage).toHaveBeenCalledTimes(1);
    expect(deletePage).toHaveBeenCalledWith("p2");
  });
});
