/**
 * The empty-canvas CTA — board 4428:44164 (Canvas · empty page): a title, one
 * sentence, three template cards, and four routes — Browse all templates ·
 * Add a block · ✦ Describe your site · Start blank (G2-018).
 *
 * Board 807:6558 draws what Start blank LEADS TO — the Insert drawer open, and
 * the sentence replaced by "Drop an element from the Insert panel, or drag a
 * section." The cards and buttons are gone there, because the next act is in
 * the drawer that just opened.
 *
 * Start blank used to hide the CTA and do nothing else, so the one button a
 * first-time user pressed left them on an empty canvas with no drawer, no
 * guidance and nothing to press. These tests pin both halves of the fix: the
 * follow-up copy, and that the buttons do not survive into it.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasEmptyCTA } from "../CanvasEmptyCTA";
import { SITE_TEMPLATES } from "@/editor/sidebar/tabs/templates/templatesData";

afterEach(cleanup);

const renderCTA = (started?: boolean) => {
  const handlers = {
    onBrowseTemplates: vi.fn(),
    onAddBlock: vi.fn(),
    onDescribe: vi.fn(),
    onStartBlank: vi.fn(),
  };
  render(<CanvasEmptyCTA started={started} {...handlers} />);
  return handlers;
};

describe("CanvasEmptyCTA — board 4428:44164", () => {
  it("names the page's state and the three ways forward", () => {
    renderCTA();
    expect(screen.getByText("This page is empty")).toBeInTheDocument();
    expect(screen.getByText("Start with a template, drop a block, or describe your site.")).toBeInTheDocument();
  });

  it("draws three template cards from the catalogue, each opening Templates", () => {
    const h = renderCTA();
    const cards = screen.getAllByTestId(/^canvas-empty-template-/);
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.textContent)).toEqual(SITE_TEMPLATES.slice(0, 3).map((t) => t.name));
    fireEvent.click(cards[1]);
    expect(h.onBrowseTemplates).toHaveBeenCalledTimes(1);
  });

  it("offers the four routes in the board's order and wires each", () => {
    const h = renderCTA();
    const actions = screen.getByTestId("canvas-empty-cta-actions");
    expect(Array.from(actions.querySelectorAll("button")).map((b) => b.textContent)).toEqual([
      "Browse all templates",
      "Add a block",
      "✦ Describe your site",
      "Start blank",
    ]);
    fireEvent.click(screen.getByTestId("canvas-empty-add-block"));
    expect(h.onAddBlock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("canvas-empty-describe"));
    expect(h.onDescribe).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("canvas-empty-start-blank"));
    expect(h.onStartBlank).toHaveBeenCalledTimes(1);
  });

  it("after Start blank it points at the drawer instead of vanishing", () => {
    renderCTA(true);
    expect(
      screen.getByText("Drop an element from the Insert panel, or drag a section."),
    ).toBeInTheDocument();
  });

  it("…and drops the cards and buttons there, because the next act is in the drawer", () => {
    renderCTA(true);
    expect(screen.queryByRole("button", { name: "Start blank" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse all templates" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("canvas-empty-cta-cards")).not.toBeInTheDocument();
  });
});

/* The transition itself is one line in Canvas.tsx, and mounting Canvas needs a
   Composer; `ui:switch-tab` is the seam StudioPanels already listens on
   (StudioPanels.tsx:303), and "add" is the Insert tab's id (tabsConfig.ts:75).
   Both ends are asserted against the source so a rename on either side fails
   here rather than silently unhooking the only door out of an empty canvas. */
describe("Start blank opens the Insert drawer", () => {
  const read = (p: string) => readFileSync(join(__dirname, p), "utf8");

  it("emits the tab-switch the shell listens for", () => {
    expect(read("../Canvas.tsx")).toMatch(/emit\("ui:switch-tab", \{ tab: "add" \}\)/);
  });

  it("and the shell is still listening for it", () => {
    expect(read("../../shell/StudioPanels.tsx")).toMatch(/composer\.on\("ui:switch-tab"/);
  });

  /* The tab is labelled "Add" since the v3 IA (Q4); this assert said
     "Insert" and was red on main from 2026-09-14 (learning: a green push
     proves nothing about vitest). The seam it guards is the ID. */
  it("and 'add' is still the Add tab", () => {
    const tabs = read("../../rail/tabsConfig.ts");
    expect(tabs).toMatch(/id: "add",[\s\S]{0,300}label: "Add"/);
  });
});
