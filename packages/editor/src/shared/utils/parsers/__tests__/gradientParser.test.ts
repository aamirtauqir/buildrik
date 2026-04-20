import { describe, it, expect } from "vitest";
import {
  parseGradient,
  serializeGradient,
} from "../gradientParser";
import {
  extractGradientUI,
  composeGradient,
  deriveBgType,
} from "../gradientHelpers";

describe("parseGradient", () => {
  it("returns null for null/empty/solid-color input", () => {
    expect(parseGradient("")).toBeNull();
    expect(parseGradient("#333")).toBeNull();
    expect(parseGradient("red")).toBeNull();
  });

  it("parses linear-gradient with angle", () => {
    const result = parseGradient("linear-gradient(135deg, #ff0000, #00ff00)");
    expect(result).not.toBeNull();
    expect(result?.type).toBe("linear");
    if (result && result.type === "linear") {
      expect(result.angle).toBe(135);
      expect(result.stops).toHaveLength(2);
    }
  });

  it("parses linear-gradient with direction", () => {
    const result = parseGradient("linear-gradient(to right, red, blue)");
    expect(result).not.toBeNull();
    if (result && result.type === "linear") {
      expect(result.angle).toBe(90);
    }
  });

  it("parses radial-gradient", () => {
    const result = parseGradient("radial-gradient(circle, red, blue)");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("radial");
  });

  it("returns null for var() reference (opaque)", () => {
    expect(parseGradient("var(--accent)")).toBeNull();
  });

  it("roundtrips through serializeGradient", () => {
    const input = "linear-gradient(135deg, rgb(255, 0, 0), rgb(0, 255, 0))";
    const result = parseGradient(input);
    expect(result).not.toBeNull();
    const output = serializeGradient(result!);
    expect(output).toContain("135deg");
  });
});

describe("extractGradientUI", () => {
  it("returns color type for empty input", () => {
    expect(extractGradientUI(undefined).type).toBe("color");
  });

  it("returns gradient type for linear-gradient", () => {
    const ui = extractGradientUI("linear-gradient(135deg, #ff0000, #00ff00)");
    expect(ui.type).toBe("gradient");
    expect(ui.gradientType).toBe("linear");
    expect(ui.angle).toBe(135);
  });

  it("returns image type for url()", () => {
    expect(extractGradientUI("url('image.jpg')").type).toBe("image");
  });
});

describe("composeGradient", () => {
  it("composes a linear gradient string", () => {
    const result = composeGradient({ type: "linear", angle: 90, color1: "#ff0000", color2: "#00ff00" });
    expect(result).toBe("linear-gradient(90deg, #ff0000, #00ff00)");
  });

  it("composes a radial gradient string", () => {
    const result = composeGradient({ type: "radial", angle: 0, color1: "#ff0000", color2: "#00ff00" });
    expect(result).toBe("radial-gradient(circle, #ff0000, #00ff00)");
  });
});

describe("deriveBgType", () => {
  it("derives gradient from background property", () => {
    expect(deriveBgType({ background: "linear-gradient(135deg, red, blue)" })).toBe("gradient");
  });

  it("derives gradient from background-image property", () => {
    expect(deriveBgType({ "background-image": "radial-gradient(circle, red, blue)" })).toBe("gradient");
  });

  it("derives image from url()", () => {
    expect(deriveBgType({ "background-image": "url('img.jpg')" })).toBe("image");
  });

  it("defaults to color", () => {
    expect(deriveBgType({ "background-color": "#333" })).toBe("color");
    expect(deriveBgType({})).toBe("color");
  });
});