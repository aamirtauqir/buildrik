/**
 * ImageEditorModal — crop/adjust/resize tab state, filter presets,
 * flip/rotate transforms, reset, and the async save contract.
 *
 * react-easy-crop is mocked to a lightweight stub: it measures the DOM and
 * loads the image, neither of which jsdom supports. The stub exposes the
 * mediaStyle so filter/transform assertions still work, and fires
 * onCropComplete so Save has crop pixels to work with.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("react-easy-crop", () => ({
  __esModule: true,
  default: (props: {
    onCropComplete?: (a: unknown, b: unknown) => void;
    style?: { mediaStyle?: React.CSSProperties };
    rotation?: number;
  }) => {
    // Fire crop-complete once so Save has a non-zero area.
    React.useEffect(() => {
      props.onCropComplete?.(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 0, y: 0, width: 100, height: 100 },
      );
    }, []);
    return (
      <div
        data-testid="cropper"
        data-rotation={props.rotation}
        style={props.style?.mediaStyle}
      />
    );
  },
}));

import * as React from "react";
import { ImageEditorModal } from "../ImageEditorModal";

// jsdom canvas.toDataURL exists but getContext returns a limited stub; force a
// deterministic data URL so the save path resolves.
beforeEach(() => {
  vi.restoreAllMocks();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    filter: "",
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  })) as unknown as HTMLCanvasElement["getContext"];
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/webp;base64,ZWRpdGVk");
  // jsdom never fires load/error for Image, so getCroppedImg's `await onload`
  // (and the modal's stale-URL probe) would hang. Stub a constructor that
  // resolves onload on the next tick.
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = "";
    width = 100;
    height = 100;
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
    imageSrc: "data:image/png;base64,iVBORw0KGgo=",
    onSave: vi.fn(),
    ...over,
  };
  const utils = render(<ImageEditorModal {...props} />);
  return { ...utils, props };
}

describe("ImageEditorModal — visibility", () => {
  it("renders nothing when closed", () => {
    const { container } = mount({ isOpen: false });
    expect(container.querySelector(".ie-modal")).not.toBeInTheDocument();
  });

  it("renders the modal with Crop/Adjust/Resize tabs when open", () => {
    mount();
    expect(screen.getByText(/Edit image/)).toBeInTheDocument();
    expect(screen.getByText("Crop")).toBeInTheDocument();
    expect(screen.getByText("Adjust")).toBeInTheDocument();
    expect(screen.getByText("Resize")).toBeInTheDocument();
  });
});

describe("ImageEditorModal — tab switching", () => {
  it("Crop is the default tab (aspect ratios visible)", () => {
    mount();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("1:1")).toBeInTheDocument();
    expect(screen.getByText("Rotate")).toBeInTheDocument();
  });

  it("switching to Adjust reveals brightness/contrast/saturation + filter presets", () => {
    mount();
    fireEvent.click(screen.getByText("Adjust"));
    expect(screen.getByText("Brightness")).toBeInTheDocument();
    expect(screen.getByText("Contrast")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    // 6 named presets (None/B&W/Sepia/Cool/Warm/Vibrant)
    expect(screen.getByText("B&W")).toBeInTheDocument();
    expect(screen.getByText("Vibrant")).toBeInTheDocument();
  });

  it("switching to Resize reveals the W/H output inputs", () => {
    mount();
    fireEvent.click(screen.getByText("Resize"));
    expect(screen.getByText("Output size")).toBeInTheDocument();
    expect(screen.getByText(/Leave empty to keep original crop dimensions/)).toBeInTheDocument();
  });
});

describe("ImageEditorModal — adjust state → CSS filter", () => {
  it("brightness slider feeds the cropper mediaStyle filter", () => {
    mount();
    fireEvent.click(screen.getByText("Adjust"));
    const brightness = screen.getByText("Brightness").parentElement!.querySelector(
      "input[type=range]",
    ) as HTMLInputElement;
    fireEvent.change(brightness, { target: { value: "50" } });
    const cropper = screen.getByTestId("cropper");
    expect(cropper.style.filter).toContain("brightness(1.5)");
  });

  it("selecting a filter preset appends it to the filter chain", () => {
    mount();
    fireEvent.click(screen.getByText("Adjust"));
    fireEvent.click(screen.getByText("B&W"));
    const cropper = screen.getByTestId("cropper");
    expect(cropper.style.filter).toContain("grayscale(1)");
  });
});

describe("ImageEditorModal — transforms", () => {
  it("flip horizontal toggles the scaleX transform on the media", () => {
    mount();
    const cropper = screen.getByTestId("cropper");
    expect(cropper.style.transform).toContain("scaleX(1)");
    fireEvent.click(screen.getByTitle("Flip horizontal"));
    expect(screen.getByTestId("cropper").style.transform).toContain("scaleX(-1)");
  });

  it("Reset returns adjustments to defaults (filter back to none)", () => {
    mount();
    fireEvent.click(screen.getByText("Adjust"));
    fireEvent.click(screen.getByText("Vibrant"));
    expect(screen.getByTestId("cropper").style.filter).not.toBe("none");
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByTestId("cropper").style.filter).toBe("none");
  });
});

describe("ImageEditorModal — compare hold (§17)", () => {
  it("pointer-down previews the original (no filter/transform), release restores", () => {
    mount();
    fireEvent.click(screen.getByText("Adjust"));
    fireEvent.click(screen.getByText("B&W"));
    const compare = screen.getByLabelText("Hold to compare with original");
    fireEvent.pointerDown(compare);
    expect(compare).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("cropper").style.filter).toBe("none");
    fireEvent.pointerUp(compare);
    expect(compare).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("cropper").style.filter).toContain("grayscale(1)");
  });
});

describe("ImageEditorModal — save", () => {
  it("awaits onSave with the edited data URL and closes on success", async () => {
    const onSave = vi.fn(() => Promise.resolve());
    const { props } = mount({ onSave });
    fireEvent.click(screen.getByText("Save version"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("data:image/webp;base64,ZWRpdGVk"));
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
  });

  it("keeps the modal open and routes rejection to onError", async () => {
    const onSave = vi.fn(() => Promise.reject(new Error("upload boom")));
    const onError = vi.fn();
    const { props } = mount({ onSave, onError });
    fireEvent.click(screen.getByText("Save version"));
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
