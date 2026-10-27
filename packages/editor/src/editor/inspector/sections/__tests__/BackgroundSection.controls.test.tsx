/* @lint-hex-policy: data-fixture
   Hex values are INPUT data to the component under test, not chrome styling. */
/**
 * BackgroundSection — the header's paint-kind select, color / image /
 * gradient writes, a saved many-stop gradient kept as is (2L9 247:23966),
 * the image fill options on the face.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BackgroundSection } from "../BackgroundSection";

function renderBg(props: Partial<React.ComponentProps<typeof BackgroundSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(<BackgroundSection styles={{}} onChange={onChange} isOpen={true} {...props} />);
  return { onChange, ...utils };
}

const kind = () => screen.getByRole("combobox", { name: "Paint kind" }) as HTMLSelectElement;
const choose = (value: string) => fireEvent.change(kind(), { target: { value } });

describe("BackgroundSection — paint kind (header select)", () => {
  it("defaults to Color", () => {
    renderBg();
    expect(kind()).toHaveValue("color");
  });

  it("derives Image from a background-image url", () => {
    renderBg({ styles: { "background-image": "url('https://x/y.png')" } });
    expect(kind()).toHaveValue("image");
  });

  it("choosing Image shows the Source input under 'Image fill options'", () => {
    renderBg();
    choose("image");
    expect(screen.getByText("Image fill options")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
  });

  it("says choosing a kind replaces the fill; the Page panel has neither the select nor the note", () => {
    const { unmount } = renderBg();
    expect(screen.getByText("Choosing a paint kind is an explicit replacement at this layer.")).toBeInTheDocument();
    unmount();
    renderBg({ variant: "page" });
    expect(screen.queryByRole("combobox", { name: "Paint kind" })).toBeNull();
  });
});

describe("BackgroundSection — color writes", () => {
  it("typing a hex into the color input writes background-color", () => {
    const { onChange } = renderBg();
    const hexInput = screen.getByRole("textbox", { name: "Color value" });
    fireEvent.change(hexInput, { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenCalledWith("background-color", "#ff0000");
  });

  it("shows the current background-color hex (with #, 2L9) in the input", () => {
    renderBg({ styles: { "background-color": "#00ff00" } });
    expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue("#00FF00");
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
    choose("gradient");
    fireEvent.click(screen.getByRole("radio", { name: "Linear" }));
    expect(onChange).toHaveBeenCalledWith(
      "background",
      // Literal stops, never chrome --bk-* tokens: this ships in exported HTML (P-3).
      "linear-gradient(90deg, #1A56DB, #22c55e)"
    );
  });

  it("clicking Radial writes a radial-gradient background", () => {
    const { onChange } = renderBg();
    choose("gradient");
    fireEvent.click(screen.getByRole("radio", { name: "Radial" }));
    expect(onChange).toHaveBeenCalledWith(
      "background",
      "radial-gradient(circle, #1A56DB, #22c55e)"
    );
  });
});

describe("BackgroundSection — image fill options (247:23966)", () => {
  it("Source · Size · Position · Repeat · Attachment · Blend on the face, with CSS's defaults shown", () => {
    renderBg({ styles: { "background-image": "url('https://a/b.png')", "background-position": "center" } });
    expect(screen.getByLabelText("Size")).toHaveValue("auto");
    expect(screen.getByLabelText("Position")).toHaveValue("center center");
    expect(screen.getByLabelText("Repeat")).toHaveValue("repeat");
    expect(screen.getByLabelText("Attachment")).toHaveValue("scroll");
    expect(screen.getByLabelText("Blend")).toHaveValue("normal");
    expect(screen.queryByRole("button", { name: "More settings" })).toBeNull();
  });

  it("a select writes its property", () => {
    const { onChange } = renderBg({ styles: { "background-image": "url('https://a/b.png')" } });
    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "cover" } });
    expect(onChange).toHaveBeenCalledWith("background-size", "cover");
    fireEvent.change(screen.getByLabelText("Position"), { target: { value: "right bottom" } });
    expect(onChange).toHaveBeenCalledWith("background-position", "right bottom");
  });
});

describe("BackgroundSection — a gradient of more than two stops is kept (247:23966)", () => {
  const THREE = "linear-gradient(120deg, #1946E5 0%, #7058F5 45%, #EDB7D1 100%)";

  it("shows it as saved, says so, and offers no two-stop controls that would rewrite it", () => {
    renderBg({ styles: { background: THREE } });
    expect(kind()).toHaveValue("custom");
    expect(screen.getByTestId("inspector-fill-saved-gradient").textContent).toContain(THREE);
    expect(screen.getByText("Three stops retained. Two-stop controls cannot losslessly edit this value.")).toBeInTheDocument();
    expect(screen.queryByText("Color 1")).toBeNull();
  });

  it("Replace with two-stop gradient keeps the first and last stops and the angle", () => {
    const { onChange } = renderBg({ styles: { background: THREE } });
    fireEvent.click(screen.getByRole("button", { name: "Replace with two-stop gradient" }));
    expect(onChange).toHaveBeenCalledWith("background", expect.stringMatching(/^linear-gradient\(120deg, #1946e5, #edb7d1\)$/i));
  });

  it("Edit custom gradient writes the edited text on blur, and nothing for text that is not a gradient", () => {
    const { onChange } = renderBg({ styles: { background: THREE } });
    fireEvent.click(screen.getByRole("button", { name: "Edit custom gradient" }));
    const box = screen.getByRole("textbox", { name: "Saved gradient" });
    fireEvent.change(box, { target: { value: "not a gradient" } });
    fireEvent.blur(box);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Edit custom gradient" }));
    const next = "linear-gradient(90deg, #000000 0%, #888888 50%, #ffffff 100%)";
    fireEvent.change(screen.getByRole("textbox", { name: "Saved gradient" }), { target: { value: next } });
    fireEvent.blur(screen.getByRole("textbox", { name: "Saved gradient" }));
    expect(onChange).toHaveBeenCalledWith("background", next);
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
    choose("color");
    expect(onBatchChange).toHaveBeenCalledWith({ background: "" });
    expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue("#00FF00");
  });

  it("Image → Color clears the image", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { "background-image": "url('https://a/b.png')" }, onBatchChange });
    choose("color");
    expect(onBatchChange).toHaveBeenCalledWith({ "background-image": "" });
  });

  it("Image → Gradient replaces the image with a gradient in one write", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { "background-image": "url('https://a/b.png')" }, onBatchChange });
    choose("gradient");
    expect(onBatchChange).toHaveBeenCalledWith({
      "background-image": "",
      background: "linear-gradient(90deg, #1A56DB, #22c55e)",
    });
  });

  it("Gradient → Image keeps the gradient until an image is chosen, then replaces it", () => {
    const onBatchChange = vi.fn();
    const { onChange } = renderBg({ styles: { background: GRADIENT }, onBatchChange });
    choose("image");
    expect(onBatchChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://c/d.png" } });
    expect(onBatchChange).toHaveBeenCalledWith({ background: "", "background-image": "url('https://c/d.png')" });
    expect(onChange).not.toHaveBeenCalledWith("background-image", expect.anything());
  });

  it("Fill reads a `background:` shorthand colour", () => {
    renderBg({ styles: { background: "#ff0000" } });
    expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue("#FF0000");
  });

  it("writing Fill over a `background:` shorthand clears the shorthand in the same write", () => {
    const onBatchChange = vi.fn();
    renderBg({ styles: { background: "#ff0000" }, onBatchChange });
    fireEvent.change(screen.getByRole("textbox", { name: "Color value" }), { target: { value: "00ff00" } });
    expect(onBatchChange).toHaveBeenCalledWith({ background: "", "background-color": "#00ff00" });
  });
});

describe("Fill — v4 labels (boards 1, 21, 27)", () => {
  it("titles the section Background and names the colour row Color (2L9 161:8940, S06)", () => {
    renderBg();
    expect(screen.getByRole("button", { name: "Background section, expanded" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Color value" })).toBeInTheDocument();
  });

  it("on the Page panel the row reads Color too", () => {
    renderBg({ variant: "page" });
    expect(screen.getByRole("textbox", { name: "Color value" })).toBeInTheDocument();
  });


  it("has no header add-image action (the frame's + adds)", () => {
    renderBg({ onOpenMediaLibrary: vi.fn() });
    expect(screen.queryByRole("button", { name: "Add background image" })).not.toBeInTheDocument();
  });
});
