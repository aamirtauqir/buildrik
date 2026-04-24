import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Section } from "../Section";

describe("Section — no nested <button>", () => {
  it("renders header as <div role=button>, not <button>", () => {
    const { container } = render(
      <Section title="Background">
        <div>content</div>
      </Section>
    );
    const header = container.querySelector(".bdi-sec-h");
    expect(header).not.toBeNull();
    expect(header!.tagName).toBe("DIV");
    expect(header!.getAttribute("role")).toBe("button");
    expect(header!.getAttribute("tabindex")).toBe("0");
  });

  it("allows a <button> action slot without nested-button HTML violation", () => {
    const { container } = render(
      <Section
        title="Background"
        isOpen={false}
        action={<button type="button" className="bdi-plus">+</button>}
      >
        <div>content</div>
      </Section>
    );
    // No <button> element should have a <button> descendant.
    const buttons = container.querySelectorAll("button");
    for (const btn of buttons) {
      expect(btn.querySelector("button")).toBeNull();
    }
  });

  it("toggles on Enter key", () => {
    const onToggle = vi.fn();
    render(
      <Section title="Background" isOpen={false} onToggle={onToggle}>
        <div>content</div>
      </Section>
    );
    const header = screen.getByRole("button", { name: /Background section/i });
    fireEvent.keyDown(header, { key: "Enter" });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("toggles on Space key", () => {
    const onToggle = vi.fn();
    render(
      <Section title="Background" isOpen={false} onToggle={onToggle}>
        <div>content</div>
      </Section>
    );
    const header = screen.getByRole("button", { name: /Background section/i });
    fireEvent.keyDown(header, { key: " " });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("exposes aria-expanded reflecting open state", () => {
    const { container, rerender } = render(
      <Section title="Background" isOpen={false}>
        <div>content</div>
      </Section>
    );
    let header = container.querySelector(".bdi-sec-h")!;
    expect(header.getAttribute("aria-expanded")).toBe("false");
    rerender(
      <Section title="Background" isOpen={true}>
        <div>content</div>
      </Section>
    );
    header = container.querySelector(".bdi-sec-h")!;
    expect(header.getAttribute("aria-expanded")).toBe("true");
  });
});
