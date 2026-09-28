/* @lint-hex-policy: data-fixture
   Hex values are INPUT data to the component under test, not chrome styling. */
/**
 * BackgroundSection — type segmentation, color/image/gradient writes,
 * advanced image-background disclosure. Complements the existing
 * BackgroundSection.test.tsx (preview swatch only).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BackgroundSection } from "../BackgroundSection";

/* The Color / Gradient / Image choice sits behind More settings for a colour
   background (board 7056:78695); these open it unless a case says otherwise. */
function renderBg(props: Partial<React.ComponentProps<typeof BackgroundSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <BackgroundSection styles={{}} onChange={onChange} isOpen={true} advancedExpanded {...props} />
  );
  return { onChange, ...utils };
}

describe("BackgroundSection — bg type segmentation", () => {
  it("defaults to color mode with the color segment pressed", () => {
    renderBg();
    expect(screen.getByRole("button", { name: "color" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("derives image mode from a background-image url", () => {
    renderBg({ styles: { "background-image": "url('https://x/y.png')" } });
    expect(screen.getByRole("button", { name: "image" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("switching to image mode shows the Image URL input", () => {
    renderBg();
    fireEvent.click(screen.getByRole("button", { name: "image" }));
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
  });
});

describe("BackgroundSection — color writes", () => {
  it("typing a hex into the color input writes background-color", () => {
    const { onChange } = renderBg();
    const hexInput = screen.getByRole("textbox", { name: "Colour value" });
    fireEvent.change(hexInput, { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenCalledWith("background-color", "#ff0000");
  });

  it("shows the current background-color hex (without #) in the input", () => {
    renderBg({ styles: { "background-color": "#00ff00" } });
    expect(screen.getByRole("textbox", { name: "Colour value" })).toHaveValue("00ff00");
  });
});

describe("BackgroundSection — image writes", () => {
  it("editing the Image URL wraps the value in url('…')", () => {
    const { onChange } = renderBg({
      styles: { "background-image": "url('https://a/b.png')" },
    });
    const urlInput = screen.getByPlaceholderText("https://...");
    expect(urlInput).toHaveValue("https://a/b.png");
    fireEvent.change(urlInput, { target: { value: "https://c/d.png" } });
    expect(onChange).toHaveBeenCalledWith("background-image", "url('https://c/d.png')");
  });

  it("clearing the Image URL writes an empty background-image", () => {
    const { onChange } = renderBg({
      styles: { "background-image": "url('https://a/b.png')" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith("background-image", "");
  });
});

describe("BackgroundSection — gradient writes", () => {
  it("clicking Linear writes a linear-gradient background", () => {
    const { onChange } = renderBg();
    fireEvent.click(screen.getByRole("button", { name: "gradient" }));
    fireEvent.click(screen.getByRole("button", { name: "Linear" }));
    expect(onChange).toHaveBeenCalledWith(
      "background",
      // Literal stops, never chrome --bk-* tokens: this ships in exported HTML (P-3).
      "linear-gradient(90deg, #1A56DB, #22c55e)"
    );
  });

  it("clicking Radial writes a radial-gradient background", () => {
    const { onChange } = renderBg();
    fireEvent.click(screen.getByRole("button", { name: "gradient" }));
    fireEvent.click(screen.getByRole("button", { name: "Radial" }));
    expect(onChange).toHaveBeenCalledWith(
      "background",
      "radial-gradient(circle, #1A56DB, #22c55e)"
    );
  });
});

describe("BackgroundSection — advanced image disclosure", () => {
  it("hides size/position/repeat until advancedExpanded; toggle badge shows 4", () => {
    const onAdvancedToggle = vi.fn();
    renderBg({
      styles: { "background-image": "url('https://a/b.png')" },
      onAdvancedToggle,
      advancedExpanded: false,
    });
    expect(screen.queryByText("Repeat")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "More settings" });
    expect(toggle).toHaveTextContent("4");
    fireEvent.click(toggle);
    expect(onAdvancedToggle).toHaveBeenCalledTimes(1);
  });

  it("advanced selects write background-size", () => {
    const { onChange, container } = renderBg({
      styles: { "background-image": "url('https://a/b.png')" },
      advancedExpanded: true,
      onAdvancedToggle: vi.fn(),
    });
    const sizeSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "cover")
    ) as HTMLSelectElement;
    fireEvent.change(sizeSelect, { target: { value: "cover" } });
    expect(onChange).toHaveBeenCalledWith("background-size", "cover");
  });

  it("board 7056:78695: a colour background opens as the Fill row, the type choice behind More settings", () => {
    renderBg({ advancedExpanded: false, onAdvancedToggle: vi.fn() });
    expect(screen.queryByRole("button", { name: /gradient/i })).toBeNull();
    expect(screen.getByRole("button", { name: "More settings" })).toBeInTheDocument();
  });
});

/* X-1 (P1, P-11): switching the type left the old fill in place — a gradient
   on `background` kept covering the new colour — and Fill read only
   `background-color`, so a `background:` shorthand colour showed empty. Each
   switch is one batch write, so it is one undo step. */
describe("BackgroundSection — switching type replaces the old fill (X-1)", () => {
  const GRADIENT = "linear-gradient(90deg, #111111, #eeeeee)";

  it("Gradient → Color clears the gradient", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { background: GRADIENT, "background-color": "#00ff00" }, onBatchChange });
    fireEvent.click(screen.getByRole("button", { name: "color" }));
    expect(onBatchChange).toHaveBeenCalledWith({ background: "" });
    expect(screen.getByRole("textbox", { name: "Colour value" })).toHaveValue("00ff00");
  });

  it("Image → Color clears the image", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { "background-image": "url('https://a/b.png')" }, onBatchChange });
    fireEvent.click(screen.getByRole("button", { name: "color" }));
    expect(onBatchChange).toHaveBeenCalledWith({ "background-image": "" });
  });

  it("Image → Gradient replaces the image with a gradient in one write", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { "background-image": "url('https://a/b.png')" }, onBatchChange });
    fireEvent.click(screen.getByRole("button", { name: "gradient" }));
    expect(onBatchChange).toHaveBeenCalledWith({
      "background-image": "",
      background: "linear-gradient(90deg, #1A56DB, #22c55e)",
    });
  });

  it("Gradient → Image keeps the gradient until an image is chosen, then replaces it", () => {
    const onBatchChange = vi.fn();
    const { onChange } = renderBg({ styles: { background: GRADIENT }, onBatchChange });
    fireEvent.click(screen.getByRole("button", { name: "image" }));
    expect(onBatchChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://c/d.png" } });
    expect(onBatchChange).toHaveBeenCalledWith({ background: "", "background-image": "url('https://c/d.png')" });
    expect(onChange).not.toHaveBeenCalledWith("background-image", expect.anything());
  });

  it("Fill reads a `background:` shorthand colour", () => {
    renderBg({ styles: { background: "#ff0000" } });
    expect(screen.getByRole("textbox", { name: "Colour value" })).toHaveValue("ff0000");
  });

  it("writing Fill over a `background:` shorthand clears the shorthand in the same write", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { background: "#ff0000" }, onBatchChange });
    fireEvent.change(screen.getByRole("textbox", { name: "Colour value" }), { target: { value: "00ff00" } });
    expect(onBatchChange).toHaveBeenCalledWith({ background: "", "background-color": "#00ff00" });
  });
});

describe("Fill — v4 labels (boards 1, 21, 27)", () => {
  it("titles the section Fill and names the colour row Colour", () => {
    renderBg();
    expect(screen.getByRole("button", { name: "Fill section, expanded" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Colour value" })).toBeInTheDocument();
  });

  it("on the Page panel the row reads Background", () => {
    renderBg({ variant: "page" });
    expect(screen.getByRole("textbox", { name: "Background value" })).toBeInTheDocument();
  });

  it("has no header add-image action (the frame's + adds)", () => {
    renderBg({ onOpenMediaLibrary: vi.fn() });
    expect(screen.queryByRole("button", { name: "Add background image" })).not.toBeInTheDocument();
  });
});
