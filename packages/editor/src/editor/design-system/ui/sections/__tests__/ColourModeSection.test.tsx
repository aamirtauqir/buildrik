/**
 * ColourModeSection — Brand › Colour mode, board 7316:80949 (C1 (ii)).
 *
 * The load-bearing test is the last one. The dark value used to be typed into a
 * field whose onBlur was empty, so it was discarded silently; this screen exists
 * to set that value, and a test that only checked the list would pass just as
 * happily against a Set button that does nothing.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { ColourModeSection } from "../ColourModeSection";
import { TokenRegistryProvider, useColorRegistry } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="colour-mode-test">{ui}</TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

/** Reads the live registry so a commit can be checked at its source. */
function Probe({ onReady }: { onReady: (r: ReturnType<typeof useColorRegistry>) => void }) {
  const reg = useColorRegistry();
  /* Braces matter: returning the registry from an effect makes React treat
     it as a cleanup function and call it. */
  React.useEffect(() => {
    onReady(reg);
  });
  return null;
}

describe("ColourModeSection", () => {
  it("lists every colour token in one card: the missing ones first, then the paired ones", () => {
    let reg: ReturnType<typeof useColorRegistry> | null = null;
    const { container, getByTestId } = render(
      wrap(
        <>
          <Probe onReady={(r) => (reg = r)} />
          <ColourModeSection />
        </>,
      ),
    );
    const card = getByTestId("brand-colour-mode-list");
    const rows = [...card.querySelectorAll("[data-no-dark-row],[data-dark-row]")];
    expect(rows.length).toBe(reg!.tokens.length);
    const firstPaired = rows.findIndex((r) => r.hasAttribute("data-dark-row"));
    const lastMissing = rows.map((r) => r.hasAttribute("data-no-dark-row")).lastIndexOf(true);
    if (firstPaired !== -1 && lastMissing !== -1) expect(lastMissing).toBeLessThan(firstPaired);
    // The drawer's "NO DARK VALUE" band is not on the board.
    expect(container.querySelector("[data-no-dark-header]")).toBeNull();
  });

  it("a paired row prints LIGHT → DARK, upper-case, with no Set", () => {
    const { container, getByTestId } = render(wrap(<ColourModeSection />));
    const id = container.querySelector("[data-no-dark-row]")!.getAttribute("data-no-dark-row")!;
    fireEvent.click(container.querySelector<HTMLButtonElement>(`[data-set-dark="${id}"]`)!);
    const pick = getByTestId("dark-shade-option-0");
    const hex = pick.getAttribute("data-hex")!;
    fireEvent.click(pick);
    expect(getByTestId(`brand-dark-pair-${id}`).textContent).toMatch(new RegExp(`→ ${hex}$`));
    expect(container.querySelector(`[data-set-dark="${id}"]`)).toBeNull();
  });

  it("offers Set on every listed token", () => {
    const { container } = render(wrap(<ColourModeSection />));
    const rows = container.querySelectorAll("[data-no-dark-row]").length;
    expect(container.querySelectorAll("[data-set-dark]").length).toBe(rows);
  });

  /* G3-146 · 7318:80995: Set opens "Set the dark-mode value" — three shade
     suggestions with their contrast; a pick writes the dark value. A custom
     value stays reachable (the one picker). */
  it("Set offers three shades with contrast; a pick commits the dark value", () => {
    let reg: ReturnType<typeof useColorRegistry> | null = null;
    const { container, getByTestId, getAllByTestId, queryByTestId, getByText } = render(
      wrap(
        <>
          <Probe onReady={(r) => (reg = r)} />
          <ColourModeSection />
        </>,
      ),
    );
    const row = container.querySelector("[data-no-dark-row]") as HTMLElement | null;
    if (!row) return;
    const id = row.getAttribute("data-no-dark-row")!;
    fireEvent.click(container.querySelector<HTMLButtonElement>(`[data-set-dark="${id}"]`)!);
    expect(getByText("Set the dark-mode value")).toBeTruthy();
    expect(getByTestId("dark-shade-crumb").textContent).toBe(`Site brand › ${id}`);
    const options = getAllByTestId(/^dark-shade-option-/);
    expect(options).toHaveLength(3);
    for (const o of options) expect(o.textContent).toMatch(/contrast \d+\.\d:1/);
    const hex = options[1].getAttribute("data-hex")!;
    fireEvent.click(options[1]);
    expect(reg!.tokens.find((t) => t.id === id)?.darkValue).toBe(hex);
    expect(queryByTestId("dark-shade-popover")).toBeNull();
    expect(container.querySelector(`[data-no-dark-row="${id}"]`)).toBeNull();
  });

  it("Custom… opens the one picker; Apply commits a hand-picked value", () => {
    let reg: ReturnType<typeof useColorRegistry> | null = null;
    const { container, getByTestId, getByLabelText, getByText } = render(
      wrap(
        <>
          <Probe onReady={(r) => (reg = r)} />
          <ColourModeSection />
        </>,
      ),
    );
    const row = container.querySelector("[data-no-dark-row]") as HTMLElement | null;
    if (!row) return;
    const id = row.getAttribute("data-no-dark-row")!;
    fireEvent.click(container.querySelector<HTMLButtonElement>(`[data-set-dark="${id}"]`)!);
    fireEvent.click(getByTestId("dark-shade-custom"));
    fireEvent.change(getByLabelText("Hex color value"), { target: { value: "#123456" } });
    fireEvent.click(getByText("Apply"));
    expect(reg!.tokens.find((t) => t.id === id)?.darkValue).toBe("#123456");
  });
});

describe("ColourModeSection — the row names the token unambiguously", () => {
  /*
    Boards 153:92 and 7316:80949 draw these rows as IDs. The row rendered `t.name`
    instead, and the live list holds both `Text` and `Text Primary` — so the
    row could not say which token you were about to give a dark value to, on
    the one screen whose entire job is to set that value in place.
  */
  it("labels each row with the token id, not its display name", () => {
    const { container } = render(wrap(<ColourModeSection />));
    const rows = [...container.querySelectorAll("[data-no-dark-row]")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const id = row.getAttribute("data-no-dark-row")!;
      const label = row.querySelector(`[data-testid="brand-nodark-name-${id}"]`)?.textContent?.trim();
      expect(label).toBe(id);
    }
  });

  it("keeps the human name reachable, so the id is not the only thing said", () => {
    const { container } = render(wrap(<ColourModeSection />));
    const first = container.querySelector('[data-testid^="brand-nodark-name-"]');
    expect(first?.getAttribute("title")).toBeTruthy();
    expect(first?.getAttribute("title")).not.toBe(first?.textContent?.trim());
  });
});
