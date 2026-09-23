/**
 * LintSection — Brand › Brand checks, board 7316:84555 (C1 (ii)).
 *
 * The load-bearing pair: Fix appears ONLY on a finding that carries an
 * auto-fix hint (contrast does, via utils/contrastLint); every other finding
 * gets Open. A Fix on a hint-less finding would be a button that cannot work.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { LintSection, brandChecksCaption, contrastFixFor } from "../LintSection";
import { calcContrastRatio } from "../../../utils/colorUtils";
import type { DesignToken } from "../../../types";
import type { LintIssue } from "../../../../../engine/designSystem/linter";

const warn: LintIssue = {
  rule: "missing-dark",
  severity: "warning",
  tokenId: "brand/accent-soft",
  message: "No dark variant",
};

const err: LintIssue = {
  rule: "banned-hue",
  severity: "error",
  tokenId: "brand/violet",
  message: "Banned hue #7C3AED",
};

describe("LintSection", () => {
  it("says nothing is wrong rather than rendering an empty list", () => {
    const { getByText, container } = render(<LintSection issues={[]} />);
    expect(getByText("Nothing to fix")).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("renders one row per finding: what is wrong over the token it is about", () => {
    const { container, getByText } = render(<LintSection issues={[warn, err]} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(getByText("Banned hue — purple, violet or indigo")).toBeTruthy();
    expect(getByText("brand/violet")).toBeTruthy();
    // The engine's full sentence stays reachable on the row.
    expect(container.querySelector('[title="Banned hue #7C3AED"]')).toBeTruthy();
  });

  it("sorts errors above warnings", () => {
    const { container } = render(<LintSection issues={[warn, err]} />);
    const rows = Array.from(container.querySelectorAll("li"));
    expect(rows[0].textContent).toContain("Banned hue");
    expect(rows[1].textContent).toContain("No dark variant");
  });

  it("offers Fix only where the finding carries a hint, Open everywhere else", () => {
    const contrast: LintIssue = {
      rule: "contrast",
      severity: "warning",
      tokenId: "color-pale",
      message: "Pale fails WCAG AA against the page background",
      autoFixHint: "darken-22",
    };
    const onFix = vi.fn();
    const onOpen = vi.fn();
    const { getByTestId, queryByTestId } = render(
      <LintSection issues={[warn, contrast]} onFix={onFix} onOpen={onOpen} />,
    );
    expect(queryByTestId("brand-check-fix-brand/accent-soft")).toBeNull();
    fireEvent.click(getByTestId("brand-check-fix-color-pale"));
    expect(onFix).toHaveBeenCalledWith(contrast);
    fireEvent.click(getByTestId("brand-check-open-brand/accent-soft"));
    expect(onOpen).toHaveBeenCalledWith("brand/accent-soft");
    // The drawer's "Auto-fix isn't available yet" note is gone — it is.
    expect(document.body.textContent).not.toMatch(/Auto-fix isn't available yet/);
  });

  it("captions the page with the count, and says when auto-fix is available", () => {
    expect(brandChecksCaption([warn, err])).toBe("2 issues");
    expect(brandChecksCaption([{ ...warn, autoFixHint: "darken-22" }])).toBe("1 issue · auto-fix available");
  });

  it("keys rows by rule AND token so one token can hold two findings", () => {
    const second: LintIssue = { ...warn, rule: "pure-black", message: "Pure black" };
    const { container } = render(<LintSection issues={[warn, second]} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
});

describe("contrastFixFor — a Fix that actually fixes", () => {
  const bg = { id: "color-background", name: "Background", value: "#FFFFFF", darkValue: "#111827", kind: "color", category: "colors" } as DesignToken;
  const pale = { id: "color-pale", name: "Pale", value: "#EEEEEE", darkValue: "#1F2937", kind: "color", category: "colors" } as DesignToken;

  it("light mode: moves the light value to at least 4.5:1 on the page", () => {
    const fix = contrastFixFor(pale, [bg, pale], "light")!;
    expect(fix.darkValue).toBeUndefined();
    expect(calcContrastRatio(fix.value, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });

  it("dark mode: fixes the dark value against the dark page, leaves the light one", () => {
    const fix = contrastFixFor(pale, [bg, pale], "dark")!;
    expect(fix.value).toBe("#EEEEEE");
    expect(calcContrastRatio(fix.darkValue!, "#111827")).toBeGreaterThanOrEqual(4.5);
  });

  it("returns null when the token already passes", () => {
    const ink = { ...pale, id: "color-ink", value: "#111827" } as DesignToken;
    expect(contrastFixFor(ink, [bg, ink], "light")).toBeNull();
  });
});
