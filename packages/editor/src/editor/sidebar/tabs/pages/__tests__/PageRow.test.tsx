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
  it("renders name, slug, and row icon", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-name")).toHaveTextContent("Home");
    expect(container.querySelector(".bd-pg-row-slug")).toHaveTextContent("/");
    expect(container.querySelector(".bd-pg-row-icon")).not.toBeNull();
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

  it("home page renders .bd-pg-home-chip", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-home-chip")).not.toBeNull();
  });

  it("renders status chip with class .bd-pg-chip.live for live status", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-chip.live")).not.toBeNull();
  });

  it.each([
    ["draft", "Draft"],
    ["scheduled", "Scheduled"],
    ["hidden", "Hidden"],
    ["password", "Password"],
    ["external", "External"],
    ["error", "Error"],
  ])("renders chip with correct label for %s", (status, label) => {
    render(
      <PageRow
        page={{ ...home, status: status as PageItem["status"], isHome: false }}
        {...baseProps}
      />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("long name shows title attribute for tooltip", () => {
    const longName = "A".repeat(50);
    const { container } = render(
      <PageRow page={{ ...home, name: longName }} {...baseProps} />,
    );
    const nameEl = container.querySelector(".bd-pg-row-name");
    expect(nameEl).toHaveAttribute("title", longName);
  });

  it("chip has aria-label matching status", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    const chip = container.querySelector(".bd-pg-chip");
    expect(chip?.getAttribute("aria-label")).toContain("live");
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
