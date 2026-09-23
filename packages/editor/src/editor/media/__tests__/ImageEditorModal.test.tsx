/**
 * ImageEditorModal — Clone 3397:39917 "S3.6 · media · image-editor" (960 ×
 * 740) and its states in section 4184:26629: the four tabs (3695:43236 crop ·
 * 3695:43319 adjust · 3695:43403 resize · 3695:43480 optimise), the crop
 * chips and transforms (3707:20431 16:9 · 3707:20501 rotate 90° · 3695:43705
 * flipped · 3707:20536 zoom 150%), the resize lock (3695:43547) and its
 * INVALID state (3695:43624), the Saved state (3681:20026), discard
 * (3695:45549) and failure (3695:45542).
 *
 * react-easy-crop is stubbed: it measures the DOM and decodes the image,
 * neither of which jsdom does. The stub reports a 1600 × 1200 crop of the
 * 2400 × 1600 source (the board's own numbers) and exposes the media style
 * so filter / transform assertions still bite.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";

vi.mock("react-easy-crop", () => ({
  __esModule: true,
  default: (props: {
    onCropComplete?: (a: unknown, b: unknown) => void;
    style?: { mediaStyle?: React.CSSProperties };
    rotation?: number;
    zoom?: number;
    aspect?: number;
  }) => {
    React.useEffect(() => {
      props.onCropComplete?.(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 400, y: 200, width: 1600, height: 1200 },
      );
    }, []);
    return (
      <div
        data-testid="cropper"
        data-rotation={props.rotation}
        data-zoom={props.zoom}
        data-aspect={props.aspect ?? "free"}
        style={props.style?.mediaStyle}
      />
    );
  },
}));

import { ImageEditorModal, type EditsSnapshot } from "../ImageEditorModal";
import { EDITOR_TABS } from "../image-editor/imageEdits";

const SRC = "data:image/png;base64,iVBORw0KGgo="; // 9 bytes
const EDITED = "data:image/webp;base64,ZWRpdGVk"; // 6 bytes
const CAP_LINE = "Maximum is 8192 × 8192 px. Enter a smaller size to continue.";

beforeEach(() => {
  vi.restoreAllMocks();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    filter: "",
    fillStyle: "",
    fillRect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  })) as unknown as HTMLCanvasElement["getContext"];
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => EDITED);
  // jsdom never fires load for Image: the encoder's loadImage and the head's
  // intrinsic-size probe would hang. Resolve on the next tick, 2400 × 1600.
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = "";
    width = 2400;
    height = 1600;
    naturalWidth = 2400;
    naturalHeight = 1600;
    set src(_v: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", FakeImage);
});

function mount(over: Partial<React.ComponentProps<typeof ImageEditorModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    imageSrc: SRC,
    fileName: "hero-dark.jpg",
    onSave: vi.fn(async () => {}),
    onDone: vi.fn(),
    ...over,
  };
  const utils = render(<ImageEditorModal {...props} />);
  return { ...utils, props };
}

const tab = (id: string) =>
  within(screen.getByTestId("image-editor-tabs")).getByRole("tab", { name: EDITOR_TABS.find((t) => t.id === id)!.label });
const slider = (row: string) => within(screen.getByTestId(row)).getByRole("slider");
const status = () => screen.getByTestId("image-editor-status");

describe("Clone 3397:39917 · Edit image — head, tabs, preview, foot", () => {
  it("renders nothing while closed", () => {
    mount({ isOpen: false });
    expect(screen.queryByTestId("image-editor-card")).toBeNull();
  });

  it("titles 'Edit image' with the file's library name and intrinsic size under it", async () => {
    mount();
    expect(screen.getByTestId("image-editor-title")).toHaveTextContent("Edit image");
    await waitFor(() =>
      expect(screen.getByTestId("image-editor-subtitle")).toHaveTextContent("hero-dark.jpg · 2400 × 1600"),
    );
  });

  it("offers Crop · Adjust · Resize · Optimise as tab chips, Crop selected first", () => {
    mount();
    const tabs = within(screen.getByTestId("image-editor-tabs")).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Crop", "Adjust", "Resize", "Optimise"]);
    expect(tab("crop")).toHaveAttribute("aria-selected", "true");
    expect(tab("optimise")).toHaveAttribute("aria-selected", "false");
    fireEvent.click(tab("optimise"));
    expect(tab("optimise")).toHaveAttribute("aria-selected", "true");
    expect(tab("crop")).toHaveAttribute("aria-selected", "false");
  });

  it("opens on the tab the host asks for (the library's Optimize door), with the focus ring on THAT tab", () => {
    mount({ initialTab: "optimise" });
    expect(tab("optimise")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("image-editor-format-webp")).toBeInTheDocument();
    /* Walked live 2026-09-14: the trap focused the first button — Crop —
       while Optimise was selected. Roving tabindex + the trap skipping -1. */
    expect(tab("optimise")).toHaveFocus();
    expect(tab("crop")).toHaveAttribute("tabindex", "-1");
  });

  it("the preview's mono status is `<out W × H> · <crop preset> · <format>` with Reset all beside it", () => {
    mount();
    expect(status()).toHaveTextContent("1600 × 1200 · Free · WebP");
    expect(screen.getByTestId("image-editor-reset")).toHaveTextContent("Reset all");
  });

  it("the foot carries the draft note, Cancel and Save version", () => {
    mount();
    expect(screen.getByTestId("image-editor-foot-note")).toHaveTextContent(
      "Your draft stays with you across tabs. Save creates a version; site placements stay unchanged.",
    );
    expect(screen.getByTestId("image-editor-cancel")).toHaveTextContent("Cancel");
    expect(screen.getByTestId("image-editor-save")).toHaveTextContent("Save version");
    expect(screen.getByTestId("image-editor-save")).toBeEnabled();
  });

  it("the draft survives a tab switch", () => {
    mount();
    fireEvent.click(screen.getByTestId("image-editor-aspect-16-9"));
    fireEvent.click(tab("adjust"));
    fireEvent.click(screen.getByTestId("image-editor-preset-bw"));
    fireEvent.click(tab("crop"));
    expect(screen.getByTestId("image-editor-aspect-16-9")).toHaveAttribute("aria-pressed", "true");
    expect(status()).toHaveTextContent("1600 × 1200 · 16:9 · WebP");
    expect(screen.getByTestId("cropper").style.filter).toContain("grayscale(1)");
  });

  it("Reset all returns every tab to the original", () => {
    mount();
    fireEvent.click(screen.getByTestId("image-editor-aspect-1-1"));
    fireEvent.click(screen.getByTestId("image-editor-flip-h"));
    fireEvent.click(tab("adjust"));
    fireEvent.click(screen.getByTestId("image-editor-preset-vibrant"));
    fireEvent.click(tab("optimise"));
    fireEvent.click(screen.getByTestId("image-editor-format-png"));
    expect(status()).toHaveTextContent("1600 × 1200 · 1:1 · PNG");
    fireEvent.click(screen.getByTestId("image-editor-reset"));
    expect(status()).toHaveTextContent("1600 × 1200 · Free · WebP");
    expect(screen.getByTestId("cropper").style.filter).toBe("none");
    expect(screen.getByTestId("image-editor-format-webp")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Clone 3695:43236 · Crop", () => {
  it("aspect chips Free · 1:1 · 4:3 · 3:2 · 16:9; choosing one drives the cropper and the status (3707:20431)", () => {
    mount();
    const chips = ["free", "1-1", "4-3", "3-2", "16-9"].map((id) => screen.getByTestId(`image-editor-aspect-${id}`));
    expect(chips.map((c) => c.textContent)).toEqual(["Free", "1:1", "4:3", "3:2", "16:9"]);
    expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chips[4]);
    expect(chips[4]).toHaveAttribute("aria-pressed", "true");
    expect(chips[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-aspect", String(16 / 9));
    expect(status()).toHaveTextContent("· 16:9 ·");
  });

  it("Rotation reads 0°, ↻ 90° and ↺ 90° step it, the slider reaches any angle (3707:20501)", () => {
    mount();
    expect(screen.getByTestId("image-editor-rotate-value")).toHaveTextContent("0°");
    fireEvent.click(screen.getByTestId("image-editor-rotate-cw"));
    expect(screen.getByTestId("image-editor-rotate-value")).toHaveTextContent("90°");
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-rotation", "90");
    fireEvent.click(screen.getByTestId("image-editor-rotate-ccw"));
    fireEvent.click(screen.getByTestId("image-editor-rotate-ccw"));
    expect(screen.getByTestId("image-editor-rotate-value")).toHaveTextContent("-90°");
    fireEvent.change(slider("image-editor-rotate"), { target: { value: "45" } });
    expect(screen.getByTestId("image-editor-rotate-value")).toHaveTextContent("45°");
  });

  /* Walked live 2026-09-14: a 1800 × 1200 file opened on Free read
     `1600 × 1200` — react-easy-crop takes an undefined aspect as 4/3. */
  it("Free is the file's own frame, turned with the rotation — not the cropper's 4/3 default", async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId("image-editor-subtitle")).toHaveTextContent("2400 × 1600"));
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-aspect", String(2400 / 1600));
    fireEvent.click(screen.getByTestId("image-editor-rotate-cw"));
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-aspect", String(1600 / 2400));
    fireEvent.click(screen.getByTestId("image-editor-aspect-16-9"));
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-aspect", String(16 / 9));
  });

  it("Flip Horizontal / Vertical are pressed toggles that mirror the media (3695:43705)", () => {
    mount();
    const h = screen.getByTestId("image-editor-flip-h");
    const v = screen.getByTestId("image-editor-flip-v");
    expect(h).toHaveTextContent("Horizontal");
    expect(v).toHaveTextContent("Vertical");
    expect(h).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(h);
    expect(h).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("cropper").style.transform).toContain("scaleX(-1)");
    fireEvent.click(v);
    expect(screen.getByTestId("cropper").style.transform).toContain("scaleY(-1)");
    fireEvent.click(h);
    expect(h).toHaveAttribute("aria-pressed", "false");
  });

  it("Zoom reads 100% with the reposition hint; 150% is on the slider (3707:20536)", () => {
    mount();
    expect(screen.getByTestId("image-editor-zoom-value")).toHaveTextContent("100%");
    expect(screen.getByTestId("image-editor-zoom-hint")).toHaveTextContent(
      "Drag the image in the preview to reposition.",
    );
    fireEvent.change(slider("image-editor-zoom"), { target: { value: "1.5" } });
    expect(screen.getByTestId("image-editor-zoom-value")).toHaveTextContent("150%");
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-zoom", "1.5");
  });
});

