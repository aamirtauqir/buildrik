/**
 * Slider › PLAYBACK + CONTROLS (board 4428:142450) — client-only data-*
 * attributes on the slider element, read by the carousel runtime.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Composer } from "@/engine/Composer";
import { SliderPlaybackSection } from "../SliderPlaybackSection";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function project() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container", tagName: "div", children: [
        { id: "s", type: "slider", tagName: "div", classes: ["buildrick-slider"], children: [
          { id: "s1", type: "container", tagName: "div", classes: ["buildrick-slide"], children: [] },
          { id: "s2", type: "container", tagName: "div", classes: ["buildrick-slide"], children: [] },
        ] },
      ] } }],
  } as never);
  return composer;
}

describe("Slider › PLAYBACK + CONTROLS", () => {
  it("defaults: autoplay off, arrows/dots on, interval hidden", () => {
    render(<SliderPlaybackSection elementId="s" composer={project()} isOpen />);
    expect(screen.getAllByRole("switch")).toHaveLength(3); // autoplay, arrows, dots
    expect(screen.queryByLabelText("Autoplay interval, seconds")).not.toBeInTheDocument();
  });

  it("turning autoplay on writes data-autoplay and reveals the interval field", () => {
    const composer = project();
    render(<SliderPlaybackSection elementId="s" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByRole("switch")[0]);
    expect(composer.elements.getElement("s")?.getAttribute("data-autoplay")).toBe("true");
  });

  it("turning arrows/dots off writes their data attributes", () => {
    const composer = project();
    render(<SliderPlaybackSection elementId="s" composer={composer} isOpen />);
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[1]); // arrows
    fireEvent.click(switches[2]); // dots
    expect(composer.elements.getElement("s")?.getAttribute("data-arrows")).toBe("false");
    expect(composer.elements.getElement("s")?.getAttribute("data-dots")).toBe("false");
  });

  it("clamps the interval to 1-60 seconds", () => {
    const composer = project();
    composer.elements.getElement("s")?.setAttribute("data-autoplay", "true");
    render(<SliderPlaybackSection elementId="s" composer={composer} isOpen />);
    const interval = screen.getByLabelText("Autoplay interval, seconds");
    fireEvent.change(interval, { target: { value: "999" } });
    expect(composer.elements.getElement("s")?.getAttribute("data-interval")).toBe("60");
  });
});
