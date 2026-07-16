/**
 * ColorPalette — harmony generation is pure HSL math (hexToHsl/hslToHex are
 * module-private), verified through the rendered swatch hex codes with a
 * known-simple base color (#ff0000 → h0 s100 l50).
 *
 * Expected values are hand-derived from the standard HSL→RGB formula:
 *   complementary(#ff0000) → #00ffff / light #ff6666 / dark #990000
 *   triadic                → #00ff00, #0000ff, light #ff9999
 *   analogous              → #ff0080 (330°), #ff8000 (30°), accent #660000
 *   split                  → #00ff80 (150°), #0080ff (210°), muted #d92626
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ColorPalette } from "../ColorPalette";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(onApplyColor?: (c: string) => void) {
  const utils = render(<ColorPalette onApplyColor={onApplyColor} />);
  const textInput = utils.container.querySelector('input[type="text"]') as HTMLInputElement;
  const setBase = (hex: string) => fireEvent.change(textInput, { target: { value: hex } });
  return { ...utils, textInput, setBase };
}

describe("ColorPalette — harmonies (pure HSL math)", () => {
  it("defaults: 4 complementary swatches for #3b82f6, primary echoes the base", () => {
    setup();
    for (const name of ["Primary", "Complement", "Light", "Dark"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText("#3b82f6")).toBeInTheDocument();
  });

  it("complementary of pure red: hue +180 plus light/dark ramps", () => {
    const { setBase } = setup();
    setBase("#ff0000");
    expect(screen.getByText("#ff0000")).toBeInTheDocument(); // Primary
    expect(screen.getByText("#00ffff")).toBeInTheDocument(); // Complement (180°)
    expect(screen.getByText("#ff6666")).toBeInTheDocument(); // Light (l+20)
    expect(screen.getByText("#990000")).toBeInTheDocument(); // Dark (l-20)
  });

  it("triadic of pure red: +120° and +240° rotations", () => {
    const { setBase } = setup();
    setBase("#ff0000");
    fireEvent.click(screen.getByRole("button", { name: "triadic" }));
    expect(screen.getByText("Triad 1")).toBeInTheDocument();
    expect(screen.getByText("#00ff00")).toBeInTheDocument(); // 120°
    expect(screen.getByText("#0000ff")).toBeInTheDocument(); // 240°
    expect(screen.getByText("#ff9999")).toBeInTheDocument(); // Light (l+30)
  });

  it("analogous of pure red: ±30° neighbors and a darker accent", () => {
    const { setBase } = setup();
    setBase("#ff0000");
    fireEvent.click(screen.getByRole("button", { name: "analogous" }));
    expect(screen.getByText("Adjacent 1")).toBeInTheDocument();
    expect(screen.getByText("#ff0080")).toBeInTheDocument(); // 330°
    expect(screen.getByText("#ff8000")).toBeInTheDocument(); // 30°
    expect(screen.getByText("#660000")).toBeInTheDocument(); // Accent (l-30)
  });

  it("split-complementary of pure red: +150° / +210° and a desaturated muted", () => {
    const { setBase } = setup();
    setBase("#ff0000");
    fireEvent.click(screen.getByRole("button", { name: "split" }));
    expect(screen.getByText("Split 1")).toBeInTheDocument();
    expect(screen.getByText("#00ff80")).toBeInTheDocument(); // 150°
    expect(screen.getByText("#0080ff")).toBeInTheDocument(); // 210°
    expect(screen.getByText("#d92626")).toBeInTheDocument(); // Muted (s-30)
  });

  it("all generated swatches are valid 6-digit hex", () => {
    const { setBase, container } = setup();
    setBase("#3b82f6");
    for (const harmony of ["complementary", "analogous", "triadic", "split"]) {
      fireEvent.click(screen.getByRole("button", { name: harmony }));
      const hexLabels = Array.from(container.querySelectorAll("div"))
        .map((d) => d.textContent ?? "")
        .filter((t) => /^#[0-9a-f]{6}$/.test(t));
      expect(hexLabels.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("ColorPalette — interactions", () => {
  it("clicking a swatch calls onApplyColor with its hex", () => {
    const onApply = vi.fn();
    const { setBase } = setup(onApply);
    setBase("#ff0000");
    fireEvent.click(screen.getByText("#00ffff"));
    expect(onApply).toHaveBeenCalledWith("#00ffff");
  });

  it("Random Palette sets base to hslToHex(randomHue, 70, 50) — deterministic under mocked Math.random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // hue = 180
    const { textInput } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Random Palette/ }));
    // hslToHex(180, 70, 50) = #26d9d9
    expect(textInput.value).toBe("#26d9d9");
    expect(screen.getByText("#26d9d9")).toBeInTheDocument();
  });
});
