// @vitest-environment jsdom
/**
 * SourceRow (boards 8, 10) — thumb, file name, what the library knows of the
 * file ("2400 × 1600 · 428 KB", "3:42 · 4.8 MB"), one door into the Assets
 * drawer's pick mode. SVG too — no full-page library (was "Manage SVG").
 * @license BSD-3-Clause
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { ElementData } from "@/shared/types";
import type { MediaAsset } from "@/shared/types/media";
import { SourceRow, sourceMeta } from "../SourceRow";
import { ToastProvider } from "@/editor/chrome-ui";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup(element: ElementData, assets: Partial<MediaAsset>[] = []) {
  const composer = createTestComposer();
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children: [element] } }],
  } as never);
  vi.spyOn(composer.media, "getAssets").mockReturnValue(assets as MediaAsset[]);
  const pick = vi.fn();
  render(
    <ToastProvider>
      <SourceRow composer={composer} element={{ id: element.id, type: element.type }} targetIds={[element.id]} onOpenMediaLibrary={pick} />
    </ToastProvider>,
  );
  return { composer, pick, el: () => composer.elements.getElement(element.id)! };
}

describe("SourceRow", () => {
  it("image: library name, dimensions + size in the board's shape, Replace", () => {
    setup(
      { id: "i", type: "image", tagName: "img", attributes: { src: "https://cdn.example/p/9f2c.jpg" }, children: [] },
      [{ id: "a", name: "pasta-closeup", mimeType: "image/jpeg", src: "https://cdn.example/p/9f2c.jpg", width: 2400, height: 1600, size: 428 * 1024 }],
    );
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("pasta-closeup.jpg");
    expect(screen.getByTestId("inspector-source-meta")).toHaveTextContent("2400 × 1600 · 428 KB");
    expect(screen.getByRole("button", { name: "Replace image" })).toBeInTheDocument();
  });

  it("audio: duration + size, and Choose audio even with a file", () => {
    expect(sourceMeta({ size: 4.8 * 1024 * 1024, metadata: { duration: 222 } } as MediaAsset)).toBe("3:42 · 4.8 MB");
    setup({ id: "a", type: "audio", tagName: "audio", attributes: { src: "https://x.example/dinner-jazz.mp3" }, children: [] });
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("dinner-jazz.mp3");
    expect(screen.queryByTestId("inspector-source-meta")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose audio" })).toBeInTheDocument();
  });

  it("an element with no file offers Choose", () => {
    setup({ id: "i", type: "image", tagName: "img", children: [] });
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("No file yet");
    expect(screen.getByRole("button", { name: "Choose image" })).toBeInTheDocument();
  });

  it("video: the pick writes src and keeps the <source> child in step", () => {
    const { pick, el } = setup({
      id: "v",
      type: "video",
      tagName: "video",
      children: [{ id: "s", type: "container", tagName: "source", attributes: { src: "https://x.example/old.mp4" }, children: [] }],
    });
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("old.mp4");
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    expect(pick.mock.calls[0][0]).toEqual(["video"]);
    pick.mock.calls[0][1]({ src: "https://x.example/new.mp4" });
    expect(el().getAttribute("src")).toBe("https://x.example/new.mp4");
    expect(el().getChildren()[0].getAttribute("src")).toBe("https://x.example/new.mp4");
  });

  it("svg (S34/S35): pick mode takes images too; the pick is reviewed, then the SAME element becomes an image in one Undo", () => {
    const { pick, el, composer } = setup({
      id: "g",
      type: "svg",
      tagName: "svg",
      attributes: { viewBox: "0 0 24 24", "aria-label": "Brand mark" },
      styles: { width: "48px" },
      children: [{ id: "c", type: "container", tagName: "circle", children: [] }],
    });
    const emit = vi.spyOn(composer, "emit");
    fireEvent.click(screen.getByRole("button", { name: "Choose SVG" }));
    expect(pick.mock.calls[0][0]).toEqual(["image", "svg"]);
    expect(emit).not.toHaveBeenCalledWith("ui:switch-tab", expect.objectContaining({ fullPage: true }));
    act(() => pick.mock.calls[0][1]({ src: "https://x.example/brand-mark.png", name: "brand-mark.png", mimeType: "image/png" }));
    /* Nothing written yet: the loss is named first. */
    expect(el().getTagName()).toBe("svg");
    expect(screen.getByTestId("inspector-svg-replace")).toHaveTextContent("removes its internal SVG paths");
    composer.history.flushPending();
    const before = composer.history.getUndoCount();
    fireEvent.click(screen.getByTestId("inspector-svg-replace-confirm"));
    composer.history.flushPending();
    expect(composer.history.getUndoCount()).toBe(before + 1);
    expect([el().getType(), el().getTagName(), el().getAttribute("src"), el().getAttribute("alt"), el().getAttribute("viewBox"), el().getStyles().width]).toEqual([
      "image", "img", "https://x.example/brand-mark.png", "Brand mark", undefined, "48px",
    ]);
    expect(el().getChildren()).toHaveLength(0);
    expect(screen.getByText("SVG replaced with image.")).toBeInTheDocument();
    composer.history.undo();
    expect([el().getType(), el().getTagName(), el().getChildren().length]).toEqual(["svg", "svg", 1]);
  });
});
