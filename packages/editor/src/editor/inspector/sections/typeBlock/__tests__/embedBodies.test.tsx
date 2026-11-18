// @vitest-environment jsdom
/**
 * Embed type blocks — Video embed (board 9); Map embed and Lottie by analogy.
 * @license BSD-3-Clause
 */
import { fireEvent, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { renderBlock } from "./bodyHarness";

/** The URL field commits on Enter / blur. */
const enter = (placeholder: string, value: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const embed = (attributes: Record<string, string> = {}) => ({
  id: "ve",
  type: "video-embed" as const,
  classes: ["buildrick-video-embed"],
  attributes,
});

describe("Video embed — board 9", () => {
  it("rows in board order; a pasted link says what it is and renders the frame", () => {
    const { container, el, composer } = renderBlock(embed());
    expect(screen.getByRole("button", { name: /^Video embed section/ })).toBeInTheDocument();
    const labels = Array.from(container.querySelectorAll("label")).map((l) => l.textContent?.trim());
    expect(labels).toEqual(["URL", "Ratio", "Autoplay", "Muted", "Show controls"]);
    enter("Paste a YouTube or Vimeo link", "https://youtu.be/aqz-KE-bpKQ");
    expect(el().getAttribute("data-embed-url")).toBe("https://youtu.be/aqz-KE-bpKQ");
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent("Detected: YouTube");
    expect(composer.elements.toHTML()).toContain("youtube-nocookie.com&#47;embed&#47;aqz-KE-bpKQ");
  });

  it("a link no provider takes says so and renders no frame", () => {
    const { composer } = renderBlock(embed({ "data-embed-url": "https://evil.example/watch?v=aqz-KE-bpKQ" }));
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent(/Not a link we can embed/);
    expect(composer.elements.toHTML()).not.toContain("<iframe");
  });

  it("Ratio defaults to 16:9, writes the ratio and clears the old fixed box in one Undo", () => {
    const { el, onBatchChange } = renderBlock(embed(), { styles: { "padding-bottom": "56.25%", height: "0" } });
    expect(screen.getByRole("radio", { name: "16:9" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "4:3" }));
    expect(el().getAttribute("data-embed-ratio")).toBe("4:3");
    expect(onBatchChange).toHaveBeenCalledWith({ "padding-bottom": "", height: "" });
  });

  it("the muted warning shows only for autoplay && !muted", () => {
    const { el } = renderBlock(embed({ "data-embed-url": "https://youtu.be/aqz-KE-bpKQ" }));
    expect(screen.getByRole("checkbox", { name: "Show controls" })).toBeChecked();
    expect(screen.queryByTestId("inspector-autoplay-warning")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Autoplay" }));
    expect(el().getAttribute("data-embed-autoplay")).toBe("true");
    expect(screen.getByTestId("inspector-autoplay-warning")).toHaveTextContent("Browsers block autoplay with sound. Turn on Muted.");
    fireEvent.click(screen.getByRole("checkbox", { name: "Muted" }));
    expect(screen.queryByTestId("inspector-autoplay-warning")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Show controls" }));
    expect(el().getAttribute("data-embed-controls")).toBe("false");
  });

  it("one Undo restores the URL", () => {
    const { el, undo } = renderBlock(embed());
    enter("Paste a YouTube or Vimeo link", "https://vimeo.com/76979871");
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent("Detected: Vimeo");
    undo();
    expect(el().getAttribute("data-embed-url")).toBeUndefined();
  });
});

describe("Video embed — invalid draft, committed URL kept (2L9 S33 258:38255)", () => {
  const VIMEO = "https://vimeo.com/76979871";
  it("refuses the draft, keeps the page's URL, and Restore puts it back in the field", () => {
    const { el } = renderBlock(embed({ "data-embed-url": VIMEO }));
    enter("Paste a YouTube or Vimeo link", "https://example.test/watch");
    expect(el().getAttribute("data-embed-url")).toBe(VIMEO);
    const input = screen.getByPlaceholderText("Paste a YouTube or Vimeo link");
    expect(input).toHaveValue("https://example.test/watch");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("inspector-embed-refused")).toHaveTextContent(
      "Use a supported YouTube or Vimeo link. The last valid Vimeo video remains on the page."
    );
    expect(screen.getByText(/Escape restores the URL from the start of this edit/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("inspector-embed-restore"));
    expect(screen.getByPlaceholderText("Paste a YouTube or Vimeo link")).toHaveValue(VIMEO);
    expect(screen.queryByTestId("inspector-embed-refused")).toBeNull();
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent("Detected: Vimeo");
  });

  it("Escape restores the URL from the start of the edit and drops the refusal", () => {
    renderBlock(embed({ "data-embed-url": VIMEO }));
    enter("Paste a YouTube or Vimeo link", "nope");
    const input = screen.getByPlaceholderText("Paste a YouTube or Vimeo link");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue(VIMEO);
    expect(screen.queryByTestId("inspector-embed-refused")).toBeNull();
  });

  it("with nothing valid committed there is nothing to restore", () => {
    renderBlock(embed());
    enter("Paste a YouTube or Vimeo link", "nope");
    expect(screen.getByTestId("inspector-embed-refused")).toHaveTextContent("Nothing is embedded until the link is valid.");
    expect(screen.queryByTestId("inspector-embed-restore")).toBeNull();
  });
});

describe("Map embed / Lottie (no board)", () => {
  it("a typed address is a Google Maps embed", () => {
    renderBlock({ id: "m", type: "map-embed", classes: ["buildrick-map-embed"] });
    enter("Address or Google Maps link", "Via Roma 1, Turin");
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent("Detected: Google Maps");
  });

  it("a Lottie reads and writes its data-lottie-src", () => {
    const { el } = renderBlock({ id: "l", type: "lottie", classes: ["lottie-container"], attributes: { "data-lottie-src": "" } });
    enter("lottie.host link", "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/wave.json");
    expect(el().getAttribute("data-lottie-src")).toContain("lottie.host");
    expect(screen.getByTestId("inspector-embed-detected")).toHaveTextContent("Detected: LottieFiles");
  });
});
