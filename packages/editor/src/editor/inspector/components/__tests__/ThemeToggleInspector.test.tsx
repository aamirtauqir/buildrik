// @vitest-environment jsdom
/**
 * BRP1-M12 (canvas-light 8228:233132 · off-hidden-on-publish 8228:233827):
 * a selected theme toggle's inspector names the site's Dark mode, opens
 * Brand › Colour mode, and on an Off site says the toggle is hidden on publish.
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { takeBrandPageRequest } from "@/editor/design-system/ui/brandOpenRequest";
import { ThemeToggleInspector } from "../ThemeToggleInspector";

function fake(darkMode: "auto" | "off") {
  const handlers: Record<string, Array<() => void>> = {};
  const settings = { darkMode };
  const composer = {
    getProjectSettings: () => settings,
    on: (e: string, h: () => void) => { (handlers[e] ??= []).push(h); },
    off: (e: string, h: () => void) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    emit: vi.fn(),
  };
  return { composer, settings, fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()) };
}

const NOTE = "Dark mode is Off · Theme toggle is hidden on publish.";

describe("ThemeToggleInspector", () => {
  it("Auto: the site preference, no warning", () => {
    render(<ThemeToggleInspector composer={fake("auto").composer as never} />);
    expect(screen.getByText("Theme toggle")).toBeTruthy();
    expect(screen.getByText("Site preference")).toBeTruthy();
    expect(screen.getByText("Dark mode · Auto")).toBeTruthy();
    expect(screen.getByText("Light and dark values come from Brand. The toggle changes the visitor’s theme.")).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it("Off: says so and warns it is hidden on publish; follows a Dark mode change", () => {
    const stub = fake("off");
    render(<ThemeToggleInspector composer={stub.composer as never} />);
    expect(screen.getByText("Dark mode · Off")).toBeTruthy();
    expect(screen.getByText(NOTE)).toBeTruthy();
    act(() => { stub.settings.darkMode = "auto"; stub.fire(EVENTS.SETTINGS_CHANGE); });
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it("opens Brand on Colour mode", () => {
    const stub = fake("auto");
    render(<ThemeToggleInspector composer={stub.composer as never} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Brand → Colour mode" }));
    expect(stub.composer.emit).toHaveBeenCalledWith(EVENTS.UI_OPEN_DESIGN_PANEL, {});
    expect(takeBrandPageRequest(stub.composer as never)).toBe("colour-mode");
  });
});
