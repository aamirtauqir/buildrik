// @vitest-environment jsdom
/**
 * B6-B02 / B04 (203:34125, 203:34892): the colour token edit page — hex per
 * mode, an invalid draft kept with its message, dark shades from the light
 * colour's own scale, the alias select, Token actions.
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DesignToken } from "@/editor/design-system/types";
import { ColorTokenEditor, darkShadeSuggestions } from "../ColorTokenEditor";

afterEach(cleanup);

const prim = (id: string, value: string): DesignToken =>
  ({ id, name: id, kind: "color", category: "colors", type: "color", layer: "primitive", cssVar: `--buildrick-design-${id}`, modes: { light: { value } } }) as DesignToken;
const primary = { ...prim("primary", ""), name: "Primary", layer: "semantic", modes: { light: { alias: "custom-primary" }, dark: { alias: "custom-primary-dark" } } } as DesignToken;
const TOKENS = [prim("custom-primary", "#1A56DB"), prim("custom-primary-dark", "#60A5FA"), prim("brand-700", "#1E429F"), primary];

function mount(over: Partial<React.ComponentProps<typeof ColorTokenEditor>> = {}) {
  const onValueChange = vi.fn();
  const onAliasChange = vi.fn();
  render(<ColorTokenEditor token={primary} composer={null} allTokens={TOKENS} onValueChange={onValueChange} onAliasChange={onAliasChange} onSelectToken={vi.fn()} {...over} />);
  return { onValueChange, onAliasChange };
}

describe("ColorTokenEditor (B6-B02)", () => {
  it("shows both modes' hex; Enter on a valid light hex writes it", () => {
    const { onValueChange } = mount();
    const light = screen.getByLabelText("Light value") as HTMLInputElement;
    expect(light.value).toBe("#1A56DB");
    expect((screen.getByLabelText("Dark value") as HTMLInputElement).value).toBe("#60A5FA");
    fireEvent.change(light, { target: { value: "#0d736b" } });
    fireEvent.keyDown(light, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("primary", "#0D736B");
  });

  it("B04: an invalid hex stays in the field with its message and writes nothing", () => {
    const { onValueChange } = mount();
    const light = screen.getByLabelText("Light value");
    fireEvent.change(light, { target: { value: "#12X" } });
    fireEvent.blur(light);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("brand-token-hex-error")).toHaveTextContent("Enter a valid hex color, such as #1A56DB. The token hasn’t changed.");
  });

  it("dark shade suggestions come from the light colour's own scale and write the dark mode", () => {
    const shades = darkShadeSuggestions("#1A56DB");
    expect(shades.length).toBeGreaterThan(1);
    expect(darkShadeSuggestions("not a colour")).toEqual([]);
    const { onValueChange } = mount();
    fireEvent.click(screen.getByTestId("brand-dark-suggestions"));
    fireEvent.click(screen.getAllByTestId("brand-dark-suggestion")[0]);
    expect(onValueChange).toHaveBeenCalledWith("primary", "#1A56DB", shades[0].hex);
  });

  it("the alias select reads 'Literal value · no alias' for its own literal and offers other colour tokens, not custom-* ones", () => {
    const { onAliasChange } = mount();
    const select = screen.getByLabelText("Alias") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.options[0].text).toBe("Literal value · no alias");
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["", "brand-700"]);
    fireEvent.change(select, { target: { value: "brand-700" } });
    expect(onAliasChange).toHaveBeenCalledWith("primary", "brand-700");
  });

  it("Token actions lists Rename, Generate scale and Reset to default when given", () => {
    const onGenerateScale = vi.fn();
    mount({ onRename: vi.fn(), onGenerateScale, onReset: vi.fn() });
    fireEvent.click(screen.getByTestId("brand-token-menu"));
    expect(screen.getByRole("menuitem", { name: "Rename…" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Generate scale" }));
    expect(onGenerateScale).toHaveBeenCalledWith("primary");
  });
});
