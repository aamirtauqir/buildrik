// @vitest-environment jsdom
/**
 * TemplatesTab IA tests — prototype-v3 S1 information architecture
 * Verifies top-level pills are All / Site Pages / Sections / My Templates
 * (not the old industry-vertical pills).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";

describe("TemplatesTab — new-design IA (S1)", () => {
  it("drawer default (board 641:2487): compact gallery, no pills, Browse-all footer", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.getByTestId("tpl-drawer-gallery")).toBeInTheDocument();
    expect(screen.getByText("PAGE TEMPLATES")).toBeInTheDocument();
    expect(screen.getByText("SECTION TEMPLATES")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "All" })).not.toBeInTheDocument();
  });

  it("expanded view keeps top-level pills: All, Site Pages, Sections, My Templates", () => {
    render(<TemplatesTab composer={null} isExpanded />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Site Pages" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "My Templates" })).toBeInTheDocument();
  });

  it("clicking 'Site Pages' reveals Page Templates / Section Templates type pills", async () => {
    const user = userEvent.setup();
    render(<TemplatesTab composer={null} isExpanded />);
    await user.click(screen.getByRole("tab", { name: "Site Pages" }));
    expect(screen.getByRole("tab", { name: /Page Templates/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Section Templates/ })).toBeInTheDocument();
  });

  it("does NOT show industry-vertical pills (Landing/Portfolio/SaaS/Blog/E-comm) at top level", () => {
    render(<TemplatesTab composer={null} isExpanded />);
    expect(screen.queryByRole("tab", { name: "Landing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Portfolio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "SaaS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Blog" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "E-comm" })).not.toBeInTheDocument();
  });
});

/* Board 807:4299 vs 807:7252: the same panel, two different headers. Pages ›
   "From template" emits UI_TEMPLATES_NEWPAGE_ON so this panel promises a new
   page; without it the gallery's apply path replaces the current one. */
describe("TemplatesTab — new-page mode", () => {
  function eventComposer() {
    const handlers = new Map<string, Set<() => void>>();
    return {
      on: (ev: string, fn: () => void) => {
        if (!handlers.has(ev)) handlers.set(ev, new Set());
        handlers.get(ev)!.add(fn);
      },
      off: (ev: string, fn: () => void) => handlers.get(ev)?.delete(fn),
      emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
      elements: { getActivePage: () => null },
    } as unknown as Composer & { emit(ev: string): void };
  }

  it("switches to the new-page header when the entry point announces it", () => {
    const composer = eventComposer();
    render(<TemplatesTab composer={composer} isExpanded />);
    expect(screen.queryByText("Choose a template for your new page")).toBeNull();

    act(() => composer.emit(EVENTS.UI_TEMPLATES_NEWPAGE_ON));

    expect(screen.getByText("Choose a template for your new page")).toBeInTheDocument();
    expect(screen.getByText("New Page")).toBeInTheDocument();
  });

  it("drops new-page mode when the panel is left", () => {
    const composer = eventComposer();
    const { unmount } = render(<TemplatesTab composer={composer} isExpanded />);
    act(() => composer.emit(EVENTS.UI_TEMPLATES_NEWPAGE_ON));
    unmount();

    render(<TemplatesTab composer={composer} isExpanded />);
    expect(screen.queryByText("Choose a template for your new page")).toBeNull();
  });
});
