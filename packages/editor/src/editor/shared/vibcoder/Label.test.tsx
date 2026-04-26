import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Label } from "./Label";

describe("vibcoder Label wrapper", () => {
  it("renders <label> with bd-label class", () => {
    const { container } = render(<Label>Title</Label>);
    const el = container.querySelector("label")!;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bd-label");
    expect(el.textContent).toContain("Title");
  });

  it("OMITS bd-label--sm and bd-label--inline by default", () => {
    const { container } = render(<Label>x</Label>);
    const cls = container.querySelector("label")!.className;
    expect(cls).not.toContain("bd-label--sm");
    expect(cls).not.toContain("bd-label--inline");
  });

  it("emits bd-label--sm when size=sm", () => {
    const { container } = render(<Label size="sm">x</Label>);
    expect(container.querySelector("label")!.className).toContain("bd-label--sm");
  });

  it("emits bd-label--inline when inline=true", () => {
    const { container } = render(<Label inline>x</Label>);
    expect(container.querySelector("label")!.className).toContain("bd-label--inline");
  });

  it("does NOT emit data-disabled by default", () => {
    const { container } = render(<Label>x</Label>);
    expect(container.querySelector("label")!.hasAttribute("data-disabled")).toBe(false);
  });

  it("emits data-disabled when disabled=true", () => {
    const { container } = render(<Label disabled>x</Label>);
    expect(container.querySelector("label")!.getAttribute("data-disabled")).toBe(
      "true",
    );
  });

  it("forwards htmlFor natively", () => {
    const { container } = render(<Label htmlFor="my-input">x</Label>);
    expect(container.querySelector("label")!.getAttribute("for")).toBe("my-input");
  });

  it("does NOT render __required marker by default", () => {
    const { container } = render(<Label>x</Label>);
    expect(container.querySelector(".bd-label__required")).toBeNull();
  });

  it("renders __required marker when required=true (aria-hidden, no text)", () => {
    const { container } = render(<Label required>Email</Label>);
    const marker = container.querySelector(".bd-label__required")! as HTMLElement;
    expect(marker).toBeTruthy();
    expect(marker.getAttribute("aria-hidden")).toBe("true");
    // The asterisk glyph comes from CSS ::before pseudo-element, not text content.
    expect(marker.textContent).toBe("");
  });

  it("does NOT render __info trigger by default", () => {
    const { container } = render(<Label>x</Label>);
    expect(container.querySelector(".bd-label__info")).toBeNull();
  });

  it("renders __info button when info=true with default aria-label", () => {
    const { container } = render(<Label info>x</Label>);
    const btn = container.querySelector("button.bd-label__info")! as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.getAttribute("aria-label")).toBe("More info");
    // Inner Icon
    expect(btn.querySelector("svg.bd-icon")).toBeTruthy();
  });

  it("forwards info onClick handler when info is an object", () => {
    let clicked = false;
    const { container } = render(
      <Label info={{ onClick: () => { clicked = true; } }}>x</Label>,
    );
    fireEvent.click(container.querySelector("button.bd-label__info")!);
    expect(clicked).toBe(true);
  });

  it("forwards custom info aria-label when info is an object", () => {
    const { container } = render(
      <Label info={{ "aria-label": "Show field guidance" }}>x</Label>,
    );
    expect(container.querySelector(".bd-label__info")!.getAttribute("aria-label"))
      .toBe("Show field guidance");
  });

  it("renders required + info together, in that order", () => {
    const { container } = render(<Label required info>Email</Label>);
    const label = container.querySelector("label")!;
    const required = label.querySelector(".bd-label__required");
    const info = label.querySelector(".bd-label__info");
    expect(required).toBeTruthy();
    expect(info).toBeTruthy();
    // DOM order: required comes before info
    expect(required!.compareDocumentPosition(info!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("merges caller className", () => {
    const { container } = render(<Label className="extra">x</Label>);
    expect(container.querySelector("label")!.className).toContain("extra");
  });
});
