/**
 * LayerContextMenu — the selection's menu (board 6881:71323 "context-menu ·
 * 3 selected"). With the clicked row inside a 2+ selection every element row
 * names the count; Rename stands down; Group wakes up. Outside the selection
 * the menu is the single row's. Replaces the LayerSelectionBanner asserts
 * (audit G2-068; the banner is deleted).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LayerContextMenu } from "../LayerContextMenu";

afterEach(cleanup);

const mount = (over: Partial<React.ComponentProps<typeof LayerContextMenu>> = {}) => {
  const onAction = vi.fn();
  const onClose = vi.fn();
  render(
    <LayerContextMenu
      x={10}
      y={10}
      nodeId="lx-heading"
      nodeName="Heading"
      selectedCount={3}
      inSelection
      hasClipboard={false}
      onAction={onAction}
      onClose={onClose}
      {...over}
    />,
  );
  return { onAction, onClose };
};

describe("LayerContextMenu — 3 selected, clicked row inside", () => {
  it("names the count on every element row", () => {
    mount();
    expect(screen.getByRole("menu", { name: "Actions for 3 elements" })).toBeTruthy();
    for (const [id, text] of [
      ["layer-menu-cut", "Cut · 3 elements"],
      ["layer-menu-copy", "Copy · 3 elements"],
      ["layer-menu-duplicate", "Duplicate · 3 elements"],
      ["layer-menu-delete", "Delete · 3 elements"],
      ["layer-menu-group", "Group · 3 elements"],
      ["layer-menu-move-to-page", "Move to page… · 3 elements"],
    ]) {
      expect(screen.getByTestId(id)).toHaveTextContent(text);
    }
    expect(screen.getByTestId("layer-menu-paste")).toHaveTextContent(/^Paste$/);
    // The link is the clicked row's, even inside a selection.
    expect(screen.getByTestId("layer-menu-copy-link")).toHaveTextContent(/^Copy link · Heading$/);
  });

  it("4418:79546 order: Cut Copy Paste | Duplicate Delete | Rename Group | Move to page… Copy link", () => {
    mount({ inSelection: false });
    const rows = screen.getAllByRole("menuitem").map((b) => b.getAttribute("data-testid"));
    expect(rows).toEqual([
      "layer-menu-cut", "layer-menu-copy", "layer-menu-paste",
      "layer-menu-duplicate", "layer-menu-delete",
      "layer-menu-rename", "layer-menu-group",
      "layer-menu-move-to-page", "layer-menu-copy-link",
    ]);
  });

  it("Rename stands down (one layer at a time); Group is live", () => {
    mount();
    expect(screen.getByTestId("layer-menu-rename")).toBeDisabled();
    expect(screen.getByTestId("layer-menu-group")).not.toBeDisabled();
  });

  it("Delete dispatches the action for the panel to confirm, then closes", () => {
    const { onAction, onClose } = mount();
    fireEvent.click(screen.getByTestId("layer-menu-delete"));
    expect(onAction).toHaveBeenCalledWith("delete", "lx-heading");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("LayerContextMenu — clicked row outside the selection", () => {
  it("is the single row's menu: rows name the layer (4418:79546), Rename and Group live (4418:82409 groups one)", () => {
    mount({ inSelection: false });
    expect(screen.getByRole("menu", { name: "Actions for Heading" })).toBeTruthy();
    expect(screen.getByTestId("layer-menu-cut")).toHaveTextContent(/^Cut · Heading$/);
    expect(screen.getByTestId("layer-menu-delete")).toHaveTextContent(/^Delete · Heading$/);
    expect(screen.getByTestId("layer-menu-move-to-page")).toHaveTextContent(/^Move to page… · Heading$/);
    expect(screen.getByTestId("layer-menu-rename")).not.toBeDisabled();
    expect(screen.getByTestId("layer-menu-group")).toHaveTextContent(/^Group · Heading$/);
    expect(screen.getByTestId("layer-menu-group")).not.toBeDisabled();
  });

  it("one row selected reads the same way", () => {
    mount({ selectedCount: 1, inSelection: true });
    expect(screen.getByTestId("layer-menu-cut")).toHaveTextContent(/^Cut · Heading$/);
    expect(screen.getByTestId("layer-menu-group")).not.toBeDisabled();
  });
});

/* DQ-018: the menu is chrome-ui's Menu — one roving tab stop, focus on the
   first row at open, ↓ / End move it (disabled rows are skipped). */
describe("LayerContextMenu — chrome-ui Menu keyboard contract", () => {
  it("focuses Cut on open; ↓ skips the disabled Paste; End lands on Copy link", () => {
    mount({ hasClipboard: false });
    const menu = screen.getByRole("menu");
    expect(document.activeElement).toBe(screen.getByTestId("layer-menu-cut"));
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("layer-menu-copy"));
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("layer-menu-duplicate"));
    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement).toBe(screen.getByTestId("layer-menu-copy-link"));
    const stops = screen.getAllByRole("menuitem").filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
  });
});

/* 2L9 217:42918 (B6-K22): an instance row's menu leads with the link to its
   main component and Detach instance. Only for one row — a link opens one. */
describe("LayerContextMenu — an instance row (B6-K22)", () => {
  it("leads with Go to main component › and Detach instance", () => {
    const { onAction } = mount({ inSelection: false, selectedCount: 1, nodeId: "hero-1", nodeName: "Hero card", isInstance: true });
    const items = screen.getAllByRole("menuitem").map((n) => n.getAttribute("data-testid"));
    expect(items.slice(0, 2)).toEqual(["layer-menu-go-to-main", "layer-menu-detach-instance"]);
    expect(screen.getByTestId("layer-menu-go-to-main").textContent).toBe("Go to main component ›");
    expect(screen.getByTestId("layer-menu-detach-instance").textContent).toBe("Detach instance");
    fireEvent.click(screen.getByTestId("layer-menu-go-to-main"));
    expect(onAction).toHaveBeenCalledWith("goToMain", "hero-1");
  });

  it("a plain element or a multi-selection has neither", () => {
    mount({ inSelection: false, selectedCount: 1 });
    expect(screen.queryByTestId("layer-menu-go-to-main")).toBeNull();
    cleanup();
    mount({ isInstance: true });
    expect(screen.queryByTestId("layer-menu-detach-instance")).toBeNull();
  });
});
