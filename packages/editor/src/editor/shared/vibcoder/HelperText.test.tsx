import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelperText } from "./HelperText";

describe("vibcoder HelperText wrapper", () => {
  it("renders <p> with bd-helper-text class", () => {
    const { container } = render(<HelperText>Hint text</HelperText>);
    const el = container.querySelector("p")!;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bd-helper-text");
    expect(el.textContent).toBe("Hint text");
  });

  it("OMITS tone modifier by default (default = virtual muted)", () => {
    const { container } = render(<HelperText>x</HelperText>);
    const cls = container.querySelector("p")!.className;
    expect(cls).not.toContain("bd-helper-text--error");
    expect(cls).not.toContain("bd-helper-text--success");
    expect(cls).not.toContain("bd-helper-text--warning");
  });

  it("emits explicit tone class for all 3 tones", () => {
    for (const t of ["error", "success", "warning"] as const) {
      const { container } = render(<HelperText tone={t}>x</HelperText>);
      expect(container.querySelector("p")!.className).toContain(
        `bd-helper-text--${t}`,
      );
    }
  });

  it("merges caller className", () => {
    const { container } = render(<HelperText className="extra">x</HelperText>);
    expect(container.querySelector("p")!.className).toContain("extra");
  });

  it("forwards arbitrary attrs (e.g., aria-live for async validation)", () => {
    const { container } = render(
      <HelperText aria-live="polite" id="hint-1">
        x
      </HelperText>,
    );
    const el = container.querySelector("p")!;
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("id")).toBe("hint-1");
  });
});
