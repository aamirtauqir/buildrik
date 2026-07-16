/**
 * ElementPropertiesSection — per-type field rendering + write routing for the
 * types not exercised by ElementPropertiesSection.test.tsx: input, video,
 * select, columns, and icon.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ElementPropertiesSection } from "../index";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";
import type { MockElementOptions } from "@/editor/inspector/__tests__/harness";

function setup(type: string, elOpts: Partial<MockElementOptions> = {}, extraProps = {}) {
  const el = makeMockElement({ id: "e1", type, ...elOpts });
  const composer = makeMockComposer({ element: el });
  const utils = render(
    <ElementPropertiesSection
      selectedElement={{ id: "e1", type }}
      composer={composer as never}
      isOpen={true}
      {...extraProps}
    />
  );
  return { el, composer, ...utils };
}

const rowInput = (labelText: string): HTMLInputElement => {
  const row = screen.getByText(labelText).closest(".bdi-row-ctrl") as HTMLElement;
  return row.querySelector("input") as HTMLInputElement;
};

describe("ElementPropertiesSection — input element", () => {
  it("renders the Input Type select with all 16 type options", () => {
    const { container } = setup("input");
    const typeSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "datetime-local")
    ) as HTMLSelectElement;
    // 16 real options + the SelectRow placeholder ("") = 17.
    const realOptions = Array.from(typeSelect.options).filter((o) => o.value !== "");
    expect(realOptions).toHaveLength(16);
  });

  it("changing the input type writes the type attribute generically", () => {
    const { el, composer, container } = setup("input");
    const typeSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "email")
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "email" } });
    expect(el.setAttribute).toHaveBeenCalledWith("type", "email");
    expect(composer.beginTransaction).toHaveBeenCalledWith("element-prop-change");
  });

  it("renders a checkbox for the Required boolean attribute", () => {
    setup("input");
    const row = screen.getByText("Required").parentElement as HTMLElement;
    expect(within(row).getByRole("checkbox")).toBeInTheDocument();
  });
});

describe("ElementPropertiesSection — video element", () => {
  it("routes the Video URL through the video-src transaction and keeps <source> in sync", () => {
    const sourceChild = makeMockElement({ id: "src-1", tagName: "source" });
    const { el, composer } = setup("video", { children: [sourceChild] });
    fireEvent.change(rowInput("Video URL"), { target: { value: "https://v.example/clip.mp4" } });
    expect(composer.beginTransaction).toHaveBeenCalledWith("video-src-change");
    expect(el.setAttribute).toHaveBeenCalledWith("src", "https://v.example/clip.mp4");
    expect(sourceChild.setAttribute).toHaveBeenCalledWith("src", "https://v.example/clip.mp4");
  });

  it("toggling the Autoplay checkbox writes autoplay=true", () => {
    const { el } = setup("video");
    const row = screen.getByText("Autoplay").parentElement as HTMLElement;
    fireEvent.click(within(row).getByRole("checkbox"));
    expect(el.setAttribute).toHaveBeenCalledWith("autoplay", "true");
  });

  it("routes the Poster through the video-poster transaction", () => {
    const { el, composer } = setup("video");
    fireEvent.change(rowInput("Poster Image"), { target: { value: "https://p.example/p.jpg" } });
    expect(composer.beginTransaction).toHaveBeenCalledWith("video-poster-change");
    expect(el.setAttribute).toHaveBeenCalledWith("poster", "https://p.example/p.jpg");
  });
});

describe("ElementPropertiesSection — select element options", () => {
  it("rebuilds newline-separated options into <option> markup via setContent", () => {
    const { el, composer } = setup("select");
    const row = screen.getByText("Options (one per line)").closest(".bdi-row-ctrl") as HTMLElement;
    const optionsBox = row.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(optionsBox, { target: { value: "Red\nBlue" } });
    expect(composer.beginTransaction).toHaveBeenCalledWith("select-options-change");
    expect(el.setContent).toHaveBeenCalledWith("<option>Red</option><option>Blue</option>");
  });
});

describe("ElementPropertiesSection — columns element", () => {
  it("increasing the column count creates + appends the missing columns", () => {
    const { el, composer, container } = setup("columns");
    const countSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "3")
    ) as HTMLSelectElement;
    fireEvent.change(countSelect, { target: { value: "3" } });
    expect(composer.beginTransaction).toHaveBeenCalledWith("columns-count-change");
    expect(composer.elements.createElement).toHaveBeenCalledTimes(3);
    expect(el.addChild).toHaveBeenCalledTimes(3);
  });

  it("changing the gap writes a gap style inside the gap transaction", () => {
    const { el, composer, container } = setup("columns");
    const gapSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "16px")
    ) as HTMLSelectElement;
    fireEvent.change(gapSelect, { target: { value: "16px" } });
    expect(composer.beginTransaction).toHaveBeenCalledWith("columns-gap-change");
    expect(el.setStyle).toHaveBeenCalledWith("gap", "16px");
  });
});

describe("ElementPropertiesSection — icon element", () => {
  it("shows the icon picker button and passes the current config on open", () => {
    const onOpenIconPicker = vi.fn();
    setup("icon", { attrs: { "data-icon-name": "heart" } }, { onOpenIconPicker });
    const button = screen.getByRole("button", { name: /Change Icon/ });
    fireEvent.click(button);
    expect(onOpenIconPicker).toHaveBeenCalledTimes(1);
    const [currentIcon] = onOpenIconPicker.mock.calls[0];
    expect(currentIcon).toMatchObject({ name: "heart", library: "lucide" });
  });

  it("selecting an icon writes the data-icon-* attributes + size styles", () => {
    const onOpenIconPicker = vi.fn();
    const { el } = setup("icon", {}, { onOpenIconPicker });
    fireEvent.click(screen.getByRole("button", { name: /Change Icon/ }));
    const [, onSelect] = onOpenIconPicker.mock.calls[0];
    onSelect({ library: "lucide", name: "star", size: 48, color: "#ff0000", strokeWidth: 2 });
    expect(el.setAttribute).toHaveBeenCalledWith("data-icon-name", "star");
    expect(el.setAttribute).toHaveBeenCalledWith("data-icon-size", "48");
    expect(el.setStyle).toHaveBeenCalledWith("width", "48px");
  });
});
