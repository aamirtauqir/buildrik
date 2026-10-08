// @vitest-environment jsdom
/**
 * BRP1-M9 — one colour → an 11-step scale, previewed, restore point first,
 * one transaction.
 */
import * as React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { generateColorScale } from "@/engine/designSystem/scale";

const take = vi.fn<(...a: unknown[]) => Promise<boolean>>();
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({ takeRestorePoint: (...a: unknown[]) => take(...a) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));

import { ScaleGenerator } from "../ScaleGenerator";
import { wrap } from "../../__tests__/brandWorkspaceHarness";

function fake(designTokens: DesignToken[] = DEFAULT_TOKENS) {
  const settings: Record<string, unknown> = { designTokens, designTokensSchemaVersion: 6, darkMode: "auto" };
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  const order: string[] = [];
  const c = {
    order,
    getProjectSettings: () => settings,
    on: (e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (...a: unknown[]) => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h(settings)),
    designSystem: {
      readOnly: false,
      preview: null as null | { tokens: DesignToken[]; darkMode: string },
      setPreview: vi.fn((p: null | { tokens: DesignToken[]; darkMode: string }) => { c.designSystem.preview = p; order.push(p ? "preview" : "clear"); }),
      setTokens: vi.fn((next: DesignToken[], label: string) => {
        order.push(`setTokens:${label}`);
        settings.designTokens = next;
        c.emit("settings:change");
        return true;
      }),
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
  };
  return c;
}
type Fake = ReturnType<typeof fake>;

const mount = (c: Fake, onApplied = vi.fn()) =>
  render(wrap(<ScaleGenerator composer={c as never} roleId="color-primary" onApplied={onApplied} />, c as never));

function pick(u: ReturnType<typeof mount>, hex: string) {
  fireEvent.change(u.getByTestId("brand-scale-input"), { target: { value: hex } });
  fireEvent.click(u.getByTestId("brand-scale-generate"));
}

beforeEach(() => {
  take.mockReset();
  take.mockImplementation(async () => true);
});

describe("ScaleGenerator (BRP1-M9)", () => {
  it("starts on the role's own colour with the board's copy", () => {
    const u = mount(fake());
    expect((u.getByTestId("brand-scale-input") as HTMLInputElement).value).toBe(resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"));
    expect(u.getByTestId("brand-scale-helper").textContent).toBe("Your picked colour is kept exactly.");
    expect(u.getByTestId("brand-scale-generate").textContent).toBe("Generate scale");
  });

  it("renders the generator's 11 values, the picked colour exact, and names the light and dark steps", () => {
    const u = mount(fake());
    pick(u, "#C2410C");
    const s = generateColorScale("#C2410C")!;
    const cells = [...u.getByTestId("brand-scale-swatches").querySelectorAll("li")];
    expect(cells.map((c) => c.getAttribute("data-hex"))).toEqual(s.hexes);
    expect(cells.map((c) => c.getAttribute("data-step"))).toEqual(["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]);
    expect(cells.find((c) => c.hasAttribute("data-picked"))?.getAttribute("data-step")).toBe("600");
    expect(cells.find((c) => c.hasAttribute("data-dark"))?.getAttribute("data-step")).toBe("400");
    expect(cells.find((c) => c.hasAttribute("data-picked"))?.getAttribute("data-hex")).toBe("#C2410C");
    expect(u.getByTestId("brand-scale-light").textContent).toBe("Primary · Light → Primary 600 · #C2410C (your colour)");
    expect(u.getByTestId("brand-scale-dark").textContent).toBe(`Primary · Dark → Primary 400 · ${s.hexes[4]}`);
  });

  it("Preview paints a set whose Primary resolves to the picked colour", () => {
    const c = fake();
    const u = mount(c);
    pick(u, "#C2410C");
    fireEvent.click(u.getByTestId("brand-scale-preview"));
    expect(c.designSystem.preview).not.toBeNull();
    expect(resolveTokenLiteral(c.designSystem.preview!.tokens, "color-primary", "light")).toBe("#C2410C");
    expect(c.designSystem.preview!.darkMode).toBe("auto");
  });

  it("Confirm → restore point → clear → ONE setTokens; a double click writes once", async () => {
    let release!: (v: boolean) => void;
    take.mockImplementation(() => new Promise<boolean>((r) => { release = r; }));
    const c = fake();
    const onApplied = vi.fn();
    const u = mount(c, onApplied);
    pick(u, "#C2410C");
    fireEvent.click(u.getByTestId("brand-scale-preview"));
    fireEvent.click(u.getByTestId("brand-scale-confirm"));
    fireEvent.click(u.getByTestId("brand-scale-confirm"));
    expect(take).toHaveBeenCalledTimes(1);
    expect(take).toHaveBeenCalledWith(c, "s1", "generator");
    await act(async () => { release(true); });
    expect(c.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(c.order.slice(-2)).toEqual(["clear", "setTokens:Generate colour scale"]);
    const written = c.designSystem.setTokens.mock.calls[0][0] as DesignToken[];
    expect(resolveTokenLiteral(written, "color-primary", "light")).toBe("#C2410C");
    expect(resolveTokenLiteral(written, "color-primary", "dark")).toBe(generateColorScale("#C2410C")!.hexes[4]);
    expect(u.getByTestId("brand-scale-confirmed").textContent).toBe("Primary scale added. Primary now uses your colour.");
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it("a restore point that cannot be saved writes nothing (OQ-6)", async () => {
    take.mockImplementation(async () => false);
    const c = fake();
    const u = mount(c);
    pick(u, "#C2410C");
    fireEvent.click(u.getByTestId("brand-scale-preview"));
    await act(async () => { fireEvent.click(u.getByTestId("brand-scale-confirm")); });
    expect(u.getByTestId("brand-scale-error").textContent).toBe("We couldn't save a restore point — nothing was changed.");
    expect(c.designSystem.setTokens).not.toHaveBeenCalled();
  });

  it("Cancel and unmount clear the preview", () => {
    const c = fake();
    const u = mount(c);
    pick(u, "#C2410C");
    fireEvent.click(u.getByTestId("brand-scale-preview"));
    fireEvent.click(u.getByTestId("brand-scale-cancel"));
    expect(c.designSystem.preview).toBeNull();
    fireEvent.click(u.getByTestId("brand-scale-generate"));
    fireEvent.click(u.getByTestId("brand-scale-preview"));
    u.unmount();
    expect(c.designSystem.preview).toBeNull();
  });

  it("a translucent or unreadable colour cannot be generated", () => {
    const u = mount(fake());
    fireEvent.change(u.getByTestId("brand-scale-input"), { target: { value: "rgba(0,0,0,.5)" } });
    expect((u.getByTestId("brand-scale-generate") as HTMLButtonElement).disabled).toBe(true);
    expect(u.getByTestId("brand-scale-helper").textContent).toBe("Enter an opaque colour, like #1A56DB.");
  });
});
