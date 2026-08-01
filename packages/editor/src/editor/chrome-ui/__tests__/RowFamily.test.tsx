/**
 * Row family — contract tests (Row, ListRow, TreeRow, VersionRow, RecordRow,
 * FormatRow, IntegrationRow, CommentRow).
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, the whole row family relocated to chrome-ui/ as one group —
 * their CSS was interlinked (every non-FormatRow/IntegrationRow member
 * composes the shared Row component; FormatRow/IntegrationRow borrowed
 * Row's own `.bk-row` class directly).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Row, ListRow, TreeRow, VersionRow, RecordRow, FormatRow, IntegrationRow, CommentRow } from "../index";

describe("Row", () => {
  it("is inert by default — no tab stop, no role", () => {
    const { container } = render(<Row>plain</Row>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.getAttribute("tabindex")).toBeNull();
    expect(row.getAttribute("role")).toBeNull();
  });

  it("interactive rows answer the keyboard, not just the mouse", () => {
    const onClick = vi.fn();
    render(<Row interactive onClick={onClick}>go</Row>);
    const row = screen.getByRole("button", { name: "go" });
    expect(row.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("a disabled row ignores clicks", () => {
    const onClick = vi.fn();
    render(<Row interactive disabled onClick={onClick}>no</Row>);
    fireEvent.click(screen.getByText("no"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("lets the caller override the role for tree and listbox surfaces", () => {
    render(<Row interactive role="option">opt</Row>);
    expect(screen.getByRole("option", { name: "opt" })).toBeTruthy();
  });
});

describe("ListRow", () => {
  it("renders label, count and chevron", () => {
    render(<ListRow label="Menu items" count={24} chevron />);
    expect(screen.getByText("Menu items")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });
});

describe("TreeRow", () => {
  it("exposes depth as aria-level so traversal is announced", () => {
    render(<TreeRow label="Hero" depth={2} />);
    expect(screen.getByRole("treeitem").getAttribute("aria-level")).toBe("3");
  });

  it("the twisty toggles without selecting the row", () => {
    const onToggle = vi.fn();
    const onClick = vi.fn();
    render(<TreeRow label="Section" expandable expanded={false} onToggle={onToggle} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand Section" }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("VersionRow", () => {
  it("marks the current version", () => {
    render(<VersionRow title="v14" meta="2 Jul, 14:22" state="live" current />);
    expect(screen.getByText("CURRENT")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Live" })).toBeTruthy();
  });
});

describe("RecordRow", () => {
  it("says published in text, not only in colour", () => {
    render(<RecordRow label="Margherita" published />);
    expect(screen.getByRole("img", { name: "Published" })).toBeTruthy();
  });
});

describe("FormatRow", () => {
  it("is a real radio, so arrow keys work inside the group", () => {
    const onChange = vi.fn();
    render(
      <FormatRow name="fmt" value="html" title="Static HTML" description="No build step" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio"));
    expect(onChange).toHaveBeenCalledWith("html");
  });
});

describe("IntegrationRow", () => {
  it("shows connection status and the pro gate", () => {
    render(<IntegrationRow name="Stripe" scope="Payments" status="connected" pro />);
    expect(screen.getByText("CONNECTED")).toBeTruthy();
    expect(screen.getByText("PRO")).toBeTruthy();
  });

  it("defaults to available", () => {
    render(<IntegrationRow name="Zapier" scope="Automations" />);
    expect(screen.getByText("AVAILABLE")).toBeTruthy();
  });
});

describe("CommentRow", () => {
  it("names the client rather than relying on the tint", () => {
    render(<CommentRow author="Hina Raza" authorKind="client" body="Move the hero up" />);
    expect(screen.getByText(/Hina Raza · Client/)).toBeTruthy();
  });
});
