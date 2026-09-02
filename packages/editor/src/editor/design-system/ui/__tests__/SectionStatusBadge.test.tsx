/**
 * Eight Brand boards carried `authority: open:status-pill-convention`. Read from
 * Figma 2026-08-27 the convention was not open: the boards agree on one Badge in
 * the band under the back row, and their own reference code carries the wording.
 *
 * What this file pins is the part that could be BUILT. `presets · bound` and
 * `presets · unbound` say "Bound to elements", and nothing in the product can
 * answer that — elements carry no preset reference. Those two are design-ahead;
 * only the draft state ships.
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionStatusBadge, presetsStatus } from "../SectionStatusBadge";

describe("presetsStatus", () => {
  it("an unsaved edit is a draft", () => {
    expect(presetsStatus(true)).toBe("draft");
  });

  it("a clean screen says NOTHING rather than guessing at bound/unbound", () => {
    // The absent badge is the honest answer: the screen cannot tell whether a
    // preset is applied to any element, so it does not claim to.
    expect(presetsStatus(false)).toBeNull();
  });
});

describe("SectionStatusBadge", () => {
  it("uses the board's wording, not a paraphrase", () => {
    // 306:2161 renders "Draft preset" at 89px — the width corroborates it.
    render(<SectionStatusBadge status="draft" />);
    expect(screen.getByTestId("brand-section-status").textContent).toBe("Draft preset");
  });

  it("a draft is not an error", () => {
    // It is a state the user put the screen in. Red would say something broke.
    const { container } = render(<SectionStatusBadge status="draft" />);
    expect(container.innerHTML).not.toMatch(/red|failure|error/i);
  });

  it("sits in its own band, so it cannot stretch across the panel", () => {
    // Measured live before this: flowbite's Badge is a span that filled its
    // container at 263px against the board's content-width chip.
    const { container } = render(<SectionStatusBadge status="draft" />);
    expect(container.firstElementChild?.className).toContain("tw:flex");
  });
});

describe("SectionStatusBadge — the export outcome (306:2232)", () => {
  it("names the format that was written", () => {
    // The board reads "Exported CSS", not a bare "Exported" — which file you
    // just got is the only part worth saying.
    render(<SectionStatusBadge status="exported" detail="CSS" />);
    expect(screen.getByTestId("brand-section-status").textContent).toBe("Exported CSS");
  });

  it("an export that worked is not an error", () => {
    const { container } = render(<SectionStatusBadge status="exported" detail="JSON" />);
    expect(container.innerHTML).not.toMatch(/red|failure|error/i);
  });

  it("without a detail it still says something true", () => {
    render(<SectionStatusBadge status="exported" />);
    expect(screen.getByTestId("brand-section-status").textContent).toBe("Exported");
  });
});

describe("SectionStatusBadge — the import outcome (306:2265 / 306:2298)", () => {
  it("uses each board's own wording", () => {
    const { rerender } = render(<SectionStatusBadge status="imported" />);
    expect(screen.getByTestId("brand-section-status").textContent).toBe("Imported tokens");
    rerender(<SectionStatusBadge status="import-failed" />);
    expect(screen.getByTestId("brand-section-status").textContent).toBe("Import failed");
  });

  it("a failed import is the ONE state here that may be red", () => {
    /* Draft, exported and imported are all things that worked or that the user
       chose. Colouring those red would spend the one signal that means "this
       did not happen" on four states where it did. */
    const { container: failed } = render(<SectionStatusBadge status="import-failed" />);
    /* The pill paints its one red state with the error tokens, not a flowbite
       colour name — `--bk-error` / `--bk-error-text` (board 306:2298). */
    expect(failed.innerHTML).toMatch(/bk-error/);
    for (const s of ["draft", "exported", "imported"] as const) {
      const { container } = render(<SectionStatusBadge status={s} />);
      expect(container.innerHTML).not.toMatch(/bk-error/);
    }
  });
});

