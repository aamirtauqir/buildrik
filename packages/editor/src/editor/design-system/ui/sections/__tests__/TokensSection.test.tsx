/**
 * TokensSection — one kind's token table on its Brand workspace page
 * (Colours 7315:80955 · Spacing and the generic kinds 7576:197036).
 *
 * Rewritten for C1 (ii): the drawer's kind drill-in list (152:52) and its
 * Beginner hint band are gone — the workspace nav is the kind list. The
 * mode-driven token filter is behaviour, not design, and is carried over.
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
      <TokenRegistryProvider projectId="tokens-section-test">{children}</TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

const tokenIds = (c: HTMLElement): string[] =>
  Array.from(c.querySelectorAll("[data-token-row]")).map((r) => r.getAttribute("data-token-row")!);

describe("TokensSection — mode-driven token filter (carried over)", () => {
  it("beginner shows only color tokens carrying semanticKind", () => {
    const { container } = render(wrap(<TokensSection openKind="color" />, "beginner"));
    const ids = tokenIds(container);
    expect(ids).toEqual(expect.arrayContaining(["color-action", "color-surface", "color-text-primary", "color-feedback-error"]));
    expect(ids).not.toContain("color-brand-500");
    expect(ids).not.toContain("color-primary");
  });

  it("pro shows primitives alongside semantics — the whole seeded palette", () => {
    const { container } = render(wrap(<TokensSection openKind="color" />, "pro"));
    const ids = tokenIds(container);
    expect(ids).toEqual(expect.arrayContaining(["color-action", "color-brand-500", "color-primary"]));
    /* 18 since `color-warning` joined the seed (founder call G4, 2026-09-02). */
    expect(ids).toHaveLength(18);
  });

  it("a Beginner page emptied by the filter blames the mode", () => {
    const { getByTestId } = render(wrap(<TokensSection openKind="spacing" />, "beginner"));
    expect(getByTestId("kind-empty").textContent).toMatch(/Beginner mode is hiding \d+ spacing tokens/);
  });
});

describe("TokensSection — the Spacing page (7576:197036)", () => {
  it("lists the presets above a TOKEN · VALUE · PRESET · USED table", () => {
    const { getByTestId, getAllByRole } = render(wrap(<TokensSection openKind="spacing" />, "pro"));
    expect(getByTestId("spacing-preset-compact").textContent).toBe("Compact · 2px");
    expect(getByTestId("spacing-preset-normal")).toBeTruthy();
    expect(getByTestId("spacing-preset-spacious")).toBeTruthy();
    expect(getAllByRole("columnheader").map((h) => h.textContent).filter(Boolean)).toEqual(["Token", "Value", "Preset", "Used"]);
  });

  it("applying a preset restages the scale and names it in the PRESET column", () => {
    const { getByTestId, container } = render(wrap(<TokensSection openKind="spacing" />, "pro"));
    fireEvent.click(getByTestId("spacing-preset-spacious"));
    expect(getByTestId("spacing-preset-spacious").getAttribute("aria-pressed")).toBe("true");
    const first = tokenIds(container)[0];
    expect(getByTestId(`brand-token-preset-${first}`).textContent).toBe("Spacious");
    expect(getByTestId("brand-token-value-space-1").textContent).toBe("6px");
  });

  it("Reset defaults calls the workspace's stager", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(wrap(<TokensSection openKind="spacing" onResetSpacingToDefaults={onReset} />, "pro"));
    fireEvent.click(getByTestId("spacing-reset-defaults"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("TokensSection — a generic kind page", () => {
  it("draws TOKEN · VALUE · USED and a row click selects the token", () => {
    const onSelectToken = vi.fn();
    const { getAllByRole, container } = render(wrap(<TokensSection openKind="radius" onSelectToken={onSelectToken} />, "pro"));
    expect(getAllByRole("columnheader").map((h) => h.textContent).filter(Boolean)).toEqual(["Token", "Value", "Used"]);
    const first = container.querySelector<HTMLElement>("[data-token-row]")!;
    fireEvent.click(first);
    expect(onSelectToken).toHaveBeenCalledWith(first.getAttribute("data-token-row"));
  });

  it("a freshly loaded kind shows no unsaved dot", () => {
    const { container } = render(wrap(<TokensSection openKind="radius" />, "pro"));
    expect(container.querySelector('[aria-label="unsaved changes"]')).toBeNull();
  });
});
