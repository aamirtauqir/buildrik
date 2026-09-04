// @vitest-environment jsdom
/**
 * TemplatesTab IA tests — prototype-v3 S1 information architecture
 * Verifies top-level pills are All / Site Pages / Sections / My Templates
 * (not the old industry-vertical pills).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Composer } from "@/engine";
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
  /* A band with nothing under it claims a group exists and is empty. Every
     entry in today's catalog is a page template, so "SECTION TEMPLATES" was a
     header over blank panel — and this test used to require it. Boards
     782:4402 and 1138:13413 draw no bands when nothing is listed. */
  it("drawer default (board 641:2487): compact gallery, no pills, Browse-all footer", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.getByTestId("tpl-drawer-gallery")).toBeInTheDocument();
    expect(screen.getByText("PAGE TEMPLATES")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "All" })).not.toBeInTheDocument();
  });

  it("shows a group band only when that group has something in it", () => {
    render(<TemplatesTab composer={null} />);
    const bands = ["PAGE TEMPLATES", "SECTION TEMPLATES"] as const;
    for (const band of bands) {
      const header = screen.queryByText(band);
      if (!header) continue;
      // A rendered band must be followed by at least one row of its own kind.
      const prefix = band === "PAGE TEMPLATES" ? "tpl-card-" : "tpl-row-";
      expect(
        document.querySelectorAll(`[data-testid^="${prefix}"]`).length,
        `${band} rendered with nothing under it`,
      ).toBeGreaterThan(0);
    }
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
   "From template" hands `newPageMode` down as a PROP so this panel promises a
   new page; without it the gallery's apply path replaces the current one.
   (It used to be an event — which could never be heard, because TabRouter
   mounts one tab at a time and the listener did not exist when the emit
   fired. Found live 2026-08-28.) */
describe("TemplatesTab — new-page mode", () => {
  const bareComposer = () =>
    ({
      on: () => {},
      off: () => {},
      emit: () => {},
      elements: { getActivePage: () => null },
    }) as unknown as Composer;

  it("switches to the new-page header when the entry point sets the prop", () => {
    const composer = bareComposer();
    const { rerender } = render(<TemplatesTab composer={composer} isExpanded />);
    expect(screen.queryByText("Choose a template for your new page")).toBeNull();

    rerender(<TemplatesTab composer={composer} isExpanded newPageMode />);

    expect(screen.getByText("Choose a template for your new page")).toBeInTheDocument();
    expect(screen.getByText("New Page")).toBeInTheDocument();
  });

  it("plain mounts stay in gallery mode — the prop's absence is the reset", () => {
    render(<TemplatesTab composer={bareComposer()} isExpanded />);
    expect(screen.queryByText("Choose a template for your new page")).toBeNull();
  });

  /* Board 807:7252 draws the search bar open with no toggle icon anywhere on
     the header — a picker whose only door out is "know to click the
     magnifying glass first" fails the board silently. The plain Templates
     tab keeps its icon-toggle (no board evidence it should change). */
  it("search input is visible without a toggle click (board 807:7252)", () => {
    render(<TemplatesTab composer={bareComposer()} isExpanded newPageMode />);
    expect(screen.getByRole("textbox", { name: "Search templates" })).toBeInTheDocument();
  });

  it("plain expanded view keeps search behind its header toggle", () => {
    render(<TemplatesTab composer={bareComposer()} isExpanded />);
    expect(screen.queryByRole("textbox", { name: "Search templates" })).toBeNull();
  });
});
