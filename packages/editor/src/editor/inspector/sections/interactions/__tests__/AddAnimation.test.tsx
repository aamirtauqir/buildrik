/**
 * Owner rule — never silently remove a capability. G2-157 folded the Animation
 * section into Interactions, which left no way to CREATE a CSS animation.
 * "+ Add interaction" → "Entrance animation…" is the door back: it makes an
 * AnimationConfig, the row appears labelled by its trigger with the editor
 * open, and the export ships the keyframes the animation names.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { InteractionsSection } from "../index";
import { DEFAULT_ANIMATION } from "@/shared/types/animations";
import type { AnimationConfig } from "@/shared/types/animations";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "@/engine/export/ExportEngine";

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
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "a1", type: "paragraph" as const, tagName: "p", content: "hi", children: [] }] } }],
  } as never);
  return composer;
}

const openAdd = () => fireEvent.click(screen.getByRole("button", { name: "+ Add interaction" }));

describe("Interactions — creating a CSS animation", () => {
  it("offers 'Entrance animation…' and creates the default AnimationConfig", () => {
    const onAnimationChange = vi.fn();
    render(<InteractionsSection isOpen interactions={[]} onInteractionsChange={vi.fn()} animation={null} onAnimationChange={onAnimationChange} />);
    openAdd();
    fireEvent.click(screen.getByRole("button", { name: /Entrance animation/ }));
    expect(onAnimationChange).toHaveBeenCalledWith(DEFAULT_ANIMATION);
  });

  it("is not offered once the element already has an animation", () => {
    render(<InteractionsSection isOpen interactions={[]} onInteractionsChange={vi.fn()} animation={DEFAULT_ANIMATION} onAnimationChange={vi.fn()} />);
    openAdd();
    expect(screen.queryByRole("button", { name: /Entrance animation/ })).toBeNull();
  });

  it("add → its edit screen opens; back shows the row labelled by its trigger; export has the keyframes", async () => {
    const composer = project();
    const el = composer.elements.getElement("a1")!;
    const onAnimationChange = (a: AnimationConfig | null) => (a ? el.setAnimation(a) : el.clearAnimation());
    render(
      <InteractionsSection isOpen interactions={[]} onInteractionsChange={vi.fn()} animation={null}
        onAnimationChange={onAnimationChange} composer={composer} elementId="a1" />
    );
    openAdd();
    act(() => { fireEvent.click(screen.getByRole("button", { name: /Entrance animation/ })); });
    /* Lands on its edit screen: "‹ On page load" + the editor. */
    expect(screen.getByTestId("interactions-back")).toHaveTextContent("‹ On page load");
    expect(screen.getByRole("button", { name: "Remove animation" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("interactions-back"));
    expect(screen.getByRole("button", { name: /On page load/ })).toHaveTextContent("Fade In");

    const files = (await new ExportEngine(composer).exportAllPages({ format: "html" })).files;
    expect(files.find((f) => f.name === "styles.css")?.content).toContain("@keyframes bd-anim-fadeIn");
  });
});
