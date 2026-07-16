// @vitest-environment jsdom
/**
 * usePages — CRUD hook behavior: composer sync, PROJECT_CHANGED filtering,
 * guard-checked actions, toasts, clipboard, load-error recovery.
 *
 * Component-level Pages tests live in PagesTab.test.tsx / PageRow.test.tsx.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { addToastMock } = vi.hoisted(() => ({ addToastMock: vi.fn() }));

vi.mock("@/editor/shared/vibcoder", () => ({
  useToast: () => ({ addToast: addToastMock, removeToast: vi.fn(), toasts: [] }),
}));

import { usePages } from "../usePages";
import { EVENTS } from "@/shared/constants/events";
import {
  createMockComposer,
  pg,
  type MockComposer,
} from "@/editor/sidebar/__tests__/test-utils/mockComposer";

interface ToastArg {
  title?: string;
  description?: string;
  tone?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const lastToast = (): ToastArg | undefined =>
  addToastMock.mock.calls.at(-1)?.[0] as ToastArg | undefined;

function defineClipboard(value: { writeText: Mock } | undefined) {
  Object.defineProperty(window.navigator, "clipboard", {
    value,
    configurable: true,
  });
}

function setup(composer: MockComposer) {
  return renderHook(() => usePages(composer));
}

beforeEach(() => {
  addToastMock.mockClear();
});

afterEach(() => {
  defineClipboard(undefined);
});

// ── Initial sync ─────────────────────────────────────────────────────────────

describe("usePages initial sync", () => {
  it("maps composer pages: active flag, home flag, and visibility status", () => {
    const composer = createMockComposer({
      pages: [
        pg("p1", "Home", { isHome: true }),
        pg("p2", "About", { settings: { visibility: "live" } }),
      ],
    });
    const { result } = setup(composer);

    expect(result.current.pages).toHaveLength(2);
    expect(result.current.activePageId).toBe("p1");
    expect(result.current.pages[0]).toMatchObject({
      id: "p1",
      name: "Home",
      slug: "home",
      isHome: true,
      isActive: true,
    });
    expect(result.current.pages[1]).toMatchObject({
      id: "p2",
      status: "live",
      isActive: false,
    });
    expect(result.current.loadError).toBeNull();
  });

  it('defaults status to "draft" when settings.visibility is unset (CAN-013)', () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);
    expect(result.current.pages[0].status).toBe("draft");
  });

  it("derives slug from name when the page has no slug", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "My Big Page", { slug: undefined })],
    });
    const { result } = setup(composer);
    expect(result.current.pages[0].slug).toBe("my-big-page");
  });
});

// ── PROJECT_CHANGED filtering ────────────────────────────────────────────────

describe("usePages PROJECT_CHANGED handler", () => {
  it("re-syncs on page:* payload types", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);
    expect(result.current.pages).toHaveLength(1);

    composer._pages.push({ id: "p2", name: "About", slug: "about" });
    act(() => composer._emit(EVENTS.PROJECT_CHANGED, { type: "page:update" }));
    expect(result.current.pages).toHaveLength(2);
  });

  it("re-syncs when payload.type is missing", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    composer._pages.push({ id: "p2", name: "About", slug: "about" });
    act(() => composer._emit(EVENTS.PROJECT_CHANGED));
    expect(result.current.pages).toHaveLength(2);
  });

  it("ignores element-level payload types (no re-sync)", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    composer._pages.push({ id: "p2", name: "About", slug: "about" });
    act(() => composer._emit(EVENTS.PROJECT_CHANGED, { type: "element:update" }));
    expect(result.current.pages).toHaveLength(1);

    // The same mutation IS picked up once a page:* event arrives.
    act(() => composer._emit(EVENTS.PROJECT_CHANGED, { type: "page:add" }));
    expect(result.current.pages).toHaveLength(2);
  });
});

// ── addPage ──────────────────────────────────────────────────────────────────

describe("usePages addPage", () => {
  it("calls elements.createPage with default name + slug and enters rename mode on the new id", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    act(() => result.current.addPage());

    // 1 existing page → getDefaultPageName returns "About"
    expect(composer.elements.createPage).toHaveBeenCalledWith("About", { slug: "about" });
    // Mock harness assigns pg-new-1; renamingPageId comes from createPage's return
    expect(result.current.renamingPageId).toBe("pg-new-1");
    expect(result.current.pages).toHaveLength(2);
  });

  it("shows an error toast and does not enter rename mode when createPage throws", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (composer.elements.createPage as unknown as Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    const { result } = setup(composer);

    act(() => result.current.addPage());

    expect(lastToast()).toMatchObject({
      description: "Couldn't add page right now. Try again.",
      tone: "error",
    });
    expect(result.current.renamingPageId).toBeNull();
    consoleSpy.mockRestore();
  });
});

// ── commitRename ─────────────────────────────────────────────────────────────

describe("usePages commitRename", () => {
  it("trims the name, calls updatePage, and exits rename mode", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    act(() => result.current.startRename("p1"));
    expect(result.current.renamingPageId).toBe("p1");

    act(() => result.current.commitRename("p1", "  Landing  "));
    expect(composer.elements.updatePage).toHaveBeenCalledWith("p1", { name: "Landing" });
    expect(result.current.renamingPageId).toBeNull();
  });

  it("does not call updatePage for an empty/whitespace name but still exits rename mode", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    act(() => result.current.startRename("p1"));
    act(() => result.current.commitRename("p1", "   "));

    expect(composer.elements.updatePage).not.toHaveBeenCalled();
    expect(result.current.renamingPageId).toBeNull();
  });
});

// ── deletePage guards ────────────────────────────────────────────────────────

describe("usePages deletePage", () => {
  it("blocks deleting the last page with a warning toast", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home", { isHome: true })] });
    const { result } = setup(composer);

    act(() => result.current.deletePage("p1"));

    expect(composer.elements.deletePage).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({
      description: "Can't delete — your site needs at least 1 page",
      tone: "warning",
    });
  });

  it("blocks deleting the homepage with a warning toast", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home", { isHome: true }), pg("p2", "About")],
    });
    const { result } = setup(composer);

    act(() => result.current.deletePage("p1"));

    expect(composer.elements.deletePage).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({
      description: "Set another page as Homepage before deleting this one",
      tone: "warning",
    });
  });

  it("deletes a normal page and offers Undo wired to history.undo", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home", { isHome: true }), pg("p2", "About")],
    });
    const { result } = setup(composer);

    act(() => result.current.deletePage("p2"));

    expect(composer.elements.deletePage).toHaveBeenCalledWith("p2");
    const toast = lastToast();
    expect(toast).toMatchObject({ description: '"About" deleted', tone: "info" });
    expect(toast?.action?.label).toBe("Undo");

    act(() => toast?.action?.onClick());
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
  });
});

// ── duplicatePage ────────────────────────────────────────────────────────────

describe("usePages duplicatePage", () => {
  it("delegates to elements.duplicatePage without toasting on success", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    act(() => result.current.duplicatePage("p1"));

    expect(composer.elements.duplicatePage).toHaveBeenCalledWith("p1");
    expect(addToastMock).not.toHaveBeenCalled();
    expect(result.current.pages).toHaveLength(2);
    expect(result.current.pages[1].name).toBe("Home Copy");
  });

  it("warns when duplicatePage returns null (source not found)", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);

    act(() => result.current.duplicatePage("missing-id"));

    expect(lastToast()).toMatchObject({
      description: "Couldn't duplicate — source page not found.",
      tone: "warning",
    });
  });
});

// ── setHomepage ──────────────────────────────────────────────────────────────

describe("usePages setHomepage", () => {
  it("blocks external-status pages with a warning toast", () => {
    const composer = createMockComposer({
      pages: [
        pg("p1", "Home", { isHome: true }),
        pg("p2", "Docs", { settings: { visibility: "external" } }),
      ],
    });
    const { result } = setup(composer);

    act(() => result.current.setHomepage("p2"));

    expect(composer.elements.setHomePage).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({
      description: "External link pages can't be set as the homepage.",
      tone: "warning",
    });
  });

  it("calls elements.setHomePage and toasts success for a normal page", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home", { isHome: true }), pg("p2", "About")],
    });
    const { result } = setup(composer);

    act(() => result.current.setHomepage("p2"));

    expect(composer.elements.setHomePage).toHaveBeenCalledWith("p2");
    expect(lastToast()).toMatchObject({
      description: "Homepage updated. Your navigation menu may need updating manually.",
      tone: "success",
    });
  });
});

// ── copyPageLink ─────────────────────────────────────────────────────────────

describe("usePages copyPageLink", () => {
  it("shows an info toast and leaves the clipboard untouched when there is no domain", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home")],
      projectMetadata: { domain: null },
    });
    const writeText = vi.fn(() => Promise.resolve());
    defineClipboard({ writeText });
    const { result } = setup(composer);

    act(() => result.current.copyPageLink("p1"));

    expect(writeText).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({ title: "No address yet", tone: "info" });
  });

  it("writes https://<domain>/<slug> to the clipboard and toasts the copied link", async () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home")],
      projectMetadata: { domain: "example.com" },
    });
    const writeText = vi.fn(() => Promise.resolve());
    defineClipboard({ writeText });
    const { result } = setup(composer);

    act(() => result.current.copyPageLink("p1"));

    expect(writeText).toHaveBeenCalledWith("https://example.com/home");
    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        description: "Link copied: https://example.com/home",
        tone: "success",
      })
    );
  });

  it("falls back to a copy-manually toast when navigator.clipboard is unavailable", () => {
    const composer = createMockComposer({
      pages: [pg("p1", "Home")],
      projectMetadata: { domain: "example.com" },
    });
    defineClipboard(undefined);
    const { result } = setup(composer);

    act(() => result.current.copyPageLink("p1"));

    expect(lastToast()).toMatchObject({
      description: "Copy manually: https://example.com/home",
      tone: "info",
    });
  });
});

// ── loadError + retrySync ────────────────────────────────────────────────────

describe("usePages load error recovery", () => {
  it("sets loadError when getAllPages throws, retrySync clears it via re-sync", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const getAllPages = composer.elements.getAllPages as unknown as Mock;
    getAllPages.mockImplementation(() => {
      throw new Error("boom");
    });

    const { result } = setup(composer);
    expect(result.current.loadError).toBe("Couldn't load your pages");
    expect(result.current.pages).toHaveLength(0);

    getAllPages.mockImplementation(() => composer._pages);
    act(() => result.current.retrySync());

    expect(result.current.loadError).toBeNull();
    expect(result.current.pages).toHaveLength(1);
  });
});

// ── Derived values ───────────────────────────────────────────────────────────

describe("usePages derived values", () => {
  it("isOnlyPage is true with exactly 1 page, canSearch false below 5", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home")] });
    const { result } = setup(composer);
    expect(result.current.isOnlyPage).toBe(true);
    expect(result.current.canSearch).toBe(false);
  });

  it("canSearch flips on at 5 pages; isOnlyPage false", () => {
    const composer = createMockComposer({
      pages: [1, 2, 3, 4, 5].map((n) => pg(`p${n}`, `Page ${n}`)),
    });
    const { result } = setup(composer);
    expect(result.current.isOnlyPage).toBe(false);
    expect(result.current.canSearch).toBe(true);
  });

  it("canSearch stays false at 4 pages", () => {
    const composer = createMockComposer({
      pages: [1, 2, 3, 4].map((n) => pg(`p${n}`, `Page ${n}`)),
    });
    const { result } = setup(composer);
    expect(result.current.canSearch).toBe(false);
  });
});
