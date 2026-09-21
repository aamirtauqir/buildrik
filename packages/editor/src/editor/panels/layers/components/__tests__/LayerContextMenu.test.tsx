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
    ]) {
      expect(screen.getByTestId(id)).toHaveTextContent(text);
    }
    expect(screen.getByTestId("layer-menu-paste")).toHaveTextContent(/^Paste$/);
    expect(screen.getByTestId("layer-menu-copy-link")).toHaveTextContent(/^Copy link$/);
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
  it("is the single row's menu: no counts, Rename live, Group off", () => {
    mount({ inSelection: false });
    expect(screen.getByRole("menu", { name: "Actions for Heading" })).toBeTruthy();
    expect(screen.getByTestId("layer-menu-cut")).toHaveTextContent(/^Cut$/);
    expect(screen.getByTestId("layer-menu-delete")).toHaveTextContent(/^Delete$/);
    expect(screen.getByTestId("layer-menu-rename")).not.toBeDisabled();
    expect(screen.getByTestId("layer-menu-group")).toBeDisabled();
  });

  it("one row selected reads the same way", () => {
    mount({ selectedCount: 1, inSelection: true });
    expect(screen.getByTestId("layer-menu-cut")).toHaveTextContent(/^Cut$/);
    expect(screen.getByTestId("layer-menu-group")).toBeDisabled();
  });
});
