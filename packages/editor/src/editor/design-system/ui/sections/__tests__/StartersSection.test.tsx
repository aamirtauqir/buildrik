/**
 * StartersSection — Brand › Starters, board 7316:85139 (C1 (ii)).
 *
 * The row is the control: a click APPLIES the starter — one write to the
 * site's tokens, one ⌘Z (Brand Part 1a Task 10; it used to stage a draft).
 * The drawer's warning callout, thumbnails and "Starter applied" pill are not
 * on the board.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";
import { StartersSection } from "../StartersSection";
import { TokenRegistryProvider, useColorRegistry } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "../../../starters";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";
import { makeFakeComposer } from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

/** Reads the live colour registry from inside the provider. */
const seen: { registry?: ReturnType<typeof useColorRegistry> } = {};
const Probe: React.FC = () => {
  seen.registry = useColorRegistry();
  return null;
};

let composer = makeFakeComposer();
const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider composer={composer}>
        <Probe />
        {ui}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  composer = makeFakeComposer();
});

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

  it("applies the starter in ONE write — a valid v6 set, live at once", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    const [written] = composer.designSystem.setTokens.mock.calls[0];
    expect(validateTokens(written).ok).toBe(true);
  });

  it("moves the live tokens to the starter's values, dark included, keeping the palette", () => {
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    const starter = STARTER_DS_REGISTRY[1];
    const before = seen.registry?.tokens.length ?? 0;
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[1]);
    const tokens = seen.registry?.tokens ?? [];
    expect(resolveTokenLiteral(tokens, "color-primary", "light")).toBe(resolveTokenLiteral(starter.tokens, "color-primary", "light"));
    expect(resolveTokenLiteral(tokens, "color-primary", "dark")).toBe(resolveTokenLiteral(starter.tokens, "color-primary", "dark"));
    // The palette primitives survive: a starter is values, not a replacement list.
    expect(tokens.some((t) => t.id === "color-brand-500")).toBe(true);
    expect(tokens.length).toBeGreaterThanOrEqual(before);
  });

  it("writes nothing while the tokens are read-only", () => {
    composer = makeFakeComposer([], { readOnly: true });
    const { container } = render(wrap(<StartersSection projectId="p1" />));
    fireEvent.click(container.querySelectorAll<HTMLElement>('[role="radio"]')[0]);
    expect(composer.settings.designTokens).toEqual([]);
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

describe("StartersSection — Brand from logo or website (BRP1-M11, behind dsAi)", () => {
  it("shows the door only when the caller passes one, and opens it", () => {
    const open = vi.fn();
    const off = render(wrap(<StartersSection projectId="p1" />));
    expect(off.queryByTestId("starter-row-from-source")).toBeNull();
    off.unmount();
    const on = render(wrap(<StartersSection projectId="p1" onOpenFromSource={open} />));
    fireEvent.click(on.getByTestId("starter-row-from-source"));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
