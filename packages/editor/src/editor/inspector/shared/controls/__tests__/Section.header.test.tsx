/**
 * A section header holds a toggle and an action, side by side.
 *
 * It used to be ONE `div[role=button][tabindex=0]` wrapping both — chosen to
 * keep `<button>` out of `<button>`, which trades a React DOM warning for a
 * worse thing: a control with focusable descendants. axe called it
 * nested-interactive (serious) on every element selection, because the action
 * button sat inside the announced toggle.
 *
 * The row is a plain container now; the toggle carries the role and the action
 * is its sibling. A real `<button>` for the toggle would inherit flowbite's
 * height (measured live: the row went 36px → 56px) and Gate 24 keeps raw
 * `<button>` out of chrome, so the role stays on a span.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Section } from "../Section";

describe("Section header", () => {
  it("is a container — the toggle inside it carries the button role", () => {
    const { container } = render(
      <Section title="Background">
        <div>content</div>
      </Section>
    );
    const header = container.querySelector(".bdi-sec-h")!;
    expect(header).not.toBeNull();
    expect(header.getAttribute("role")).toBeNull();

    const toggle = screen.getByRole("button", { name: /Background section/i });
    expect(header.contains(toggle)).toBe(true);
    expect(toggle.getAttribute("tabindex")).toBe("0");
  });

  it("keeps the action button OUT of the toggle", () => {
    render(
      <Section
        title="Background"
        isOpen={false}
        action={<button type="button" className="bdi-plus" aria-label="Add background" />}
      >
        <div>content</div>
      </Section>
    );
    const toggle = screen.getByRole("button", { name: /Background section/i });
    const action = screen.getByRole("button", { name: "Add background" });
    expect(toggle.contains(action)).toBe(false);
    // …and nothing focusable hides inside the toggle
    expect(toggle.querySelector("button, input, select, textarea, [tabindex]")).toBeNull();
  });

  it("toggles on Enter key", () => {
    const onToggle = vi.fn();
    render(
      <Section title="Background" isOpen={false} onToggle={onToggle}>
        <div>content</div>
      </Section>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Background section/i }), { key: "Enter" });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("toggles on Space key", () => {
    const onToggle = vi.fn();
    render(
      <Section title="Background" isOpen={false} onToggle={onToggle}>
        <div>content</div>
      </Section>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Background section/i }), { key: " " });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("exposes aria-expanded reflecting open state", () => {
    const { rerender } = render(
      <Section title="Background" isOpen={false}>
        <div>content</div>
      </Section>
    );
    expect(screen.getByRole("button", { name: /Background section/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(
      <Section title="Background" isOpen={true}>
        <div>content</div>
      </Section>
    );
    expect(screen.getByRole("button", { name: /Background section/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
