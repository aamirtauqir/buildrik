import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "./Badge";

describe("vibcoder Badge wrapper", () => {
  it("emits bd-badge + variant class for every variant", () => {
    const variants = [
      "published", "draft", "issues", "unsaved",
      "syncing", "new", "premium", "count",
    ] as const;
    for (const v of variants) {
      const { container } = render(<Badge variant={v}>x</Badge>);
      const b = container.querySelector("span")!;
      expect(b.className).toContain("bd-badge");
      expect(b.className).toContain(`bd-badge--${v}`);
    }
  });

  it("OMITS dot child by default", () => {
    const { container } = render(<Badge variant="published">x</Badge>);
    expect(container.querySelector(".bd-badge__dot")).toBeNull();
  });

  it("renders bd-badge__dot child before text when dot prop is true", () => {
    const { container } = render(<Badge variant="published" dot>Published</Badge>);
    const dot = container.querySelector(".bd-badge__dot")!;
    expect(dot).not.toBeNull();
    // dot should precede the text in the DOM order
    const badge = container.querySelector("span.bd-badge")!;
    expect(badge.firstElementChild).toBe(dot);
  });

  it("merges caller className", () => {
    const { container } = render(<Badge variant="draft" className="extra">x</Badge>);
    expect(container.querySelector("span")!.className).toContain("extra");
  });

  it("forwards arbitrary attrs (data-testid)", () => {
    const { container } = render(<Badge variant="new" data-testid="b">x</Badge>);
    expect(container.querySelector("span")!.getAttribute("data-testid")).toBe("b");
  });
});
