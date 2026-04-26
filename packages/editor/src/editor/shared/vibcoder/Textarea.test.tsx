import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Textarea } from "./Textarea";

describe("vibcoder Textarea wrapper", () => {
  it("renders base; OMITS bd-textarea--md (md is base default); no aria-invalid", () => {
    const { container } = render(<Textarea />);
    const el = container.querySelector("textarea")!;
    expect(el.className).toContain("bd-textarea");
    expect(el.className).not.toContain("bd-textarea--md");
    expect(el.hasAttribute("aria-invalid")).toBe(false);
  });

  it("emits explicit size class for sm and lg", () => {
    const sm = render(<Textarea size="sm" />).container.querySelector("textarea")!;
    const lg = render(<Textarea size="lg" />).container.querySelector("textarea")!;
    expect(sm.className).toContain("bd-textarea--sm");
    expect(lg.className).toContain("bd-textarea--lg");
  });

  it("emits bd-textarea--error + aria-invalid when error", () => {
    const { container } = render(<Textarea error />);
    const el = container.querySelector("textarea")!;
    expect(el.className).toContain("bd-textarea--error");
    expect(el.getAttribute("aria-invalid")).toBe("true");
  });

  it("emits bd-textarea--fixed when fixed", () => {
    const { container } = render(<Textarea fixed />);
    expect(container.querySelector("textarea")!.className).toContain("bd-textarea--fixed");
  });

  it("merges caller className", () => {
    const { container } = render(<Textarea className="extra" />);
    expect(container.querySelector("textarea")!.className).toContain("extra");
  });

  it("forwards native attrs (placeholder, rows, value) + onChange", () => {
    let captured = "";
    const { container } = render(
      <Textarea
        placeholder="say something"
        rows={4}
        defaultValue="hi"
        onChange={(e) => { captured = e.target.value; }}
      />
    );
    const el = container.querySelector("textarea")!;
    expect(el.placeholder).toBe("say something");
    expect(el.rows).toBe(4);
    expect(el.value).toBe("hi");
    fireEvent.change(el, { target: { value: "bye" } });
    expect(captured).toBe("bye");
  });
});
