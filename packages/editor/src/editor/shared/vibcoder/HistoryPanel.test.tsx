/**
 * HistoryPanel tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HistoryPanel,
  HistoryPanelTimeline,
  HistoryPanelDay,
  HistoryPanelRow,
  HistoryPanelTag,
  HistoryPanelViewer,
  HistoryPanelDiffLine,
} from "./HistoryPanel";

describe("HistoryPanel — siblings", () => {
  it("HistoryPanel applies bd-history-panel class", () => {
    render(<HistoryPanel data-testid="hp">x</HistoryPanel>);
    expect(screen.getByTestId("hp")).toHaveClass("bd-history-panel");
  });

  it("HistoryPanel merges caller className", () => {
    render(<HistoryPanel data-testid="hp" className="extra">x</HistoryPanel>);
    expect(screen.getByTestId("hp")).toHaveClass("bd-history-panel");
    expect(screen.getByTestId("hp")).toHaveClass("extra");
  });

  it("HistoryPanelTimeline applies bd-history-panel__timeline", () => {
    render(<HistoryPanelTimeline data-testid="t">x</HistoryPanelTimeline>);
    expect(screen.getByTestId("t")).toHaveClass("bd-history-panel__timeline");
  });

  it("HistoryPanelDay applies bd-history-panel__day", () => {
    render(<HistoryPanelDay data-testid="d">Today</HistoryPanelDay>);
    expect(screen.getByTestId("d")).toHaveClass("bd-history-panel__day");
  });

  it("HistoryPanelRow renders <button> with bd-history-panel__row class and type='button'", () => {
    render(<HistoryPanelRow>Edit hero</HistoryPanelRow>);
    const btn = screen.getByRole("button", { name: "Edit hero" });
    expect(btn).toHaveClass("bd-history-panel__row");
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("aria-selected", "false");
  });

  it("HistoryPanelRow sets aria-selected='true' when selected", () => {
    render(<HistoryPanelRow selected>x</HistoryPanelRow>);
    expect(screen.getByRole("button", { name: "x" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("HistoryPanelTag applies bd-history-panel__tag", () => {
    render(<HistoryPanelTag data-testid="tag">v1</HistoryPanelTag>);
    expect(screen.getByTestId("tag")).toHaveClass("bd-history-panel__tag");
  });

  it("HistoryPanelTag applies --published modifier when published", () => {
    render(<HistoryPanelTag published data-testid="tag">v1</HistoryPanelTag>);
    expect(screen.getByTestId("tag")).toHaveClass(
      "bd-history-panel__tag--published",
    );
  });

  it("HistoryPanelTag omits --published when not published", () => {
    render(<HistoryPanelTag data-testid="tag">v1</HistoryPanelTag>);
    expect(screen.getByTestId("tag")).not.toHaveClass(
      "bd-history-panel__tag--published",
    );
  });

  it("HistoryPanelViewer applies bd-history-panel__viewer", () => {
    render(<HistoryPanelViewer data-testid="v">x</HistoryPanelViewer>);
    expect(screen.getByTestId("v")).toHaveClass("bd-history-panel__viewer");
  });

  it("HistoryPanelDiffLine applies bd-history-panel__diff-line", () => {
    render(<HistoryPanelDiffLine data-testid="d">x</HistoryPanelDiffLine>);
    expect(screen.getByTestId("d")).toHaveClass("bd-history-panel__diff-line");
  });

  it("HistoryPanelDiffLine applies --add modifier when kind='add'", () => {
    render(<HistoryPanelDiffLine kind="add" data-testid="d">x</HistoryPanelDiffLine>);
    expect(screen.getByTestId("d")).toHaveClass(
      "bd-history-panel__diff-line--add",
    );
  });

  it("HistoryPanelDiffLine applies --rem modifier when kind='rem'", () => {
    render(<HistoryPanelDiffLine kind="rem" data-testid="d">x</HistoryPanelDiffLine>);
    expect(screen.getByTestId("d")).toHaveClass(
      "bd-history-panel__diff-line--rem",
    );
  });

  it("HistoryPanelDiffLine omits kind modifier when kind unset", () => {
    render(<HistoryPanelDiffLine data-testid="d">x</HistoryPanelDiffLine>);
    const d = screen.getByTestId("d");
    expect(d).not.toHaveClass("bd-history-panel__diff-line--add");
    expect(d).not.toHaveClass("bd-history-panel__diff-line--rem");
  });
});

describe("HistoryPanel — composition smoke", () => {
  it("composes timeline + viewer", () => {
    render(
      <HistoryPanel data-testid="hp">
        <HistoryPanelTimeline data-testid="t">
          <HistoryPanelDay>Today</HistoryPanelDay>
          <HistoryPanelRow selected>
            Edit hero <HistoryPanelTag published>v1</HistoryPanelTag>
          </HistoryPanelRow>
          <HistoryPanelRow>Add CTA</HistoryPanelRow>
        </HistoryPanelTimeline>
        <HistoryPanelViewer data-testid="v">
          <HistoryPanelDiffLine kind="add">+ added</HistoryPanelDiffLine>
          <HistoryPanelDiffLine kind="rem">- removed</HistoryPanelDiffLine>
        </HistoryPanelViewer>
      </HistoryPanel>,
    );
    expect(screen.getByTestId("hp")).toHaveClass("bd-history-panel");
    expect(screen.getByTestId("t")).toHaveClass("bd-history-panel__timeline");
    expect(screen.getByTestId("v")).toHaveClass("bd-history-panel__viewer");
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
