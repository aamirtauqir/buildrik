/**
 * PageRow class + chip + a11y assertions.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageRow } from "../components/PageRow";
import type { PageItem } from "../types";

const baseProps = {
  pages: [] as PageItem[],
  composer: null,
  isRenaming: false,
  onSelect: vi.fn(),
  onRenameCommit: vi.fn(),
  onRenameCancel: vi.fn(),
  onRenameStart: vi.fn(),
  onContextMenu: vi.fn(),
  onSettingsClick: vi.fn(),
};

const home: PageItem = {
  id: "p1",
  name: "Home",
  slug: "/",
  isHome: true,
  isActive: false,
  status: "live",
};

describe("PageRow", () => {
  // Board 140:2: plain rows carry NO slug, NO status chip, NO icon —
  // only Home (roof glyph) and external (link glyph) draw one.
  it("renders the name; no slug on the tree row", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-name")).toHaveTextContent("Home");
    expect(container.querySelector(".bd-pg-row-slug")).toBeNull();
  });

  it("home draws the roof glyph; a plain page draws no icon", () => {
    const { container: h } = render(<PageRow page={home} {...baseProps} />);
    expect(h.querySelector(".bd-pg-row-icon")).not.toBeNull();
    const { container: p } = render(
      <PageRow page={{ ...home, isHome: false }} {...baseProps} />,
    );
    expect(p.querySelector(".bd-pg-row-icon")).toBeNull();
  });

  it("every row leads with the always-visible checkbox (board 140:12)", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-checkbox")).not.toBeNull();
  });

  it("active variant adds .bd-pg-row.active", () => {
    const { container } = render(
      <PageRow page={{ ...home, isActive: true }} {...baseProps} />,
    );
    expect(container.querySelector(".bd-pg-row.active")).not.toBeNull();
  });

  it("nested prop adds .bd-pg-row.nested", () => {
    const { container } = render(<PageRow page={home} nested {...baseProps} />);
    expect(container.querySelector(".bd-pg-row.nested")).not.toBeNull();
  });

  it("no home/status chips on the tree row; status still announced", () => {
    const { container } = render(
      <PageRow page={{ ...home, status: "draft", isHome: false }} {...baseProps} />,
    );
    expect(container.querySelector(".bd-pg-home-chip")).toBeNull();
    expect(container.querySelector(".bd-pg-chip")).toBeNull();
    const row = container.querySelector(".bd-pg-row");
    expect(row?.getAttribute("aria-label") ?? "").toContain("Draft");
  });

  it("long name shows title attribute for tooltip", () => {
    const longName = "A".repeat(50);
    const { container } = render(
      <PageRow page={{ ...home, name: longName }} {...baseProps} />,
    );
    const nameEl = container.querySelector(".bd-pg-row-name");
    expect(nameEl).toHaveAttribute("title", longName);
  });



  it("renders single overflow button (no per-row action strip)", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    const overflows = container.querySelectorAll(".bd-pg-row-overflow");
    expect(overflows.length).toBe(1);
    expect(container.querySelector(".pg-row__actions")).toBeNull();
    expect(container.querySelector(".pg-row__act")).toBeNull();
  });

  it("does not render legacy thumb gradient", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".pg-row__thumb")).toBeNull();
  });

  it("does not render legacy 'updated' label", () => {
    const { container } = render(
      <PageRow
        page={{ ...home, updatedAt: new Date().toISOString() }}
        {...baseProps}
      />,
    );
    expect(container.querySelector(".pg-row__updated")).toBeNull();
    expect(container.querySelector(".bd-pg-row-updated")).toBeNull();
  });

  it("overflow click invokes onContextMenu", () => {
    const onContextMenu = vi.fn();
    const { container } = render(
      <PageRow page={home} {...baseProps} onContextMenu={onContextMenu} />,
    );
    const overflow = container.querySelector(".bd-pg-row-overflow") as HTMLElement;
    fireEvent.click(overflow);
    expect(onContextMenu).toHaveBeenCalled();
  });
});
