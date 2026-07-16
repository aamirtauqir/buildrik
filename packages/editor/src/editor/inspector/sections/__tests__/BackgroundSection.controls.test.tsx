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

function renderBg(props: Partial<React.ComponentProps<typeof BackgroundSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <BackgroundSection styles={{}} onChange={onChange} isOpen={true} {...props} />
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
    const hexInput = screen.getByRole("textbox", { name: "Color value" });
    fireEvent.change(hexInput, { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenCalledWith("background-color", "#ff0000");
  });

  it("shows the current background-color hex (without #) in the input", () => {
    renderBg({ styles: { "background-color": "#00ff00" } });
    expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue("00ff00");
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
      "linear-gradient(90deg, var(--buildrick-accent), var(--buildrick-success))"
    );
  });

  it("clicking Radial writes a radial-gradient background", () => {
    const { onChange } = renderBg();
    fireEvent.click(screen.getByRole("button", { name: "gradient" }));
    fireEvent.click(screen.getByRole("button", { name: "Radial" }));
    expect(onChange).toHaveBeenCalledWith(
      "background",
      "radial-gradient(circle, var(--buildrick-accent), var(--buildrick-success))"
    );
  });
});

describe("BackgroundSection — advanced image disclosure", () => {
  it("hides size/position/repeat until advancedExpanded; toggle badge shows 4", () => {
    const onAdvancedToggle = vi.fn();
    renderBg({
      styles: { "background-image": "url('https://a/b.png')" },
      onAdvancedToggle,
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
});