describe("Clone 3695:43319 · Adjust", () => {
  it("Brightness / Contrast / Saturation read 0, Blur 0px; the representative values are reachable (3724:43505, 3724:43550)", () => {
    mount();
    fireEvent.click(tab("adjust"));
    for (const k of ["brightness", "contrast", "saturation"]) {
      expect(screen.getByTestId(`image-editor-${k}-value`)).toHaveTextContent(/^0$/);
    }
    expect(screen.getByTestId("image-editor-blur-value")).toHaveTextContent("0px");
    fireEvent.change(slider("image-editor-brightness"), { target: { value: "-10" } });
    expect(screen.getByTestId("image-editor-brightness-value")).toHaveTextContent("-10");
    expect(screen.getByTestId("cropper").style.filter).toContain("brightness(0.9)");
    fireEvent.change(slider("image-editor-contrast"), { target: { value: "10" } });
    expect(screen.getByTestId("image-editor-contrast-value")).toHaveTextContent("10");
    fireEvent.change(slider("image-editor-blur"), { target: { value: "8" } });
    expect(screen.getByTestId("image-editor-blur-value")).toHaveTextContent("8px");
    expect(screen.getByTestId("cropper").style.filter).toContain("blur(8px)");
  });

  it("Preset chips None · B&W · Sepia · Cool · Warm · Vibrant, one pressed, layered on the sliders", () => {
    mount();
    fireEvent.click(tab("adjust"));
    const ids = ["none", "bw", "sepia", "cool", "warm", "vibrant"];
    const chips = ids.map((id) => screen.getByTestId(`image-editor-preset-${id}`));
    expect(chips.map((c) => c.textContent)).toEqual(["None", "B&W", "Sepia", "Cool", "Warm", "Vibrant"]);
    expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chips[1]);
    expect(chips[1]).toHaveAttribute("aria-pressed", "true");
    expect(chips[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("cropper").style.filter).toContain("grayscale(1)");
  });
});

