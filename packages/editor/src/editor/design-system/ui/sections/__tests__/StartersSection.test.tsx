/**
 * StartersSection — Brand › Starters, board 152:137.
 *
 * Starters used to be reachable only through a modal opened by a 🎨 toolbar
 * button. The board draws a destination, and the warning it leads with is the
 * point of these tests: applying a starter overwrites tokens you may have hand
 * edited, and the board says so before the grid rather than reassuring you
 * after it.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { StartersSection } from "../StartersSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "../../../starters";
import { starterTokenStorageKey } from "../../../state/useApplyStarter";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="starters-test">{ui}</TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

describe("StartersSection", () => {
  it("warns that applying overwrites tokens, before the grid", () => {
    const { getByRole } = render(wrap(<StartersSection projectId="p1" />));
    expect(getByRole("note").textContent).toMatch(/overwrites your tokens/i);
  });

  it("offers every starter in the registry", () => {
    const { getByRole } = render(wrap(<StartersSection projectId="p1" />));
    const group = getByRole("radiogroup", { name: /starter design systems/i });
    expect(group.children.length).toBe(STARTER_DS_REGISTRY.length);
  });

  it("applies the selected starter and persists it under the project key", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-apply-starter]")!);
    const raw = localStorage.getItem(starterTokenStorageKey("p1"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed.tokens)).toBe(true);
    expect(parsed.tokens.length).toBeGreaterThan(0);
  });

  it("scopes the write to the project it was given", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-apply-starter]")!);
    expect(localStorage.getItem(starterTokenStorageKey("other"))).toBeNull();
  });
});
