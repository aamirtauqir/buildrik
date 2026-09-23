/**
 * ReplacementUploadModal — Clone 3585:23326 "Upload this replacement file?"
 *
 * Opened by the drawer's rejected row (`Choose a smaller file…`). The limit
 * it names is the code's for the replacement's own type, and the original's
 * size is the one the engine refused.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ReplacementUploadModal } from "../ReplacementUploadModal";
import { makeFile } from "@/editor/media/__tests__/libraryFixture";

const MB = 1024 * 1024;

function mount(over: Partial<React.ComponentProps<typeof ReplacementUploadModal>> = {}) {
  const props = {
    open: true,
    original: { fileName: "pasta-2.jpg", reason: "Upload failed — file is 62 MB, the limit is 10 MB per file", size: 62 * MB, limit: 10 * MB },
    file: makeFile("pasta-2-small.jpg", 8 * MB),
    onUpload: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  };
  const utils = render(<ReplacementUploadModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3585:23326 · Upload this replacement file?", () => {
  it("names the replacement with its size, the limit it fits, and the original it stands in for", () => {
    mount();
    expect(screen.getByTestId("media-replacement-title")).toHaveTextContent("Upload this replacement file?");
    expect(screen.getByTestId("media-replacement-file")).toHaveTextContent("pasta-2-small.jpg · 8 MB");
    expect(screen.getByTestId("media-replacement-verdict")).toHaveTextContent(
      "JPG image · Within the 10 MB limit. The original 62 MB file was not uploaded.",
    );
  });

  it("Upload file is the full-width primary, Cancel a text link under it", () => {
    const { props } = mount();
    const foot = within(screen.getByTestId("media-replacement-foot"));
    const buttons = foot.getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Upload file", "Cancel"]);
    expect(screen.getByTestId("media-replacement-confirm").className).toContain("tw:w-full");
    fireEvent.click(screen.getByTestId("media-replacement-confirm"));
    expect(props.onUpload).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("media-replacement-cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("a replacement the code refuses reads that reason instead and cannot be uploaded", () => {
    mount({ file: makeFile("pasta-2-medium.jpg", 12 * MB) });
    expect(screen.getByTestId("media-replacement-file")).toHaveTextContent("pasta-2-medium.jpg · 12 MB");
    expect(screen.getByTestId("media-replacement-verdict")).toHaveTextContent(
      "Upload failed — file is 12 MB, the limit is 10 MB per file",
    );
    expect(screen.getByTestId("media-replacement-confirm")).toBeDisabled();
  });

  it("names the kind and the limit of the replacement's own type", () => {
    mount({
      original: { fileName: "chef.mov", reason: "Upload failed — file is 140 MB, the limit is 100 MB per file", size: 140 * MB, limit: 100 * MB },
      file: makeFile("chef-720.mp4", 40 * MB, "video/mp4"),
    });
    expect(screen.getByTestId("media-replacement-verdict")).toHaveTextContent(
      "MP4 video · Within the 100 MB limit. The original 140 MB file was not uploaded.",
    );
  });

  it("Escape cancels", () => {
    const { props } = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("media-replacement-modal")).toBeNull();
  });
});