describe("Clone 3695:43403 · Resize", () => {
  it("Width / Height start at the crop's output size and Aspect ratio locked keeps the ratio", () => {
    mount();
    fireEvent.click(tab("resize"));
    const w = screen.getByTestId("image-editor-width") as HTMLInputElement;
    const h = screen.getByTestId("image-editor-height") as HTMLInputElement;
    expect(w.value).toBe("1600");
    expect(h.value).toBe("1200");
    expect(screen.getByTestId("image-editor-aspect-lock")).toHaveTextContent("Aspect ratio locked");
    expect(screen.getByTestId("image-editor-aspect-lock")).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(w, { target: { value: "800" } });
    expect(h.value).toBe("600");
    expect(status()).toHaveTextContent("800 × 600 · Free · WebP");
    fireEvent.change(h, { target: { value: "300" } });
    expect(w.value).toBe("400");
  });

  it("Aspect ratio unlocked lets the two fields move apart (3695:43547)", () => {
    mount();
    fireEvent.click(tab("resize"));
    fireEvent.click(screen.getByTestId("image-editor-aspect-lock"));
    expect(screen.getByTestId("image-editor-aspect-lock")).toHaveTextContent("Aspect ratio unlocked");
    expect(screen.getByTestId("image-editor-aspect-lock")).toHaveAttribute("aria-pressed", "false");
    fireEvent.change(screen.getByTestId("image-editor-width"), { target: { value: "800" } });
    expect((screen.getByTestId("image-editor-height") as HTMLInputElement).value).toBe("1200");
    expect(status()).toHaveTextContent("800 × 1200");
  });

  it("Scale chips 25% · 50% · 75% · 100% set both fields from the crop; 100% is pressed at the crop size", () => {
    mount();
    fireEvent.click(tab("resize"));
    const chips = [25, 50, 75, 100].map((p) => screen.getByTestId(`image-editor-scale-${p}`));
    expect(chips.map((c) => c.textContent)).toEqual(["25%", "50%", "75%", "100%"]);
    expect(chips[3]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chips[1]);
    expect((screen.getByTestId("image-editor-width") as HTMLInputElement).value).toBe("800");
    expect((screen.getByTestId("image-editor-height") as HTMLInputElement).value).toBe("600");
    expect(chips[1]).toHaveAttribute("aria-pressed", "true");
    expect(chips[3]).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chips[3]);
    expect(status()).toHaveTextContent("1600 × 1200");
  });

  it("the note names the original file's size", async () => {
    mount();
    fireEvent.click(tab("resize"));
    await waitFor(() =>
      expect(screen.getByTestId("image-editor-resize-note")).toHaveTextContent(
        "The original 2400 × 1600 file is kept. Resizing only affects the new version.",
      ),
    );
  });

  it("INVALID: over the cap outlines both fields, says the maximum, disables Save; the status keeps the crop (3695:43624)", () => {
    mount();
    fireEvent.click(tab("resize"));
    fireEvent.click(screen.getByTestId("image-editor-aspect-lock"));
    fireEvent.change(screen.getByTestId("image-editor-width"), { target: { value: "12000" } });
    fireEvent.change(screen.getByTestId("image-editor-height"), { target: { value: "9000" } });
    expect(screen.getByTestId("image-editor-width")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("image-editor-height")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("image-editor-resize-error")).toHaveTextContent(CAP_LINE);
    expect(screen.getByTestId("image-editor-save")).toBeDisabled();
    expect(status()).toHaveTextContent("1600 × 1200");
    fireEvent.click(tab("crop"));
    expect(screen.getByTestId("image-editor-save")).toBeDisabled();
  });

  it("rejects zero, negative and non-numeric entries with their own lines", () => {
    mount();
    fireEvent.click(tab("resize"));
    fireEvent.click(screen.getByTestId("image-editor-aspect-lock"));
    const w = screen.getByTestId("image-editor-width");
    fireEvent.change(w, { target: { value: "0" } });
    expect(screen.getByTestId("image-editor-resize-error")).toHaveTextContent("Width and height must be at least 1 px.");
    fireEvent.change(w, { target: { value: "-20" } });
    expect(screen.getByTestId("image-editor-resize-error")).toHaveTextContent("Width and height cannot be negative.");
    fireEvent.change(w, { target: { value: "12a" } });
    expect(screen.getByTestId("image-editor-resize-error")).toHaveTextContent(
      "Enter whole pixel values for width and height.",
    );
    expect(screen.getByTestId("image-editor-save")).toBeDisabled();
    fireEvent.change(w, { target: { value: "640" } });
    expect(screen.queryByTestId("image-editor-resize-error")).toBeNull();
    expect(screen.getByTestId("image-editor-save")).toBeEnabled();
  });
});

