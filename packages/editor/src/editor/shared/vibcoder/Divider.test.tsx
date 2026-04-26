import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Divider } from "./Divider";

describe("vibcoder Divider wrapper — bare form", () => {
  it("renders <hr> with bd-divider class", () => {
    const { container } = render(<Divider />);
    const el = container.querySelector("hr")!;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bd-divider");
  });

  it("OMITS modifier classes for all defaults (horizontal/solid/default tone)", () => {
    const { container } = render(<Divider />);
    const cls = container.querySelector("hr")!.className;
    expect(cls).not.toContain("bd-divider--horizontal");
    expect(cls).not.toContain("bd-divider--solid");
    expect(cls).not.toContain("bd-divider--default");
    expect(cls).not.toContain("bd-divider--inset");
  });

  it("emits role=separator + aria-orientation=horizontal by default", () => {
    const { container } = render(<Divider />);
    const el = container.querySelector("hr")!;
    expect(el.getAttribute("role")).toBe("separator");
    expect(el.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("emits bd-divider--vertical when orientation=vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    const el = container.querySelector("hr")!;
    expect(el.className).toContain("bd-divider--vertical");
    expect(el.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("emits bd-divider--dashed and bd-divider--dotted for non-solid styles", () => {
    const { container: a } = render(<Divider dividerStyle="dashed" />);
    expect(a.querySelector("hr")!.className).toContain("bd-divider--dashed");
    const { container: b } = render(<Divider dividerStyle="dotted" />);
    expect(b.querySelector("hr")!.className).toContain("bd-divider--dotted");
  });

  it("emits bd-divider--strong when tone=strong", () => {
    const { container } = render(<Divider tone="strong" />);
    expect(container.querySelector("hr")!.className).toContain("bd-divider--strong");
  });

  it("emits bd-divider--inset when inset=true", () => {
    const { container } = render(<Divider inset />);
    expect(container.querySelector("hr")!.className).toContain("bd-divider--inset");
  });

  it("chains vertical + dashed correctly", () => {
    const { container } = render(<Divider orientation="vertical" dividerStyle="dashed" />);
    const cls = container.querySelector("hr")!.className;
    expect(cls).toContain("bd-divider--vertical");
    expect(cls).toContain("bd-divider--dashed");
  });

  it("merges caller className", () => {
    const { container } = render(<Divider className="extra" />);
    expect(container.querySelector("hr")!.className).toContain("extra");
  });
});

describe("vibcoder Divider wrapper — labelled composite", () => {
  it("renders <div> (not <hr>) with bd-divider-label class when label is set", () => {
    const { container } = render(<Divider label="SECTION" />);
    expect(container.querySelector("hr")).toBeNull();
    const el = container.querySelector("div")!;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bd-divider-label");
    // Standalone composite — does NOT also chain the bare `.bd-divider` class.
    // Match on whole-class boundary (className substring would match "bd-divider"
    // inside "bd-divider-label").
    const classList = el.className.split(/\s+/);
    expect(classList).not.toContain("bd-divider");
    expect(el.textContent).toBe("SECTION");
  });

  it("does NOT chain bd-divider modifier classes onto the labelled composite", () => {
    const { container } = render(
      <Divider label="X" orientation="vertical" dividerStyle="dashed" inset />,
    );
    const cls = container.querySelector("div")!.className;
    expect(cls).not.toContain("bd-divider--vertical");
    expect(cls).not.toContain("bd-divider--dashed");
    expect(cls).not.toContain("bd-divider--inset");
  });

  it("emits role=separator + aria-orientation + aria-label on the composite", () => {
    const { container } = render(<Divider label="Filters" orientation="vertical" />);
    const el = container.querySelector("div")!;
    expect(el.getAttribute("role")).toBe("separator");
    expect(el.getAttribute("aria-orientation")).toBe("vertical");
    expect(el.getAttribute("aria-label")).toBe("Filters");
  });

  it("merges caller className on the composite", () => {
    const { container } = render(<Divider label="X" className="extra" />);
    expect(container.querySelector("div")!.className).toContain("extra");
  });
});
