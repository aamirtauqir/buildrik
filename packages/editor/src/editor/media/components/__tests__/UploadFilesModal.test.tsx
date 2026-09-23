/**
 * UploadFilesModal — Clone 3724:20828 "Upload files".
 *
 * The header ↑ Upload's picker lands here instead of uploading on the spot:
 * one line per file, the code's verdict on each, and the count in the
 * primary. Sizes and limits are the code's (`MEDIA_SIZE_LIMITS`), never the
 * board's "50 MB".
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { UploadFilesModal } from "../UploadFilesModal";
import { makeFile } from "../../__tests__/libraryFixture";

const MB = 1024 * 1024;

function mount(over: Partial<React.ComponentProps<typeof UploadFilesModal>> = {}) {
  const props = {
    open: true,
    files: [makeFile("pasta-2-small.jpg", 8 * MB)],
    uploading: false,
    uploadQueue: [],
    onCancel: vi.fn(),
    onUpload: vi.fn(),
    ...over,
  };
  const utils = render(<UploadFilesModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3724:20828 · Upload files", () => {
  it("one line per file — name · EXT · size — 'Ready to upload to this site library.', Cancel · Upload file", () => {
    const { props } = mount();
    expect(screen.getByTestId("mgr-upload-files-title")).toHaveTextContent("Upload files");
    expect(screen.getByTestId("mgr-upload-files-line-0")).toHaveTextContent("pasta-2-small.jpg · JPG · 8 MB");
    expect(screen.queryByTestId("mgr-upload-files-reason-0")).toBeNull();
    expect(screen.getByTestId("mgr-upload-files-status")).toHaveTextContent("Ready to upload to this site library.");
    const buttons = within(screen.getByTestId("mgr-upload-files-foot")).getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Cancel", "Upload file"]);
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    expect(props.onUpload).toHaveBeenCalledWith(props.files);
  });

  it("counts the files in the primary when there is more than one", () => {
    mount({ files: [makeFile("a.jpg", MB), makeFile("b.png", MB, "image/png"), makeFile("c.mp4", MB, "video/mp4")] });
    expect(screen.getByTestId("mgr-upload-files-confirm")).toHaveTextContent("Upload 3 files");
    expect(screen.getByTestId("mgr-upload-files-line-2")).toHaveTextContent("c.mp4 · MP4 · 1 MB");
  });

  it("a file the code refuses reads its reason on its line and is left out of the upload", () => {
    const ok = makeFile("pasta-2-small.jpg", 8 * MB);
    const big = makeFile("pasta-2.jpg", 62 * MB);
    const { props } = mount({ files: [ok, big] });
    expect(screen.queryByTestId("mgr-upload-files-reason-0")).toBeNull();
    expect(screen.getByTestId("mgr-upload-files-line-1")).toHaveTextContent("pasta-2.jpg · JPG · 62 MB");
    // The engine's own numbers: 10 MB per image, not the board's 50.
    expect(screen.getByTestId("mgr-upload-files-reason-1")).toHaveTextContent(
      "Upload failed — file is 62 MB, the limit is 10 MB per file",
    );
    expect(screen.getByTestId("mgr-upload-files-status")).toHaveTextContent("Ready to upload to this site library.");
    expect(screen.getByTestId("mgr-upload-files-confirm")).toHaveTextContent("Upload file");
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    expect(props.onUpload).toHaveBeenCalledWith([ok]);
  });

  it("with nothing uploadable the primary is disabled and the status says so", () => {
    mount({ files: [makeFile("setup.exe", MB, "application/octet-stream")] });
    expect(screen.getByTestId("mgr-upload-files-reason-0")).toHaveTextContent(/Unsupported file type/);
    expect(screen.getByTestId("mgr-upload-files-status")).toHaveTextContent("Nothing to upload.");
    expect(screen.getByTestId("mgr-upload-files-confirm")).toBeDisabled();
  });

  it("while the upload runs each line reads the queue's progress and a failure its reason in place", () => {
    mount({
      files: [makeFile("a.jpg", MB), makeFile("b.jpg", MB)],
      uploading: true,
      uploadQueue: [
        { fileName: "a.jpg", progress: 62, status: "uploading" },
        { fileName: "b.jpg", progress: 0, status: "error", error: "Server rejected" },
      ],
    });
    expect(screen.getByTestId("mgr-upload-files-pct-0")).toHaveTextContent("62%");
    expect(screen.getByTestId("mgr-upload-files-bar-0").querySelector("[role='progressbar']")).toHaveAttribute(
      "aria-valuenow",
      "62",
    );
    expect(screen.getByTestId("mgr-upload-files-reason-1")).toHaveTextContent("Server rejected");
    expect(screen.getByTestId("mgr-upload-files-status")).toHaveTextContent("Uploading…");
    // Nothing to press until it lands: the orchestrator swaps in Upload complete.
    expect(screen.queryByTestId("mgr-upload-files-cancel")).toBeNull();
    expect(screen.getByTestId("mgr-upload-files-confirm")).toBeDisabled();
  });

  it("Cancel and Escape hand back to the library with nothing uploaded", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("mgr-upload-files-cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(props.onUpload).not.toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("mgr-upload-files")).toBeNull();
  });
});
