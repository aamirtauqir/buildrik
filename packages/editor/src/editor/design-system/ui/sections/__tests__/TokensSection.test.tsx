/**
 * TokensSection — the Tokens destination, board 152:52.
 *
 * Rewritten with the drill-in. The suite this replaces asserted the accordion
 * of expandable cards (`COLOR · 12 TOKENS [-]`, mono uppercase headers, glyph
 * toggling, aria-expanded) — a shape that came from prototype s02 and that the
 * board moved past, the same way Brand's root moved from a tab bar to a
 * drill-in. Those tests were pinning the old design, not catching a regression.
 *
 * The mode-driven token filter is NOT design and is carried over unchanged:
 * beginner shows only semantic colors, pro shows primitives too, and the count
 * on the row must follow the filter rather than the raw total.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";
import { TokensSection } from "../TokensSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";

const wrap = (children: React.ReactNode, mode: "beginner" | "pro" = "beginner") => (
  <ToastProvider>
    <DSModeProvider initialMode={mode}>
      <TokenRegistryProvider projectId="tokens-section-test">
        {children}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

const rows = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>("[data-kind-id]"));

const rowFor = (c: HTMLElement, kind: string) =>
  c.querySelector<HTMLButtonElement>(`[data-kind-id="${kind}"]`)!;

describe("TokensSection — kind list (board 152:52)", () => {
  it("lists every token kind as a row, not an expandable card", () => {
    const { container } = render(wrap(<TokensSection />));
    expect(rows(container)).toHaveLength(14);
    // The accordion it replaced is gone for good.
    expect(container.querySelector("[data-token-kind-card]")).toBeNull();
  });

  it("names the kinds the way the board writes them — lowercase", () => {
    const { container } = render(wrap(<TokensSection />));
    const labels = rows(container).map((r) => r.textContent ?? "");
    for (const kind of ["color", "spacing", "radius", "shadow", "motion"]) {
      expect(labels.some((l) => l.includes(kind))).toBe(true);
    }
    // Not the old mono uppercase header format.
    expect(labels.some((l) => /TOKENS/.test(l))).toBe(false);
  });

  it("opens a kind rather than expanding in place", () => {
    const onOpenKind = vi.fn();
    const { container } = render(wrap(<TokensSection onOpenKind={onOpenKind} />));
    fireEvent.click(rowFor(container, "color"));
    expect(onOpenKind).toHaveBeenCalledWith("color");
  });

  it("shows only the open kind's tokens once drilled in, and no rows", () => {
    const { container } = render(wrap(<TokensSection openKind="color" />, "pro"));
    expect(rows(container)).toHaveLength(0);
    expect(container.querySelector("[data-token-id],[data-token-row]")).toBeTruthy();
  });
});

describe("TokensSection — mode-driven token filter (carried over)", () => {
  const tokenIds = (c: HTMLElement): string[] =>
    Array.from(c.querySelectorAll("[data-token-id],[data-token-row]"))
      .map((r) => r.getAttribute("data-token-id") ?? r.getAttribute("data-token-row"))
      .filter((x): x is string => Boolean(x));

  it("beginner shows only color tokens carrying semanticKind", () => {
    const { container } = render(wrap(<TokensSection openKind="color" />, "beginner"));
    const ids = tokenIds(container);
    expect(ids).toContain("color-action");
    expect(ids).toContain("color-surface");
    expect(ids).toContain("color-text-primary");
    expect(ids).toContain("color-feedback-error");
    expect(ids).not.toContain("color-brand-500");
    expect(ids).not.toContain("color-primary");
    expect(ids).not.toContain("color-error");
  });

  it("pro shows primitives alongside semantics", () => {
    const { container } = render(wrap(<TokensSection openKind="color" />, "pro"));
    const ids = tokenIds(container);
    expect(ids).toContain("color-action");
    expect(ids).toContain("color-brand-500");
    expect(ids).toContain("color-primary");
  });

  it("the row count follows the filter, not the raw total", () => {
    /* Read the count attribute, not the concatenated text: "color" and "4"
       run together as `color4›`, where \\b never matches. */
    const beginner = render(wrap(<TokensSection />, "beginner"));
    expect(rowFor(beginner.container, "color").getAttribute("data-kind-count")).toBe("4");
    beginner.unmount();

    const pro = render(wrap(<TokensSection />, "pro"));
    expect(rowFor(pro.container, "color").getAttribute("data-kind-count")).toBe("17");
  });
});
