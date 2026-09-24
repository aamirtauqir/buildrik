/**
 * A panel hosted in the inspector column (boards 4418:97118 / 4418:115784 /
 * 4418:73791) takes the column header — 44 tall, 13/500 ink — from its host,
 * without knowing where it is mounted.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader, PanelHeaderSize } from "../PanelHeader";

describe("PanelHeader size from its host", () => {
  it("defaults to the drawer header", () => {
    render(<PanelHeader title="Publish" />);
    expect(screen.getByTestId("panel-header").className).toContain("tw:text-[length:var(--bk-text-11)]");
  });
  it("a column host gives the 44/13 ink header", () => {
    render(
      <PanelHeaderSize.Provider value="column">
        <PanelHeader title="Publish" />
      </PanelHeaderSize.Provider>,
    );
    const cls = screen.getByTestId("panel-header").className;
    expect(cls).toContain("tw:h-11");
    expect(cls).toContain("tw:text-[length:var(--bk-text-13)]");
    expect(cls).toContain("tw:text-[var(--bk-ink)]");
  });
  it("an explicit size still wins", () => {
    render(
      <PanelHeaderSize.Provider value="column">
        <PanelHeader title="x" size="panel" />
      </PanelHeaderSize.Provider>,
    );
    expect(screen.getByTestId("panel-header").className).toContain("tw:h-12");
  });
});
