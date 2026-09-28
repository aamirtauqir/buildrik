/**
 * PagePanel — nothing selected, or the page root selected (DD-13, board 21).
 *
 * "Home · Page"; Fill (Background), Size (Max width), Typography (Font, Text
 * colour), Spacing, in that order; "SEO & social" → the page's settings on
 * SEO; "Your place here is kept"; no tabs, no context row, no Link / CMS /
 * Visibility / Interactions. Edits land on the page root in one undo step.
 * The "Template applied!" banner (board 1175:4841) moved in from the old
 * empty state and sits on top for 30 minutes after a template is applied.
 *
 * Real Composer.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within, act } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { PagePanel } from "../PagePanel";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const KEY = "buildrick-last-applied-template";

function setup() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  composer.elements.setActivePage?.(page.id);
  const heading = composer.elements.createElement("heading", { content: "Title" });
  composer.elements.addElement(heading, page.root.id);
  render(<PagePanel composer={composer} />, { wrapper: ToastProvider });
  return { composer, page };
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PagePanel — board 21", () => {
  it("names the page: path 'Home', then 'Home · Page' with ✦ AI, ⋯ and ✕", () => {
    setup();
    expect(screen.getByTestId("inspector-breadcrumb")).toHaveTextContent("Home");
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Home · Page");
    expect(screen.getByTestId("inspector-ai-chip")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-page-menu")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-hide")).toBeInTheDocument();
  });

  it("Fill, Size, Typography, Spacing — in the board's order, and nothing else", () => {
    setup();
    const panel = screen.getByTestId("inspector-page-panel");
    const ids = Array.from(panel.querySelectorAll('[data-testid^="inspector-section-"]'))
      .map((n) => n.getAttribute("data-testid"))
      .filter((id): id is string => /^inspector-section-[a-z-]+$/.test(id ?? ""));
    expect([...new Set(ids)]).toEqual([
      "inspector-section-fill",
      "inspector-section-size",
      "inspector-section-typography",
      "inspector-section-spacing",
    ]);
  });

  it("each section shows the page's subset (Background · Max width · Font + Text colour)", () => {
    setup();
    expect(within(screen.getByTestId("inspector-section-fill")).getByText("Background")).toBeInTheDocument();
    const size = screen.getByTestId("inspector-section-size");
    expect(within(size).getByText("Max width")).toBeInTheDocument();
    expect(within(size).queryByText("Width")).toBeNull();
    const type = screen.getByTestId("inspector-section-typography");
    expect(within(type).getByText("Font")).toBeInTheDocument();
    expect(within(type).getByText("Text colour")).toBeInTheDocument();
    expect(within(type).queryByText("Weight")).toBeNull();
  });

  it("no tabs, no context row, no Link / CMS / Visibility / Interactions", () => {
    setup();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText(/State:/)).toBeNull();
    for (const title of ["Link", "CMS binding", "Visibility", "Interactions"]) {
      expect(screen.queryByText(title)).toBeNull();
    }
  });

  it("SEO & social opens the page's settings on SEO; the note says your place is kept", () => {
    const { composer, page } = setup();
    const emit = vi.spyOn(composer, "emit");
    fireEvent.click(screen.getByTestId("inspector-page-seo"));
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId: page.id, tab: "seo" });
    expect(screen.getByTestId("inspector-page-seo")).toHaveTextContent("SEO & social");
    expect(screen.getByTestId("inspector-page-note")).toHaveTextContent("Your place here is kept");
  });

  it("an edit writes the page root, one undo step", () => {
    const { composer, page } = setup();
    const root = composer.elements.getElement(page.root.id)!;
    composer.history.flushPending?.(); // the setup's own steps are history, not this edit
    const maxWidth = within(screen.getByTestId("inspector-section-size")).getByRole("textbox", { name: /max width/i });
    vi.useFakeTimers();
    try {
      fireEvent.change(maxWidth, { target: { value: "1200" } });
      act(() => {
        vi.advanceTimersByTime(310); // the panel's typing debounce
      });
    } finally {
      vi.useRealTimers();
    }
    composer.history.flushPending?.();
    expect(root.getStyles()["max-width"]).toBe("1200px");
    act(() => {
      composer.history.undo();
    });
    /* Undo restores a snapshot — read the root afresh. */
    expect(composer.elements.getElement(page.root.id)!.getStyles()["max-width"]).toBeUndefined();
  });
});

describe("PagePanel — template applied (board 1175:4841)", () => {
  const seed = (name: string, ts = Date.now()) => localStorage.setItem(KEY, JSON.stringify({ name, ts }));

  it("shows the applied template's name over the page panel", () => {
    seed("Bistro Landing");
    setup();
    expect(screen.getByText("Template applied!")).toBeInTheDocument();
    expect(screen.getByText("Bistro Landing")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Home · Page");
  });

  it("offers Set Brand Colors, routed to the design panel", () => {
    seed("Bistro Landing");
    const { composer } = setup();
    const emit = vi.spyOn(composer, "emit");
    fireEvent.click(screen.getByRole("button", { name: /set brand colors/i }));
    expect(emit).toHaveBeenCalledWith("ui:open-design-panel", {});
  });

  it("is gone once 30 minutes have passed, and the stale key is dropped", () => {
    seed("Bistro Landing", Date.now() - 31 * 60 * 1000);
    setup();
    expect(screen.queryByText("Template applied!")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("ignores a malformed stored value instead of throwing", () => {
    localStorage.setItem(KEY, "{not json");
    setup();
    expect(screen.queryByText("Template applied!")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
