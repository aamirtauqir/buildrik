/**
 * NotificationCenter tests — verify Phase 3 markup contracts.
 *
 * NOTE: per plan adaptation in NotificationCenter.tsx, the vendored CSS is a
 * persistent dropdown panel (.bd-nc family), NOT a Radix.Toast queue. So
 * Contracts B (always-controlled), E3 (portal), E5 (DemoTrigger) do NOT apply.
 * This is treated as a layout-only organism.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  NotificationCenter,
  NotificationCenterMark,
  NotificationCenterTabs,
  NotificationCenterTab,
  NotificationCenterBody,
  NotificationCenterGroup,
  NotificationCenterFoot,
} from "./NotificationCenter";

describe("NotificationCenter — root", () => {
  it("applies bd-nc class", () => {
    const { container } = render(<NotificationCenter data-testid="nc" />);
    expect(container.querySelector(".bd-nc")).toBe(
      screen.getByTestId("nc"),
    );
  });

  it("merges caller-provided className", () => {
    render(<NotificationCenter data-testid="nc" className="extra" />);
    const root = screen.getByTestId("nc");
    expect(root).toHaveClass("bd-nc");
    expect(root).toHaveClass("extra");
  });

  it("forwards ref", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <NotificationCenter
        ref={(el) => {
          captured = el;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect((captured as unknown as HTMLDivElement).tagName).toBe("DIV");
  });

  it("renders children", () => {
    render(
      <NotificationCenter>
        <span>inner</span>
      </NotificationCenter>,
    );
    expect(screen.getByText("inner")).toBeInTheDocument();
  });
});

describe("NotificationCenterMark", () => {
  it("renders as a button with bd-nc__mark class and type='button'", () => {
    render(<NotificationCenterMark>Mark all read</NotificationCenterMark>);
    const btn = screen.getByRole("button", { name: "Mark all read" });
    expect(btn).toHaveClass("bd-nc__mark");
    expect(btn).toHaveAttribute("type", "button");
  });
});

describe("NotificationCenterTabs", () => {
  it("renders with bd-nc__tabs and role='tablist'", () => {
    render(
      <NotificationCenterTabs>
        <span>tab</span>
      </NotificationCenterTabs>,
    );
    const tabs = screen.getByRole("tablist");
    expect(tabs).toHaveClass("bd-nc__tabs");
  });
});

describe("NotificationCenterTab", () => {
  it("renders with bd-nc__tab and role='tab', aria-selected='false' by default", () => {
    render(<NotificationCenterTab>All</NotificationCenterTab>);
    const tab = screen.getByRole("tab", { name: "All" });
    expect(tab).toHaveClass("bd-nc__tab");
    expect(tab).toHaveAttribute("aria-selected", "false");
  });

  it("sets aria-selected='true' when active", () => {
    render(<NotificationCenterTab active>Mentions</NotificationCenterTab>);
    expect(screen.getByRole("tab", { name: "Mentions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("NotificationCenterBody", () => {
  it("applies bd-nc__body class", () => {
    render(<NotificationCenterBody data-testid="body" />);
    expect(screen.getByTestId("body")).toHaveClass("bd-nc__body");
  });
});

describe("NotificationCenterGroup", () => {
  it("applies bd-nc__group class", () => {
    render(<NotificationCenterGroup data-testid="g" />);
    expect(screen.getByTestId("g")).toHaveClass("bd-nc__group");
  });

  it("renders bd-nc__group-label when label prop provided", () => {
    render(
      <NotificationCenterGroup label="Today" data-testid="g">
        <span>row</span>
      </NotificationCenterGroup>,
    );
    expect(screen.getByText("Today")).toHaveClass("bd-nc__group-label");
  });

  it("omits label element when label prop not provided", () => {
    render(
      <NotificationCenterGroup data-testid="g">
        <span>row</span>
      </NotificationCenterGroup>,
    );
    expect(
      screen.getByTestId("g").querySelector(".bd-nc__group-label"),
    ).toBeNull();
  });
});

describe("NotificationCenterFoot", () => {
  it("renders as a button with bd-nc__foot class and type='button'", () => {
    render(<NotificationCenterFoot>View all</NotificationCenterFoot>);
    const btn = screen.getByRole("button", { name: "View all" });
    expect(btn).toHaveClass("bd-nc__foot");
    expect(btn).toHaveAttribute("type", "button");
  });
});

describe("NotificationCenter — sibling composition smoke", () => {
  it("composes NotificationCenter + Tabs + Body + Group + Foot together", () => {
    render(
      <NotificationCenter data-testid="nc">
        <NotificationCenterTabs>
          <NotificationCenterTab active>All</NotificationCenterTab>
          <NotificationCenterTab>Mentions</NotificationCenterTab>
        </NotificationCenterTabs>
        <NotificationCenterBody data-testid="body">
          <NotificationCenterGroup label="Today">
            <div>item</div>
          </NotificationCenterGroup>
        </NotificationCenterBody>
        <NotificationCenterFoot>View all</NotificationCenterFoot>
      </NotificationCenter>,
    );
    expect(screen.getByTestId("nc")).toHaveClass("bd-nc");
    expect(screen.getByRole("tablist")).toHaveClass("bd-nc__tabs");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByTestId("body")).toHaveClass("bd-nc__body");
    expect(screen.getByText("Today")).toHaveClass("bd-nc__group-label");
    expect(screen.getByRole("button", { name: "View all" })).toHaveClass(
      "bd-nc__foot",
    );
  });
});