describe("Clone 3695:43480 · Optimise", () => {
  it("Format chips WebP · JPEG · PNG feed the status and the save; Quality reads 85", () => {
    mount();
    fireEvent.click(tab("optimise"));
    const chips = ["webp", "jpeg", "png"].map((id) => screen.getByTestId(`image-editor-format-${id}`));
    expect(chips.map((c) => c.textContent)).toEqual(["WebP", "JPEG", "PNG"]);
    expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("image-editor-quality-value")).toHaveTextContent("85");
    fireEvent.click(chips[1]);
    expect(chips[1]).toHaveAttribute("aria-pressed", "true");
    expect(status()).toHaveTextContent("1600 × 1200 · Free · JPEG");
    fireEvent.change(slider("image-editor-quality"), { target: { value: "60" } });
    expect(screen.getByTestId("image-editor-quality-value")).toHaveTextContent("60");
  });

  it("the box reads Original · <size> and Estimated · <size> (<-N%>), green when smaller, with the note", async () => {
    mount();
    fireEvent.click(tab("optimise"));
    await waitFor(() => expect(screen.getByTestId("image-editor-estimate-original")).toHaveTextContent("Original · 9 Bytes"));
    await waitFor(() =>
      expect(screen.getByTestId("image-editor-estimate-result")).toHaveTextContent("Estimated · 6 Bytes (-33%)"),
    );
    expect(screen.getByTestId("image-editor-estimate-result")).toHaveAttribute("data-smaller", "true");
    expect(screen.getByTestId("image-editor-estimate-note")).toHaveTextContent(
      "File size is an estimate until the version is saved.",
    );
  });

  it("the estimate encodes at the chosen format and quality", async () => {
    mount();
    fireEvent.click(tab("optimise"));
    fireEvent.click(screen.getByTestId("image-editor-format-jpeg"));
    fireEvent.change(slider("image-editor-quality"), { target: { value: "40" } });
    await waitFor(() => {
      const calls = (HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.at(-1)).toEqual(["image/jpeg", 0.4]);
    });
  });
});

