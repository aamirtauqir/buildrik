import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ToggleRow } from "./ToggleRow";

describe("vibcoder ToggleRow wrapper — Contract A (slot composition)", () => {
  it("renders <div> with bd-toggle-row class + label slot", () => {
    const { container } = render(
      <ToggleRow label="Auto-save">
        <span data-testid="ctl" />
      </ToggleRow>,
    );
    const root = container.querySelector("div.bd-toggle-row");
    expect(root).toBeTruthy();
    expect(container.querySelector(".bd-toggle-row__name")!.textContent).toBe(
      "Auto-save",
    );
  });

  it("OMITS __desc when helper undefined", () => {
    const { container } = render(
      <ToggleRow label="x">
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row__desc")).toBeNull();
  });

  it("renders __desc when helper provided", () => {
    const { container } = render(
      <ToggleRow label="Auto-save" helper="Saves every 10 seconds">
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row__desc")!.textContent).toBe(
      "Saves every 10 seconds",
    );
  });

  it("OMITS .is-disabled when disabled undefined", () => {
    const { container } = render(
      <ToggleRow label="x">
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row")!.className).not.toContain(
      "is-disabled",
    );
  });

  it("emits .is-disabled when disabled=true", () => {
    const { container } = render(
      <ToggleRow label="x" disabled>
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row")!.className).toContain(
      "is-disabled",
    );
  });

  it("OMITS --first / --inset when undefined", () => {
    const { container } = render(
      <ToggleRow label="x">
        <span />
      </ToggleRow>,
    );
    const cls = container.querySelector(".bd-toggle-row")!.className;
    expect(cls).not.toContain("bd-toggle-row--first");
    expect(cls).not.toContain("bd-toggle-row--inset");
  });

  it("emits --first + --inset when set", () => {
    const { container } = render(
      <ToggleRow label="x" first inset>
        <span />
      </ToggleRow>,
    );
    const cls = container.querySelector(".bd-toggle-row")!.className;
    expect(cls).toContain("bd-toggle-row--first");
    expect(cls).toContain("bd-toggle-row--inset");
  });

  it("renders children in the control slot (after __meta)", () => {
    const { container } = render(
      <ToggleRow label="Auto-save">
        <button data-testid="switch">on</button>
      </ToggleRow>,
    );
    const root = container.querySelector(".bd-toggle-row")!;
    const ctl = root.querySelector("[data-testid='switch']");
    expect(ctl).toBeTruthy();
    // Order: __meta then children
    const meta = root.querySelector(".bd-toggle-row__meta");
    expect(meta!.compareDocumentPosition(ctl!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("merges caller className", () => {
    const { container } = render(
      <ToggleRow label="x" className="extra">
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ToggleRow label="x" ref={ref}>
        <span />
      </ToggleRow>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("does NOT render __desc when helper is empty string", () => {
    // Empty-string lock-behavior: empty helper string is falsy → no __desc
    const { container } = render(
      <ToggleRow label="x" helper="">
        <span />
      </ToggleRow>,
    );
    expect(container.querySelector(".bd-toggle-row__desc")).toBeNull();
  });
});
