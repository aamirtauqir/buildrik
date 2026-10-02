/**
 * P-6 follow-up — only an OPEN editor popup takes Escape away from the canvas
 * selection. Customer markup on the canvas carries ARIA roles too (the Modal
 * block stamps `role="dialog"`, navbars carry `role="menu"`), and a listbox
 * that is simply mounted — the Templates grid, the media asset grid — is not
 * a popup. Neither may stand the engine's "deselect" down, nor keep the
 * right-column panel from closing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, fireEvent, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandCenter } from "@/engine/commands/CommandCenter";
import type { Composer } from "@/engine";
import { useColumnPanelEscape } from "../useColumnPanelEscape";

function boot() {
  const composer = {
    readOnly: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    selection: { getSelectedIds: vi.fn(() => ["el-1"]), clear: vi.fn() },
    elements: { getElement: vi.fn(() => null) },
  };
  centers.push(new CommandCenter(composer as unknown as Composer));
  return composer;
}

const centers: CommandCenter[] = [];
afterEach(() => {
  cleanup();
  centers.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = "";
});

function mount(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

const CANVAS_MODAL =
  '<div class="buildrick-canvas" data-buildrick-canvas="true"><div data-buildrick-id="m1" role="dialog" aria-modal="true">Modal block</div></div>';
const CANVAS_NAV_MENU =
  '<div class="buildrick-canvas"><nav data-buildrick-id="n1"><ul role="menu"><li role="menuitem">Home</li></ul></nav></div>';
const TEMPLATES_GRID = '<div class="tpl-grid" role="listbox" aria-label="Available templates"></div>';
const OPEN_SELECT =
  '<button aria-haspopup="listbox" aria-expanded="true" aria-controls="font-list">Font</button><div id="font-list" role="listbox"></div>';

describe("CommandCenter deselect — only open editor popups stand it down", () => {
  it("a role=dialog inside the canvas (the Modal block) does not keep the selection", () => {
    const composer = boot();
    mount(CANVAS_MODAL);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });

  it("a role=menu inside the canvas (a navbar) does not keep the selection", () => {
    const composer = boot();
    mount(CANVAS_NAV_MENU);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });

  it("a mounted Templates-style listbox grid does not keep the selection", () => {
    const composer = boot();
    mount(TEMPLATES_GRID);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });

  it("an open editor menu keeps the selection", () => {
    const composer = boot();
    mount('<div role="menu"><button role="menuitem">Duplicate</button></div>');
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).not.toHaveBeenCalled();
  });

  it("an open select-style listbox (expanded trigger) keeps the selection", () => {
    const composer = boot();
    mount(OPEN_SELECT);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).not.toHaveBeenCalled();
  });
});

function Column({ onClose }: { onClose: () => void }) {
  useColumnPanelEscape(true, onClose);
  return <button>Review</button>;
}

describe("useColumnPanelEscape — same rule for the column panel", () => {
  it.each([
    ["a canvas Modal block", CANVAS_MODAL],
    ["a mounted Templates grid", TEMPLATES_GRID],
  ])("%s does not keep the panel open", (_label, html) => {
    const onClose = vi.fn();
    mount(html);
    render(<Column onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Review" }), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("an open select-style listbox takes the Escape first", () => {
    const onClose = vi.fn();
    mount(OPEN_SELECT);
    render(<Column onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Review" }), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
