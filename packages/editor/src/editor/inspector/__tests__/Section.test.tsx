import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "../shared/controls/Section";

describe("Section — aria-label", () => {
  it("button has aria-label including title and collapsed state", () => {
    render(<Section title="Background">content</Section>);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Background section, collapsed"
    );
  });

  it("aria-label updates to expanded after click", () => {
    render(<Section title="Background">content</Section>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Background section, expanded"
    );
  });
});

describe("Section — preview prop", () => {
  it("shows preview when collapsed", () => {
    const preview = <span data-testid="preview-swatch" />;
    render(
      <Section title="Background" preview={preview}>
        content
      </Section>
    );
    expect(screen.getByTestId("preview-swatch")).toBeInTheDocument();
  });

  it("shows preview when expanded (always visible indicator)", () => {
    const preview = <span data-testid="preview-swatch" />;
    render(
      <Section title="Background" preview={preview}>
        content
      </Section>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("preview-swatch")).toBeInTheDocument();
  });

  it("shows no preview when none provided", () => {
    render(<Section title="Background">content</Section>);
    // no error, no unexpected preview element
    expect(screen.queryByTestId("preview-swatch")).not.toBeInTheDocument();
  });
});

describe("Section — id prop", () => {
  it("root div has id when id prop is provided", () => {
    const { container } = render(
      <Section title="Background" id="inspector-section-background">
        content
      </Section>
    );
    expect(container.querySelector("#inspector-section-background")).not.toBeNull();
  });
});

describe("Section — id on root div", () => {
  it("root div has id prop value for sub-nav scrolling", () => {
    const { container } = render(
      <Section title="Border" id="inspector-section-border">
        children
      </Section>
    );
    expect(container.firstChild).toHaveAttribute("id", "inspector-section-border");
  });
});
