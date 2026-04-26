import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Progress } from "./Progress";

describe("vibcoder Progress wrapper", () => {
  it("renders bd-progress + nested bd-progress__bar by default", () => {
    const { container } = render(<Progress value={0.5} />);
    expect(container.querySelector(".bd-progress")).toBeTruthy();
    expect(container.querySelector(".bd-progress__bar")).toBeTruthy();
  });

  it("OMITS bd-progress--md (md is base default) and tone modifier when default", () => {
    const { container } = render(<Progress value={0.5} />);
    const bar = container.querySelector(".bd-progress")!;
    expect(bar.className).not.toContain("bd-progress--md");
    expect(bar.className).not.toContain("bd-progress--success");
    expect(bar.className).not.toContain("bd-progress--warning");
    expect(bar.className).not.toContain("bd-progress--error");
  });

  it("emits explicit size class for sm + lg", () => {
    const { container: a } = render(<Progress value={0.5} size="sm" />);
    expect(a.querySelector(".bd-progress")!.className).toContain("bd-progress--sm");
    const { container: b } = render(<Progress value={0.5} size="lg" />);
    expect(b.querySelector(".bd-progress")!.className).toContain("bd-progress--lg");
  });

  it("supports all 3 non-default tone variants", () => {
    for (const v of ["success", "warning", "error"] as const) {
      const { container } = render(<Progress value={0.5} variant={v} />);
      expect(container.querySelector(".bd-progress")!.className).toContain(
        `bd-progress--${v}`,
      );
    }
  });

  it("threads value into --bdr-progress-value as a 0..1 fraction", () => {
    const { container } = render(<Progress value={0.62} />);
    const bar = container.querySelector(".bd-progress") as HTMLDivElement;
    expect(bar.style.getPropertyValue("--bdr-progress-value")).toBe("0.62");
  });

  it("clamps value < 0 to 0 and value > 1 to 1", () => {
    const { container: a } = render(<Progress value={-0.5} />);
    expect(
      (a.querySelector(".bd-progress") as HTMLDivElement).style.getPropertyValue(
        "--bdr-progress-value",
      ),
    ).toBe("0");
    const { container: b } = render(<Progress value={2} />);
    expect(
      (b.querySelector(".bd-progress") as HTMLDivElement).style.getPropertyValue(
        "--bdr-progress-value",
      ),
    ).toBe("1");
  });

  it("sets aria-valuenow as rounded percent (determinate)", () => {
    const { container } = render(<Progress value={0.625} />);
    const bar = container.querySelector(".bd-progress")!;
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("63"); // round(62.5) → 63
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("OMITS aria-valuenow when indeterminate", () => {
    const { container } = render(<Progress indeterminate />);
    const bar = container.querySelector(".bd-progress")!;
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
    expect(bar.className).toContain("bd-progress--indeterminate");
  });

  it("OMITS --bdr-progress-value style when indeterminate", () => {
    const { container } = render(<Progress indeterminate />);
    const bar = container.querySelector(".bd-progress") as HTMLDivElement;
    expect(bar.style.getPropertyValue("--bdr-progress-value")).toBe("");
  });

  it("renders bare bar (no row composite) when label/showPercent unset", () => {
    const { container } = render(<Progress value={0.5} />);
    expect(container.querySelector(".bd-progress-row")).toBeNull();
  });

  it("renders bd-progress-row composite when label is set", () => {
    const { container } = render(
      <Progress value={0.5} label="Publishing 7 changes" />,
    );
    const row = container.querySelector(".bd-progress-row")!;
    expect(row).toBeTruthy();
    expect(row.querySelector(".bd-progress-row__label")!.textContent).toContain(
      "Publishing 7 changes",
    );
  });

  it("renders percent text when showPercent is true (uses rounded percent)", () => {
    const { container } = render(
      <Progress value={0.625} label="Upload" showPercent />,
    );
    const pct = container.querySelector(".bd-progress-row__pct")!;
    expect(pct.textContent).toBe("63%");
  });

  it("OMITS percent text in row when indeterminate (no value to display)", () => {
    const { container } = render(
      <Progress label="Publishing" showPercent indeterminate />,
    );
    const pct = container.querySelector(".bd-progress-row__pct")!;
    expect(pct.textContent).toBe("");
  });

  it("renders row composite with showPercent alone (no label text)", () => {
    const { container } = render(<Progress value={0.5} showPercent />);
    expect(container.querySelector(".bd-progress-row")).toBeTruthy();
    expect(container.querySelector(".bd-progress-row__pct")!.textContent).toBe(
      "50%",
    );
  });

  it("merges caller className on outer wrapper (bare-bar form)", () => {
    const { container } = render(<Progress value={0.5} className="extra" />);
    expect(container.querySelector(".bd-progress")!.className).toContain("extra");
  });

  it("merges caller className on outer wrapper (row composite form)", () => {
    const { container } = render(
      <Progress value={0.5} label="x" className="extra" />,
    );
    expect(container.querySelector(".bd-progress-row")!.className).toContain(
      "extra",
    );
  });

  it("forwards arbitrary attrs to the bar", () => {
    const { container } = render(
      <Progress value={0.5} aria-label="Upload progress" data-testid="p" />,
    );
    const bar = container.querySelector(".bd-progress")!;
    expect(bar.getAttribute("aria-label")).toBe("Upload progress");
    expect(bar.getAttribute("data-testid")).toBe("p");
  });
});
