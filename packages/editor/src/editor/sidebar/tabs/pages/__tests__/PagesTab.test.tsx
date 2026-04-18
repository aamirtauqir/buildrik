// @vitest-environment jsdom
/**
 * PagesTab — tests for Pencil screens VIyme, c0ad1, GoEJk alignment
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mock heavy engine/shared deps before importing components ────────────────

vi.mock("@/engine", () => ({ Composer: class {} }));
vi.mock("@/shared/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/shared/ui/Modal", () => ({
  ConfirmDialog: () => null,
}));
vi.mock("@/editor/sidebar/shared/PanelHeader", () => ({
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

  it("does not have pg-row--active class when page is not active", () => {
    const page = makePage({ isActive: false });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const row = container.querySelector(".pg-row");
    expect(row?.classList.contains("pg-row--active")).toBe(false);
  });

  it("has pg-row--active class when page is active", () => {
    const page = makePage({ isActive: true });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const row = container.querySelector(".pg-row");
    expect(row?.classList.contains("pg-row--active")).toBe(true);
  });

  it("renders page name in the row", () => {
    const page = makePage({ name: "About Us" });
    render(<PageRow page={page} {...baseProps} />);
    expect(screen.getByText("About Us")).toBeTruthy();
  });

  it("gear (settings) button is present in the row", () => {
    const page = makePage();
    render(<PageRow page={page} {...baseProps} />);
    // The settings button has aria-label including "settings"
    const settingsBtn = screen.getByLabelText(/open settings for home/i);
    expect(settingsBtn).toBeTruthy();
  });

  it("calls onSettingsClick when gear button is clicked", () => {
    const onSettingsClick = vi.fn();
    const page = makePage();
    render(<PageRow page={page} {...baseProps} onSettingsClick={onSettingsClick} />);
    fireEvent.click(screen.getByLabelText(/open settings for home/i));
    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it("renders Scheduled chip when page.status is scheduled", () => {
    const page = makePage({ status: "scheduled" });
    const { container } = render(<PageRow page={page} {...baseProps} />);
    const badge = container.querySelector(".pg-row__status--scheduled");
    expect(badge).toBeTruthy();
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
