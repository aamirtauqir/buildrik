// @vitest-environment jsdom
/**
 * Media type blocks — Image (board 8), Audio (board 10), native Video (no
 * board, by analogy), on a real Composer: rows in board order, the writes,
 * and one Undo.
 * @license BSD-3-Clause
 */
import { fireEvent, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { renderBlock } from "./bodyHarness";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const rowLabels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("label, [data-testid='inspector-source-door']")).map((l) => l.textContent?.trim());

describe("Image — board 8", () => {
  const image = { id: "img", type: "image" as const, tagName: "img", attributes: { src: "https://cdn.example/pasta-closeup.jpg", alt: "" } };

  it("Image source: source card, Alt text + hint, Decorative image, then Loading / Decoding and the Style note (2L9 36:2)", () => {
    const { container } = renderBlock(image);
    expect(screen.getByRole("button", { name: /^Image source section/ })).toBeInTheDocument();
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("pasta-closeup.jpg");
    expect(rowLabels(container)).toEqual(["Alt text", "Decorative image", "Loading", "Decoding"]);
    expect(screen.getByText("Image fit and dimensions are in Style.")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-alt-hint")).toHaveTextContent("Add alt text so everyone can understand this image.");
    expect(screen.getByPlaceholderText("Describe this image")).toBeInTheDocument();
  });

  it("alt text writes the attribute, the hint goes, and one Undo restores it", () => {
    const { el, undo } = renderBlock(image);
    fireEvent.change(screen.getByPlaceholderText("Describe this image"), { target: { value: "Fresh pasta" } });
    expect(el().getAttribute("alt")).toBe("Fresh pasta");
    expect(screen.queryByTestId("inspector-alt-hint")).toBeNull();
    undo();
    expect(el().getAttribute("alt") ?? "").toBe("");
  });

  it("Replace picks an image in the drawer and writes src, through the lock gate", () => {
    const pick = vi.fn();
    const { el, composer } = renderBlock(image, { onOpenMediaLibrary: pick });
    fireEvent.click(screen.getByRole("button", { name: "Replace image" }));
    expect(pick).toHaveBeenCalledWith(["image"], expect.any(Function), "Image");
    const onSelect = pick.mock.calls[0][1] as (a: { src: string }) => void;
    onSelect({ src: "https://cdn.example/new.jpg" });
    expect(el().getAttribute("src")).toBe("https://cdn.example/new.jpg");
    el().setLocked(true);
    onSelect({ src: "https://cdn.example/other.jpg" });
    expect(composer.elements.getElement("img")!.getAttribute("src")).toBe("https://cdn.example/new.jpg");
  });
});

describe("Image — Decorative image (2L9 36:2)", () => {
  it("is an explicit choice: alt=\"\" + role=presentation, Alt text steps aside, one Undo restores", () => {
    const { el, undo } = renderBlock({ id: "img", type: "image" as const, tagName: "img", attributes: { src: "https://cdn.example/a.jpg", alt: "" } });
    expect(screen.getByRole("checkbox", { name: "Decorative image" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Decorative image" }));
    expect(el().getAttribute("role")).toBe("presentation");
    expect(el().getAttribute("alt")).toBe("");
    expect(screen.queryByPlaceholderText("Describe this image")).toBeNull();
    expect(screen.queryByTestId("inspector-alt-hint")).toBeNull();
    undo();
    expect(el().getAttribute("role")).toBeUndefined();
  });
});

describe("Audio — board 10", () => {
  it("source row with Choose audio, then Show controls / Loop / Autoplay on the <audio>", () => {
    const pick = vi.fn();
    const { el, container } = renderBlock(
      { id: "a", type: "audio", tagName: "audio", attributes: { controls: "", src: "https://cdn.example/dinner-jazz.mp3" } },
      { onOpenMediaLibrary: pick },
    );
    expect(rowLabels(container)).toEqual(["Choose audio", "Show controls", "Loop", "Autoplay"]);
    expect(screen.getByRole("checkbox", { name: "Show controls" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Loop" }));
    expect(el().getAttribute("loop")).toBe("true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Show controls" }));
    expect(el().getAttribute("controls")).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Choose audio" }));
    expect(pick).toHaveBeenCalledWith(["audio"], expect.any(Function), "Audio");
  });
});

describe("Video (native)", () => {
  it("warns only while autoplay runs with sound", () => {
    const { el } = renderBlock({ id: "v", type: "video", tagName: "video", attributes: { controls: "" } });
    expect(screen.queryByTestId("inspector-autoplay-warning")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Autoplay" }));
    expect(el().getAttribute("autoplay")).toBe("true");
    expect(screen.getByTestId("inspector-autoplay-warning")).toHaveTextContent("Browsers block autoplay with sound. Turn on Muted.");
    fireEvent.click(screen.getByRole("checkbox", { name: "Muted" }));
    expect(screen.queryByTestId("inspector-autoplay-warning")).toBeNull();
  });
});

describe("SVG — 2L9 B69/03 (249:72047)", () => {
  it("its own attributes sit with the source: ViewBox, Role, Labelled by", () => {
    const { el, container } = renderBlock({ id: "s", type: "svg", tagName: "svg", attributes: { viewBox: "0 0 24 24" } });
    expect(rowLabels(container)).toEqual(expect.arrayContaining(["ViewBox", "Role", "Labelled by"]));
    fireEvent.change(screen.getByLabelText("Labelled by"), { target: { value: "icon-title" } });
    expect(el().getAttribute("aria-labelledby")).toBe("icon-title");
    expect(screen.getByTestId("inspector-svg-representation")).toHaveTextContent("RepresentationInline SVG");
  });
});
