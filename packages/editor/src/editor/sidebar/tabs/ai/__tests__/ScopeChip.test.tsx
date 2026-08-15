import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScopeChip } from "../ScopeChip";

describe("ScopeChip", () => {
  /* Board 170:2 words it "Scope: Hero section" — the word the boards use for
     what a run is allowed to touch. */
  it("leads with the word Scope, then the target", () => {
    render(<ScopeChip scope={{ kind: "element", label: "Hero", id: "el-1" }} status="idle" />);
    expect(screen.getByText(/^Scope:/)).toBeInTheDocument();
  });

  it("renders the element label for element scope", () => {
    render(<ScopeChip scope={{ kind: "element", id: "el-1", label: "Hero" }} status="idle" />);
    expect(screen.getByText("Hero")).toBeInTheDocument();
  });

  it("renders 'Whole page' for page scope", () => {
    render(<ScopeChip scope={{ kind: "page" }} status="idle" />);
    expect(screen.getByText(/Whole page/i)).toBeInTheDocument();
  });

  it("renders multi-count for multi scope", () => {
    render(<ScopeChip scope={{ kind: "multi", count: 3 }} status="idle" />);
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it("shows lock indicator when status='locked'", () => {
    render(<ScopeChip scope={{ kind: "element", id: "el-1", label: "Hero" }} status="locked" />);
    expect(screen.getByLabelText(/scope locked/i)).toBeInTheDocument();
  });

  it("hides lock indicator when status='idle'", () => {
    render(<ScopeChip scope={{ kind: "element", id: "el-1", label: "Hero" }} status="idle" />);
    expect(screen.queryByLabelText(/scope locked/i)).not.toBeInTheDocument();
  });
});
