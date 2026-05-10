/**
 * DrillInHeader tests — covers focusTarget + enableDocumentEscape props
 * added for settings v2 (codex pass 3 resolution).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { DrillInHeader } from "../DrillInHeader";

afterEach(cleanup);

describe("DrillInHeader — focusTarget", () => {
  it("defaults to focusing the back button (back-compat)", async () => {
    render(
      <DrillInHeader title="General" parentName="Settings" onBack={vi.fn()} />,
    );
    await new Promise((r) => setTimeout(r, 80));
    const backBtn = screen.getByRole("button", { name: /back to settings/i });
    expect(document.activeElement).toBe(backBtn);
  });

  it("focuses the breadcrumb-current span when focusTarget='breadcrumb-current'", async () => {
    render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        breadcrumb={["Site", "General"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("General");
    expect(heading.getAttribute("aria-label")).toBe("General, Site");
    expect(document.activeElement).toBe(heading);
  });

  it("re-focuses breadcrumb-current span when title changes (section→section nav)", async () => {
    // Codex pass-2 P1 (new): navigateBetweenSections keeps DrillInHeader
    // mounted; only `title` + `breadcrumb` props change. Effect deps
    // include `title` so focus refires.
    const { rerender } = render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        breadcrumb={["Site", "General"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    expect(document.activeElement?.textContent).toBe("General");
    (document.activeElement as HTMLElement | null)?.blur?.();
    rerender(
      <DrillInHeader
        title="SEO"
        parentName="Settings"
        breadcrumb={["Site", "SEO"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    expect(document.activeElement?.textContent).toBe("SEO");
  });
});

describe("DrillInHeader — enableDocumentEscape", () => {
  it("invokes onBack on Escape by default (back-compat)", () => {
    const onBack = vi.fn();
    render(<DrillInHeader title="General" parentName="Settings" onBack={onBack} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does NOT attach document Escape when enableDocumentEscape=false", () => {
    const onBack = vi.fn();
    render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        enableDocumentEscape={false}
        onBack={onBack}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBack).not.toHaveBeenCalled();
  });
});
