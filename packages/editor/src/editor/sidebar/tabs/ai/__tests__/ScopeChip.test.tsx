import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScopeChip } from "../ScopeChip";
import type { AIScope } from "../types";

const hero: AIScope = { kind: "element", id: "el-1", label: "Hero section", name: "Hero" };

describe("ScopeChip", () => {
  /* Board 170:2 words it "Scope: Hero section" — the word the boards use for
     what a run is allowed to touch. */
  it("leads with the word Scope, then the target", () => {
    render(<ScopeChip scope={hero} status="idle" />);
    expect(screen.getByText(/^Scope:/)).toBeInTheDocument();
    expect(screen.getByText("Hero section")).toBeInTheDocument();
  });

  it.each<[AIScope, string]>([
    [{ kind: "page" }, "Page"],
    [{ kind: "multi", ids: ["a", "b", "c"] }, "3 selected elements"],
    [{ kind: "similar", ids: ["a", "b", "c", "d"], noun: "sections" }, "All sections like this (4)"],
    [{ kind: "site", pages: 3 }, "Whole site (3 pages)"],
  ])("%#: names the scope as the boards do", (scope, text) => {
    render(<ScopeChip scope={scope} status="idle" />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  /* No board draws a lock glyph; the locked state is still announced. */
  it("says the scope is locked while a run is live, without a glyph", () => {
    render(<ScopeChip scope={hero} status="locked" />);
    expect(screen.getByLabelText(/scope locked/i)).toBeInTheDocument();
    expect(screen.queryByText("🔒")).toBeNull();
  });

  it("offers the wider scopes and reports the choice (boards 6891:73760 / 73974)", () => {
    const onChoose = vi.fn();
    const similar: AIScope = { kind: "similar", ids: ["a", "b"], noun: "sections" };
    render(
      <ScopeChip scope={hero} status="idle" options={() => [hero, similar, { kind: "page" }, { kind: "site", pages: 3 }]} onChoose={onChoose} />,
    );
    fireEvent.click(screen.getByTestId("ai-scope-trigger"));
    expect(screen.getByTestId("ai-scope-option-site")).toHaveTextContent("Whole site (3 pages)");
    fireEvent.click(screen.getByTestId("ai-scope-option-similar"));
    expect(onChoose).toHaveBeenCalledWith(similar);
  });

  it("cannot be changed while locked", () => {
    render(<ScopeChip scope={hero} status="locked" options={() => [hero]} onChoose={vi.fn()} />);
    expect(screen.getByTestId("ai-scope-trigger")).toBeDisabled();
  });
});
