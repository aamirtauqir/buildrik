import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

  /* Boards 807:8342 / 807:8567 — an expanded header carries its name and its
     chevron, nothing else. The rows below say what the summary was for. */
  it("drops the preview once the section is open", () => {
    const preview = <span data-testid="preview-swatch" />;
    render(
      <Section title="Background" preview={preview}>
        content
      </Section>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByTestId("preview-swatch")).not.toBeInTheDocument();
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

/* Inspector v4 (DD-11): inside the tab body the registry frames the section —
   title, anchor, and one of three display modes. */
import { SectionFrameContext, type SectionFrame } from "../shared/controls/Section";

const framed = (frame: Partial<SectionFrame>) =>
  render(
    <SectionFrameContext.Provider value={{ sectionId: "fill", title: "Fill", displayMode: "open", onToggle: () => {}, ...frame }}>
      <Section title="Background" id="inspector-section-background">
        <span data-testid="body">rows</span>
      </Section>
    </SectionFrameContext.Provider>
  );

describe("Section — the v4 frame", () => {
  it("takes its title and anchor from the registry", () => {
    const { container } = framed({});
    expect(screen.getByRole("button", { name: "Fill section, expanded" })).toBeInTheDocument();
    expect(container.querySelector("#inspector-section-fill")).not.toBeNull();
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("empty: one header row with a '+' that adds, no body", () => {
    const onAdd = vi.fn();
    framed({ displayMode: "empty", onAdd });
    expect(screen.queryByTestId("body")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add fill" }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("summary: shut, with its one-line summary under the header", () => {
    framed({ displayMode: "summary", summary: "id: hero-title · 1 attribute" });
    expect(screen.queryByTestId("body")).toBeNull();
    expect(screen.getByTestId("inspector-summary-fill")).toHaveTextContent("id: hero-title · 1 attribute");
  });

  it("a click toggles through the frame; ⌥-click toggles the whole tab", () => {
    const onToggle = vi.fn();
    const onToggleAll = vi.fn();
    framed({ onToggle, onToggleAll });
    fireEvent.click(screen.getByRole("button", { name: /Fill section/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Fill section/ }), { altKey: true });
    expect(onToggleAll).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("a Section nested inside a framed body is not framed itself", () => {
    render(
      <SectionFrameContext.Provider value={{ sectionId: "fill", title: "Fill", displayMode: "open", onToggle: () => {} }}>
        <Section title="Outer">
          <Section title="Inner" defaultOpen>
            x
          </Section>
        </Section>
      </SectionFrameContext.Provider>
    );
    expect(screen.getByRole("button", { name: "Inner section, expanded" })).toBeInTheDocument();
  });
});
