/**
 * Tabs — the selected tab is a tinted pill, and the row has no rule under it.
 *
 * Three boards draw it that way and none draws the underline it shipped with:
 * 1172:4867 (project settings), 1172:4825 (export) and 1164:4713 (media
 * picker) each fill the active tab with `--bk-accent-tint`, set its label to
 * `--bk-accent`, and leave the row plain white. Measured off the boards, all
 * three: `rgb(235,245,255)` on `rgb(26,86,219)`, no divider.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { Tabs } from "../index";

afterEach(cleanup);

const TABS = [
  { id: "a", label: "General" },
  { id: "b", label: "Canvas" },
  { id: "c", label: "SEO" },
];

const setup = (value = "a", onChange = vi.fn()) => {
  render(<Tabs tabs={TABS} value={value} onChange={onChange} label="Sections" />);
  return onChange;
};

describe("Tabs — the board's pill", () => {
  it("tints the selected tab instead of underlining it", () => {
    setup();
    const cls = screen.getByRole("tab", { name: "General" }).className;
    expect(cls).toContain("aria-selected:bg-[var(--bk-accent-tint)]");
    expect(cls).toContain("aria-selected:text-[var(--bk-accent-text)]");
    expect(cls).not.toContain("border-b");
  });

  it("leaves no rule under the row", () => {
    setup();
    expect(screen.getByRole("tablist").className).not.toContain("border-b");
  });
});

describe("Tabs — the WAI-ARIA contract the pill must not cost", () => {
  it("moves with the arrow keys", () => {
    const onChange = setup();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("jumps to the ends with Home and End", () => {
    const onChange = setup("b");
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "End" });
    expect(onChange).toHaveBeenCalledWith("c");
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "Home" });
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("keeps one tab stop for the whole row", () => {
    setup();
    expect(screen.getByRole("tab", { name: "General" }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("tab", { name: "Canvas" }).getAttribute("tabindex")).toBe("-1");
  });

  it("drags focus along with the selection", () => {
    // The ring stayed on the tab you arrowed AWAY from, because the row is
    // roving-tabindex and nothing moved focus — so the pill and the ring sat
    // on different tabs, and the next Tab press left the row from the wrong
    // one.
    function Harness() {
      const [v, setV] = React.useState("a");
      return <Tabs tabs={TABS} value={v} onChange={setV} />;
    }
    render(<Harness />);
    screen.getByRole("tab", { name: "General" }).focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Canvas" }));
  });

  it("skips a disabled tab when arrowing", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={[TABS[0], { ...TABS[1], disabled: true }, TABS[2]]}
        value="a"
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("c");
  });
});
