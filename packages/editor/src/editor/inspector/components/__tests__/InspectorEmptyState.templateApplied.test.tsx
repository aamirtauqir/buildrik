/**
 * InspectorEmptyState — post-apply banner, board 1175:4841.
 *
 * The Figma frame itself is annotated "UNBUILDABLE as shipped — the
 * appliedName branch exists but nothing writes buildrick-last-applied-
 * template": grep confirms no template-apply flow in this codebase sets that
 * key (only a storageMigration.ts rename of the OLD key name). That wiring
 * gap is outside the Inspector/Compare/Modal lane this file lives in, so it
 * stays unfixed here — these tests seed the key directly, the same way the
 * component's own read requires, to cover the render this branch produces
 * once something upstream does set it.
 *
 * Geometry (not asserted by jsdom, which has no layout engine) was measured
 * live at 1440x900 against board 1175:4841 after seeding the key: banner
 * 267x90 vs board's 268x87, title/name/tip text sizes match (12/11/11px),
 * and the button is 112.6x27 vs the board's 113x27 — the `h-8` flowbite
 * floor that was fixed by adding `tw:h-auto` to APPLIED_ACTION.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InspectorEmptyState } from "../InspectorEmptyState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeComposer = () => ({ emit: vi.fn() }) as any;

const KEY = "buildrick-last-applied-template";

const seed = (name: string, ts = Date.now()) => {
  localStorage.setItem(KEY, JSON.stringify({ name, ts }));
};

describe("InspectorEmptyState — template applied", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("shows the applied template's name with the board's exact banner copy", () => {
    seed("Bistro Landing");
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.getByText("Template applied!")).toBeTruthy();
    expect(screen.getByText("Bistro Landing")).toBeTruthy();
  });

  it("offers Set Brand Colors, routed to the design panel", () => {
    seed("Bistro Landing");
    const composer = makeComposer();
    render(<InspectorEmptyState composer={composer} />);
    const btn = screen.getByRole("button", { name: /set brand colors/i });
    fireEvent.click(btn);
    expect(composer.emit).toHaveBeenCalledWith("ui:open-design-panel", {});
  });

  it("falls back to the no-selection state once 30 minutes have passed", () => {
    seed("Bistro Landing", Date.now() - 31 * 60 * 1000);
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.queryByText("Template applied!")).toBeNull();
    expect(screen.getByText("Select something on the canvas to edit it.")).toBeTruthy();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("ignores a malformed stored value instead of throwing", () => {
    localStorage.setItem(KEY, "{not json");
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.getByText("Select something on the canvas to edit it.")).toBeTruthy();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
