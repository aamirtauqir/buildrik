import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner, StatusDot } from "./Spinner";

describe("vibcoder Spinner wrapper", () => {
  it("renders span with bd-spinner class", () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bd-spinner");
  });

  it("OMITS bd-spinner--md (md is base default) when size is unset", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("span")!.className).not.toContain(
      "bd-spinner--md",
    );
  });

  it("emits explicit size class for sm + lg", () => {
    const { container: a } = render(<Spinner size="sm" />);
    expect(a.querySelector("span")!.className).toContain("bd-spinner--sm");
    const { container: b } = render(<Spinner size="lg" />);
    expect(b.querySelector("span")!.className).toContain("bd-spinner--lg");
  });

  it("emits role=status + aria-label=Loading by default", () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector("span")!;
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-label")).toBe("Loading");
  });

  it("allows aria-label override (caller provides context-specific label)", () => {
    const { container } = render(<Spinner aria-label="Publishing" />);
    expect(container.querySelector("span")!.getAttribute("aria-label")).toBe(
      "Publishing",
    );
  });

  it("merges caller className", () => {
    const { container } = render(<Spinner className="extra" />);
    expect(container.querySelector("span")!.className).toContain("extra");
  });
});

describe("vibcoder StatusDot wrapper", () => {
  it("renders span with bd-status-dot class", () => {
    const { container } = render(<StatusDot />);
    expect(container.querySelector("span")!.className).toContain("bd-status-dot");
  });

  it("emits bd-status-dot--pulse when pulse=true", () => {
    const { container } = render(<StatusDot pulse />);
    expect(container.querySelector("span")!.className).toContain(
      "bd-status-dot--pulse",
    );
  });

  it("OMITS bd-status-dot--pulse by default", () => {
    const { container } = render(<StatusDot />);
    expect(container.querySelector("span")!.className).not.toContain(
      "bd-status-dot--pulse",
    );
  });

  it("emits aria-hidden=true by default (decorative — text label has the meaning)", () => {
    const { container } = render(<StatusDot />);
    expect(container.querySelector("span")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("merges caller className", () => {
    const { container } = render(<StatusDot className="extra" />);
    expect(container.querySelector("span")!.className).toContain("extra");
  });

  it("forwards style prop (callers thread color via parent or inline)", () => {
    const { container } = render(<StatusDot style={{ color: "rgb(0, 128, 0)" }} />);
    const el = container.querySelector("span") as HTMLSpanElement;
    expect(el.style.color).toBe("rgb(0, 128, 0)");
  });
});
