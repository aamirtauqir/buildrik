// @vitest-environment jsdom
/**
 * BRP1-M8 — Dark mode Off / Auto, the missing-dark preview flow, and the
 * disabled Dark preview on an Off site.
 */
import * as React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { proposeMissingDarks } from "@/engine/designSystem/scale";

const take = vi.fn<(...a: unknown[]) => Promise<boolean>>();
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({ takeRestorePoint: (...a: unknown[]) => take(...a) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));

import { DarkModeCard } from "../DarkModeCard";
import { wrap } from "../../__tests__/brandWorkspaceHarness";

/* The seed with every semantic colour already given a dark value. */
const FILLED = proposeMissingDarks(DEFAULT_TOKENS).tokens;

const custom: DesignToken = {
  id: "color-brand-x", name: "Brand X", kind: "color", layer: "semantic", modes: { light: { value: "#C2410C" } },
  category: "colors", cssVar: "--buildrick-design-color-brand-x", type: "color",
};

function fake(designTokens: DesignToken[], darkMode: "off" | "auto" = "off") {
  const settings: Record<string, unknown> = { designTokens, designTokensSchemaVersion: 6, darkMode };
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  const emit = (e: string) => handlers.get(e)?.forEach((h) => h(settings));
  let theme: "light" | "dark" | "system" = "light";
  const order: string[] = [];
  const c = {
    settings,
    order,
    getProjectSettings: () => settings,
    on: (e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (...a: unknown[]) => void) => handlers.get(e)?.delete(h),
    emit,
    colorMode: {
      get: () => theme,
      set: vi.fn((m: "light" | "dark") => { theme = m; emit("colorMode:changed"); }),
      resolved: () => (theme === "dark" ? "dark" : "light"),
    },
    designSystem: {
      readOnly: false,
      preview: null as unknown,
      setPreview: vi.fn((p: unknown) => { c.designSystem.preview = p; order.push(p ? "preview" : "clear"); }),
      setTokens: vi.fn(() => true),
      setDarkMode: vi.fn((mode: string, _label: string, tokens?: DesignToken[]) => {
        order.push(`setDarkMode:${mode}`);
        Object.assign(settings, { darkMode: mode, ...(tokens ? { designTokens: tokens } : {}) });
        emit("settings:change");
        return true;
      }),
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
  };
  return c;
}

type Fake = ReturnType<typeof fake>;
const onPreviewTheme = vi.fn();
const mount = (c: Fake) =>
  render(wrap(<DarkModeCard composer={c as never} previewTheme="light" onPreviewTheme={onPreviewTheme} />, c as never));

beforeEach(() => {
  take.mockReset();
  take.mockImplementation(async () => true);
});

describe("DarkModeCard (BRP1-M8)", () => {
  it("off: the board's copy; Auto with nothing missing takes a restore point, then switches with no tokens", async () => {
    expect(proposeMissingDarks(FILLED).filled).toEqual([]);
    const c = fake(FILLED);
    const u = mount(c);
    expect(u.getByTestId("brand-dark-mode-note").textContent).toBe("Dark mode is off for this site.");
    expect(u.getByTestId("brand-dark-mode-off").getAttribute("aria-pressed")).toBe("true");
    await act(async () => { fireEvent.click(u.getByTestId("brand-dark-mode-auto")); });
    await waitFor(() => expect(c.designSystem.setDarkMode).toHaveBeenCalledTimes(1));
    expect(take).toHaveBeenCalledWith(c, "s1", "dark-auto");
    expect(c.designSystem.setDarkMode.mock.calls[0]).toEqual(["auto", "Turn on dark mode"]);
    expect(u.getByTestId("brand-dark-mode-auto").getAttribute("aria-pressed")).toBe("true");
  });

  it("generated-aliases lists exactly the token without a dark value, with its proposed dark", () => {
    const c = fake([...FILLED, custom]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    const expected = resolveTokenLiteral(proposeMissingDarks([...FILLED, custom]).tokens, "color-brand-x", "dark");
    expect(expected).toBe("#F17953");
    const row = u.getByTestId("brand-dark-alias-color-brand-x");
    expect(row.getAttribute("data-hex")).toBe("#F17953");
    expect(row.textContent).toBe("Brand X → #F17953");
    expect(u.container.querySelectorAll("[data-testid^='brand-dark-alias-']")).toHaveLength(1);
    expect(c.designSystem.setDarkMode).not.toHaveBeenCalled();
    expect(u.getByTestId("brand-dark-mode-auto").getAttribute("aria-pressed")).toBe("false");
  });

  it("Preview in dark paints the proposal dark; Confirm → restore point → clear → one setDarkMode with the filled tokens", async () => {
    let release!: (v: boolean) => void;
    take.mockImplementation(() => new Promise<boolean>((r) => { release = r; }));
    const c = fake([...FILLED, custom]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    fireEvent.click(u.getByTestId("brand-dark-mode-preview"));
    expect(c.designSystem.preview).toMatchObject({ darkMode: "auto", theme: "dark" });
    fireEvent.click(u.getByTestId("brand-dark-mode-confirm"));
    fireEvent.click(u.getByTestId("brand-dark-mode-confirm"));
    expect(take).toHaveBeenCalledTimes(1);
    expect((u.getByTestId("brand-dark-mode-confirm") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { release(true); });
    expect(c.designSystem.setDarkMode).toHaveBeenCalledTimes(1);
    expect(c.order.slice(-2)).toEqual(["clear", "setDarkMode:auto"]);
    const [mode, , tokens] = c.designSystem.setDarkMode.mock.calls[0];
    expect(mode).toBe("auto");
    expect(resolveTokenLiteral(tokens as DesignToken[], "color-brand-x", "dark")).toBe("#F17953");
    expect(c.designSystem.preview).toBeNull();
  });

  it("Cancel clears the preview, writes nothing, and the setting reads Off", () => {
    const c = fake([...FILLED, custom]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    fireEvent.click(u.getByTestId("brand-dark-mode-preview"));
    fireEvent.click(u.getByTestId("brand-dark-mode-cancel"));
    expect(c.designSystem.preview).toBeNull();
    expect(c.designSystem.setDarkMode).not.toHaveBeenCalled();
    expect(u.getByTestId("brand-dark-mode-off").getAttribute("aria-pressed")).toBe("true");
  });

  it("unmounting mid-preview puts the saved brand back", () => {
    const c = fake([...FILLED, custom]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    fireEvent.click(u.getByTestId("brand-dark-mode-preview"));
    u.unmount();
    expect(c.designSystem.preview).toBeNull();
  });

  it("a restore point that cannot be saved blocks the switch (OQ-6)", async () => {
    take.mockImplementation(async () => false);
    const c = fake([...FILLED, custom]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    fireEvent.click(u.getByTestId("brand-dark-mode-preview"));
    await act(async () => { fireEvent.click(u.getByTestId("brand-dark-mode-confirm")); });
    expect(u.getByTestId("brand-dark-mode-error").textContent).toBe("We couldn't save a restore point — nothing was changed.");
    expect(c.designSystem.setDarkMode).not.toHaveBeenCalled();
    expect(u.getByTestId("brand-dark-mode-confirm").textContent).toBe("Retry");
  });

  it("Auto → Off switches with no restore point (OQ-7)", () => {
    const c = fake(DEFAULT_TOKENS, "auto");
    const u = mount(c);
    expect(u.getByTestId("brand-dark-mode-note").textContent).toBe("Your site has light and dark values.");
    fireEvent.click(u.getByTestId("brand-dark-mode-off"));
    expect(c.designSystem.setDarkMode).toHaveBeenCalledWith("off", "Turn off dark mode");
    expect(take).not.toHaveBeenCalled();
  });

  it("the card's Light / Dark preview asks the workspace's preview-only switch (L4-021)", () => {
    const c = fake(FILLED, "auto");
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-preview-dark"));
    expect(onPreviewTheme).toHaveBeenCalledWith("dark");
    expect(c.colorMode.set).not.toHaveBeenCalled();
  });

  it("the card's Dark preview is disabled while Off, enabled in Auto", () => {
    const off = mount(fake(DEFAULT_TOKENS));
    expect((off.getByTestId("brand-dark-mode-preview-dark") as HTMLButtonElement).disabled).toBe(true);
    off.unmount();
    const auto = mount(fake(DEFAULT_TOKENS, "auto"));
    expect((auto.getByTestId("brand-dark-mode-preview-dark") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("DarkModeCard — Off mid-flow", () => {
  it("is Cancel while the generated values are shown", () => {
    const c = fake([...proposeMissingDarks(DEFAULT_TOKENS).tokens, {
      id: "color-brand-y", name: "Brand Y", kind: "color", layer: "semantic", modes: { light: { value: "#0E7490" } },
      category: "colors", cssVar: "--buildrick-design-color-brand-y", type: "color",
    }]);
    const u = mount(c);
    fireEvent.click(u.getByTestId("brand-dark-mode-auto"));
    fireEvent.click(u.getByTestId("brand-dark-mode-preview"));
    fireEvent.click(u.getByTestId("brand-dark-mode-off"));
    expect(c.designSystem.preview).toBeNull();
    expect(c.designSystem.setDarkMode).not.toHaveBeenCalled();
    expect(u.getByTestId("brand-dark-mode-off").getAttribute("aria-pressed")).toBe("true");
  });
});
