/**
 * ImportResultModal — Clone 3695:43873 "Image imported" and 3695:43876
 * "Image could not be imported": the two outcomes of one Import image from
 * URL. They replace the `<file> imported` / `Could not import from that URL`
 * toasts the library fired — a toast auto-dismisses, and the failure's next
 * step (Edit URL, with the address kept) needs a button.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ImportResultModal } from "../ImportResultModal";

const imported = { kind: "imported" as const, key: "imported", name: "hero-imported.jpg", type: "image" as const };
const failed = { kind: "failed" as const, url: "https://cdn.example.com/page.html", accepts: ["image" as const] };

function mount(result: React.ComponentProps<typeof ImportResultModal>["result"]) {
  const props = {
    result,
    onClose: vi.fn(),
    onViewAsset: vi.fn(),
    onEditUrl: vi.fn(),
  };
  const utils = render(<ImportResultModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3695:43873 · Assets · Image imported", () => {
  it("names the file and its kind, says it is in the library and unused, and offers Done (primary) · View asset", () => {
    mount(imported);
    expect(screen.getByRole("heading", { name: "Image imported" })).toBeInTheDocument();
    expect(screen.getByTestId("import-result-body")).toHaveTextContent("hero-imported.jpg · Image");
    expect(screen.getByTestId("import-result-note")).toHaveTextContent("Added to your library · Not used on this site.");
    const foot = screen.getByTestId("import-result-foot");
    const names = Array.from(foot.querySelectorAll("button")).map((b) => b.textContent?.trim());
    expect(names).toEqual(["Done", "View asset"]);
  });

  it("says the real kind — a video URL lands as `· Video`", () => {
    mount({ ...imported, name: "chef-intro.mp4", type: "video" });
    expect(screen.getByRole("heading", { name: "Image imported" })).toBeInTheDocument();
    expect(screen.getByTestId("import-result-body")).toHaveTextContent("chef-intro.mp4 · Video");
  });

  it("Done closes; View asset hands the asset up and closes", () => {
    const { props } = mount(imported);
    fireEvent.click(screen.getByTestId("import-result-done"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onViewAsset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("import-result-view"));
    expect(props.onViewAsset).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});

describe("Clone 3695:43876 · Assets · Image could not be imported", () => {
  it("names the real accepted types for the surface, and offers Cancel · Edit URL (primary)", () => {
    mount(failed);
    expect(screen.getByRole("heading", { name: "Image could not be imported" })).toBeInTheDocument();
    expect(screen.getByTestId("import-result-body")).toHaveTextContent(
      "This URL does not return a supported image. Use a direct JPG, PNG, GIF, WebP or AVIF image URL.",
    );
    const foot = screen.getByTestId("import-result-foot");
    const names = Array.from(foot.querySelectorAll("button")).map((b) => b.textContent?.trim());
    expect(names).toEqual(["Cancel", "Edit URL"]);
  });

  it("for a surface that takes every kind, says `file` and lists the whole accept set", () => {
    mount({ ...failed, accepts: ["image", "svg", "video", "audio", "font"] });
    const body = screen.getByTestId("import-result-body").textContent ?? "";
    expect(body).toMatch(/does not return a supported file/);
    for (const fmt of ["JPG", "SVG", "MP4", "MOV", "MP3", "WOFF2", "OTF"]) expect(body).toContain(fmt);
    expect(body).toMatch(/file URL\.$/);
  });

  // The upload's own refusal — a 24 MB JPG against the 10 MB limit — is not
  // a type problem, so the type sentence would be a lie. The reason the
  // engine computed is the body then.
  it("shows the upload's own reason when the file was fetched but refused", () => {
    mount({ ...failed, reason: "Upload failed — file is 24 MB, limit is 10 MB" });
    expect(screen.getByTestId("import-result-body")).toHaveTextContent("Upload failed — file is 24 MB, limit is 10 MB");
    expect(screen.queryByText(/supported image/)).toBeNull();
  });

  it("Edit URL hands the URL back and closes; Cancel just closes", () => {
    const { props } = mount(failed);
    fireEvent.click(screen.getByTestId("import-result-edit"));
    expect(props.onEditUrl).toHaveBeenCalledWith("https://cdn.example.com/page.html");
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("import-result-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onEditUrl).toHaveBeenCalledTimes(1);
  });

  it("renders nothing without a result", () => {
    const { container } = mount(null);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
