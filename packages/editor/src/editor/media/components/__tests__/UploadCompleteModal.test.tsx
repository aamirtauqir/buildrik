/**
 * UploadCompleteModal — Clone 3724:20832 "Upload complete".
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { UploadCompleteModal } from "../UploadCompleteModal";
import { makeAsset } from "../../__tests__/libraryFixture";

function mount(over: Partial<React.ComponentProps<typeof UploadCompleteModal>> = {}) {
  const props = {
    open: true,
    landed: [makeAsset({ id: "new-1", name: "pasta-2-small", originalName: "pasta-2-small.jpg" })],
    failed: [],
    onDone: vi.fn(),
    onViewAsset: vi.fn(),
    ...over,
  };
  const utils = render(<UploadCompleteModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3724:20832 · Upload complete", () => {
  it("names the file, says it is not used yet, and offers Done (primary) · View asset", () => {
    const { props } = mount();
    expect(screen.getByTestId("mgr-upload-complete-title")).toHaveTextContent("Upload complete");
    expect(screen.getByTestId("mgr-upload-complete-body")).toHaveTextContent("pasta-2-small.jpg is now in your library.");
    expect(screen.getByTestId("mgr-upload-complete-hint")).toHaveTextContent(
      "Not used on this site. Choose the image when you are ready to insert it.",
    );
    const buttons = within(screen.getByTestId("mgr-upload-complete-foot")).getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Done", "View asset"]);
    fireEvent.click(screen.getByTestId("mgr-upload-complete-view"));
    expect(props.onViewAsset).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("mgr-upload-complete-done"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("counts the files and drops View asset when more than one landed", () => {
    mount({
      landed: [
        makeAsset({ id: "1", originalName: "a.jpg" }),
        makeAsset({ id: "2", originalName: "b.jpg" }),
        makeAsset({ id: "3", originalName: "c.mp4", type: "video" }),
      ],
    });
    expect(screen.getByTestId("mgr-upload-complete-body")).toHaveTextContent("3 files are now in your library.");
    expect(screen.getByTestId("mgr-upload-complete-hint")).toHaveTextContent(
      "Not used on this site. Choose one when you are ready to insert it.",
    );
    expect(screen.queryByTestId("mgr-upload-complete-view")).toBeNull();
  });

  it("names the kind it landed — a video is not 'the image'", () => {
    mount({ landed: [makeAsset({ id: "v", originalName: "chef-intro.mp4", type: "video", mimeType: "video/mp4" })] });
    expect(screen.getByTestId("mgr-upload-complete-hint")).toHaveTextContent(
      "Choose the video when you are ready to insert it.",
    );
  });

  it("a file that failed in the same batch reads its reason under the result", () => {
    mount({ failed: [{ fileName: "pasta-2.jpg", reason: "Upload failed — file is 62 MB, the limit is 10 MB per file" }] });
    expect(screen.getByTestId("mgr-upload-complete-failed-0")).toHaveTextContent(
      "pasta-2.jpg — Upload failed — file is 62 MB, the limit is 10 MB per file",
    );
  });

  it("Escape is Done", () => {
    const { props } = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("mgr-upload-complete")).toBeNull();
  });
});
