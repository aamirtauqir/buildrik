/**
 * Inspector tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Inspector,
  InspectorCrumbs,
  InspectorHead,
  InspectorHeadIcon,
  InspectorSection,
  InspectorSectionHead,
  InspectorSectionBody,
} from "./Inspector";

describe("Inspector — siblings", () => {
  it("Inspector applies bd-inspector class", () => {
    render(<Inspector data-testid="i">x</Inspector>);
    expect(screen.getByTestId("i")).toHaveClass("bd-inspector");
  });

  it("Inspector merges caller className", () => {
    render(<Inspector data-testid="i" className="extra">x</Inspector>);
    expect(screen.getByTestId("i")).toHaveClass("bd-inspector");
    expect(screen.getByTestId("i")).toHaveClass("extra");
  });

  it("InspectorCrumbs applies bd-inspector__crumbs", () => {
    render(<InspectorCrumbs data-testid="c">x</InspectorCrumbs>);
    expect(screen.getByTestId("c")).toHaveClass("bd-inspector__crumbs");
  });

  it("InspectorHead applies bd-inspector__head", () => {
    render(<InspectorHead data-testid="h">x</InspectorHead>);
    expect(screen.getByTestId("h")).toHaveClass("bd-inspector__head");
  });

  it("InspectorHeadIcon applies bd-inspector__head-icon", () => {
    render(<InspectorHeadIcon data-testid="hi">i</InspectorHeadIcon>);
    expect(screen.getByTestId("hi")).toHaveClass("bd-inspector__head-icon");
  });

  it("InspectorSection applies bd-inspector__sec and aria-expanded='false' by default", () => {
    render(<InspectorSection data-testid="s">x</InspectorSection>);
    const s = screen.getByTestId("s");
    expect(s).toHaveClass("bd-inspector__sec");
    expect(s).toHaveAttribute("aria-expanded", "false");
  });

  it("InspectorSection sets aria-expanded='true' when expanded", () => {
    render(<InspectorSection expanded data-testid="s">x</InspectorSection>);
    expect(screen.getByTestId("s")).toHaveAttribute("aria-expanded", "true");
  });

  it("InspectorSectionHead renders <button> with bd-inspector__sec-head class", () => {
    render(<InspectorSectionHead>Layout</InspectorSectionHead>);
    const btn = screen.getByRole("button", { name: "Layout" });
    expect(btn).toHaveClass("bd-inspector__sec-head");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("InspectorSectionBody applies bd-inspector__sec-body", () => {
    render(<InspectorSectionBody data-testid="b">x</InspectorSectionBody>);
    expect(screen.getByTestId("b")).toHaveClass("bd-inspector__sec-body");
  });
});

describe("Inspector — composition smoke", () => {
  it("composes all 7 siblings together", () => {
    render(
      <Inspector data-testid="i">
        <InspectorCrumbs data-testid="c">Body / Hero</InspectorCrumbs>
        <InspectorHead data-testid="h">
          <InspectorHeadIcon data-testid="hi">x</InspectorHeadIcon>
          <span>Hero Section</span>
        </InspectorHead>
        <InspectorSection expanded data-testid="sec">
          <InspectorSectionHead>Layout</InspectorSectionHead>
          <InspectorSectionBody data-testid="sb">controls</InspectorSectionBody>
        </InspectorSection>
      </Inspector>,
    );
    expect(screen.getByTestId("i")).toHaveClass("bd-inspector");
    expect(screen.getByTestId("c")).toHaveClass("bd-inspector__crumbs");
    expect(screen.getByTestId("h")).toHaveClass("bd-inspector__head");
    expect(screen.getByTestId("hi")).toHaveClass("bd-inspector__head-icon");
    expect(screen.getByTestId("sec")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Layout" })).toHaveClass(
      "bd-inspector__sec-head",
    );
    expect(screen.getByTestId("sb")).toHaveClass("bd-inspector__sec-body");
  });
});