describe("Clone 3681:20026 · Saved", () => {
  it("Save version awaits onSave(dataUrl, edits) and shows Version saved with the edits summary", async () => {
    const onSave = vi.fn(async (_url: string, _edits: EditsSnapshot) => {});
    const { props } = mount({ onSave });
    fireEvent.click(tab("adjust"));
    fireEvent.click(screen.getByTestId("image-editor-preset-sepia"));
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toBe(EDITED);
    expect(onSave.mock.calls[0][1]).toEqual({
      width: 1600,
      height: 1200,
      crop: "Original",
      preset: "Sepia",
      format: "WebP",
      transform: "Original",
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
    });
    await waitFor(() => expect(screen.getByTestId("image-editor-saved-title")).toHaveTextContent("Version saved"));
    expect(screen.getByTestId("image-editor-saved-body")).toHaveTextContent(
      "Version saved. Original retained. Not yet applied to site.",
    );
    const summary = within(screen.getByTestId("image-editor-saved-summary"))
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(summary).toEqual([
      "Width: 1600",
      "Height: 1200",
      "Crop: Original",
      "Preset: Sepia",
      "Format: WebP",
      "Transform: Original",
      "Brightness: 0 · Contrast: 0 · Saturation: 0 · Blur: 0",
    ]);
    expect(screen.queryByTestId("image-editor-tabs")).toBeNull();
    expect(screen.getByTestId("image-editor-foot-note")).toHaveTextContent(
      "To update site placements, use Replace across site from asset details.",
    );
    expect(screen.getByTestId("image-editor-well").querySelector("img")).toHaveAttribute("src", EDITED);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("Done hands off to the host's onDone and closes", async () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => screen.getByTestId("image-editor-done"));
    fireEvent.click(screen.getByTestId("image-editor-done"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("‹ Back to editor returns to the tabs with the draft intact", async () => {
    mount();
    fireEvent.click(tab("adjust"));
    fireEvent.click(screen.getByTestId("image-editor-preset-cool"));
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => screen.getByTestId("image-editor-back"));
    expect(screen.getByTestId("image-editor-back")).toHaveTextContent("Back to editor");
    fireEvent.click(screen.getByTestId("image-editor-back"));
    expect(screen.getByTestId("image-editor-tabs")).toBeInTheDocument();
    expect(tab("adjust")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("image-editor-preset-cool")).toHaveAttribute("aria-pressed", "true");
  });

  it("a legacy one-argument onSave still receives the data URL", async () => {
    const onSave = vi.fn((_url: string) => {});
    mount({ onSave });
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toBe(EDITED);
  });
});

describe("Clone 3695:45549 · Discard", () => {
  it("Cancel on a clean draft closes at once", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("image-editor-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("image-editor-discard")).toBeNull();
  });

  it("Cancel on a dirty draft asks; Keep editing returns, Discard changes closes", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("image-editor-flip-v"));
    fireEvent.click(screen.getByTestId("image-editor-cancel"));
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("image-editor-discard-title")).toHaveTextContent("Discard unsaved changes?");
    fireEvent.click(screen.getByTestId("image-editor-discard-keep"));
    expect(screen.queryByTestId("image-editor-discard")).toBeNull();
    expect(screen.getByTestId("image-editor-flip-v")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("image-editor-cancel"));
    fireEvent.click(screen.getByTestId("image-editor-discard-confirm"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape is Cancel — it asks on a dirty draft", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("image-editor-flip-v"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("image-editor-discard")).toBeInTheDocument();
  });

  it("after a save the draft is clean again — Cancel closes without asking", async () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("image-editor-flip-v"));
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => screen.getByTestId("image-editor-back"));
    fireEvent.click(screen.getByTestId("image-editor-back"));
    fireEvent.click(screen.getByTestId("image-editor-cancel"));
    expect(screen.queryByTestId("image-editor-discard")).toBeNull();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Clone 3695:45542 · Failure", () => {
  it("a rejected onSave opens Version could not be saved; Continue editing keeps the draft", async () => {
    const onSave = vi.fn(async () => {
      throw new Error("upload boom");
    });
    const { props } = mount({ onSave });
    fireEvent.click(tab("adjust"));
    fireEvent.click(screen.getByTestId("image-editor-preset-warm"));
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => screen.getByTestId("image-editor-failed-title"));
    expect(screen.getByTestId("image-editor-failed-body")).toHaveTextContent(
      "Your edits are retained. Check your connection and try again.",
    );
    fireEvent.click(screen.getByTestId("image-editor-failed-continue"));
    expect(screen.queryByTestId("image-editor-failed")).toBeNull();
    expect(screen.getByTestId("image-editor-preset-warm")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("image-editor-saved-title")).toBeNull();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("Retry save re-runs the SAME save and lands on Saved when it succeeds", async () => {
    let attempts = 0;
    const onSave = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("upload boom");
    });
    mount({ onSave });
    fireEvent.click(screen.getByTestId("image-editor-rotate-cw"));
    fireEvent.click(screen.getByTestId("image-editor-save"));
    await waitFor(() => screen.getByTestId("image-editor-failed-retry"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("image-editor-failed-retry"));
    });
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]).toEqual(onSave.mock.calls[0]);
    await waitFor(() => expect(screen.getByTestId("image-editor-saved-title")).toHaveTextContent("Version saved"));
    expect(screen.queryByTestId("image-editor-failed")).toBeNull();
  });
});
