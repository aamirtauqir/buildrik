/**
 * StartersSection — Brand › Starters, board 7316:85139 (C1 (ii)).
 *
 * The row is the control: a click STAGES the starter (draft, never saved
 * here). The drawer's warning callout, thumbnails and "Starter applied" pill
 * are not on the board.
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
  it("offers every starter in the registry as a row in one radiogroup card", () => {
    const { getByRole } = render(wrap(<StartersSection projectId="p1" />));
    const group = getByRole("radiogroup", { name: /starter design systems/i });
    expect(group.querySelectorAll('[role="radio"]').length).toBe(STARTER_DS_REGISTRY.length);
  });

  it("each row names the starter over '<fonts> · <colour>' (7316:85139); the description is its title", () => {
    const { getByTestId } = render(wrap(<StartersSection projectId="p1" />));
    const first = STARTER_DS_REGISTRY[0];
    const row = getByTestId(`starter-row-${first.id}`);
    expect(row.textContent).toContain(first.name);
    expect(getByTestId(`starter-line-${first.id}`).textContent).toMatch(/^[A-Z][\w ]+( \+ [\w ]+)? · #[0-9A-F]{6} on #[0-9A-F]{6}$/);
    expect(row.getAttribute("title")).toBe(first.description);
  });

  it("stages the starter rather than declaring it saved", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(seen.registry?.isDirty, "a starter the panel calls saved can never be applied").toBe(true);
  });

  it("moves the live tokens to the starter's values", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    const wanted = STARTER_DS_REGISTRY[0].tokens.find((t) => t.id === "color-primary");
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(seen.registry?.tokens.find((t) => t.id === "color-primary")?.value).toBe(wanted?.value);
  });

  it("does not write the token blob itself — persistAll on Apply owns that", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(localStorage.getItem(starterTokenStorageKey("p1"))).toBeNull();
  });

  it("marks the chosen row checked, and Enter chooses too", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    const rows = container.querySelectorAll<HTMLElement>('[role="radio"]');
    fireEvent.keyDown(rows[1], { key: "Enter" });
    expect(rows[1].getAttribute("aria-checked")).toBe("true");
    expect(rows[0].getAttribute("aria-checked")).toBe("false");
  });

  it("draws none of the drawer's furniture: no warning note, no Apply button, no pill", () => {
    const { container, queryByRole, queryByText } = render(wrap(<StartersSection projectId="p1" />));
    expect(queryByRole("note")).toBeNull();
    expect(container.querySelector("[data-apply-starter]")).toBeNull();
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(queryByText("Starter applied")).toBeNull();
  });
});
