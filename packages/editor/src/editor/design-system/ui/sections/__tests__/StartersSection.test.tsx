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
import { TokenRegistryProvider, useColorRegistry } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "../../../starters";
import { starterTokenStorageKey } from "../../../state/useApplyStarter";

/** Reads the live colour registry from inside the provider. */
const seen: { registry?: ReturnType<typeof useColorRegistry> } = {};
const Probe: React.FC = () => {
  seen.registry = useColorRegistry();
  return null;
};

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="starters-test">
        <Probe />
        {ui}
      </TokenRegistryProvider>
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

  /* Applying used to write the token blob to localStorage and call
     resetFromSaved, which moves savedTokens too — so the panel read "All
     changes saved" and there was nothing left to Apply. The project never
     heard about it: measured against the database on 2026-08-18, after
     applying Stripe Blue the site's `projectSettings.designTokens` still
     held the defaults. A starter now STAGES, and the panel's own Review &
     Apply — the one path that calls setProjectSettings — commits it. */
  /* The card is the control — boards 152:137 and 306:2186 draw no Apply
     button, and the pill is how the click is answered. */
  it("stages the starter rather than declaring it saved", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[0]);
    expect(seen.registry?.isDirty, "a starter the panel calls saved can never be applied").toBe(true);
  });

  it("moves the live tokens to the starter's values", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    const starter = STARTER_DS_REGISTRY[0];
    const wanted = starter.tokens.find((t) => t.category === "colors" && t.id === "color-primary");
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[0]);
    expect(seen.registry?.tokens.find((t) => t.id === "color-primary")?.value).toBe(wanted?.value);
  });

  it("does not write the token blob itself — persistAll on Apply owns that", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[0]);
    expect(localStorage.getItem(starterTokenStorageKey("p1"))).toBeNull();
  });
});

/* Board 306:2186 — the click is answered by a pill, not by a second button. */
describe("StartersSection — the board's affordances", () => {
  it("has no Apply button below the grid", () => {
    const { container, queryByText } = render(wrap(<StartersSection projectId="p1" />));
    expect(container.querySelector("[data-apply-starter]")).toBeNull();
    expect(queryByText(/^Apply /)).toBeNull();
  });

  it("says Starter applied after a card is chosen", () => {
    const { container, queryByText, getByText } = render(wrap(<StartersSection projectId="p1" />));
    expect(queryByText("Starter applied")).toBeNull();
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1]);
    expect(getByText("Starter applied")).toBeInTheDocument();
  });
});
