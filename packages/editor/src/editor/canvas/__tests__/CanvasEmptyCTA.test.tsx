/**
 * The empty-canvas CTA, and where its two buttons lead.
 *
 * Board 65:2 draws the first-run state: one sentence, two equal routes.
 * Board 807:6558 draws what Start blank LEADS TO — the Insert drawer open, and
 * the same sentence replaced by "Drop an element from the Insert panel, or drag
 * a section." The buttons are gone there, because the next act is in the
 * drawer that just opened.
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
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasEmptyCTA } from "../CanvasEmptyCTA";

afterEach(cleanup);

const renderCTA = (started?: boolean) =>
  render(
    <CanvasEmptyCTA started={started} onBrowseTemplates={vi.fn()} onStartBlank={vi.fn()} />,
  );

describe("CanvasEmptyCTA", () => {
  it("offers the two routes as equal-weight siblings on first run", () => {
    renderCTA();
    expect(screen.getByText("Start with a template, or drop your first section.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse templates" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start blank" })).toBeInTheDocument();
  });

  it("after Start blank it points at the drawer instead of vanishing", () => {
    renderCTA(true);
    expect(
      screen.getByText("Drop an element from the Insert panel, or drag a section."),
    ).toBeInTheDocument();
  });

  it("…and drops both buttons there, because the next act is in the drawer", () => {
    renderCTA(true);
    expect(screen.queryByRole("button", { name: "Start blank" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse templates" })).not.toBeInTheDocument();
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

  it("and 'add' is still the Insert tab", () => {
    const tabs = read("../../rail/tabsConfig.ts");
    expect(tabs).toMatch(/id: "add",[\s\S]{0,200}label: "Insert"/);
  });
});
