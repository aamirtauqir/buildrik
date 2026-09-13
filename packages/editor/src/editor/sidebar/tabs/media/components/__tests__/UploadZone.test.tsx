import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UploadZone } from "../UploadZone";
import { makeFile } from "@/editor/media/__tests__/libraryFixture";

const MB = 1024 * 1024;

describe("UploadZone — consumes StorageQuotaBar", () => {
  it("renders StorageQuotaBar with current quota", () => {
    const onUpload = vi.fn();
    const { container } = render(
      <UploadZone storage={{ used: 1024 ** 3, total: 5 * 1024 ** 3 }} onUpload={onUpload} uploadQueue={[]} />
    );
    expect(container.querySelector(".med-quota-bar")).toBeInTheDocument();
    expect(container.querySelector(".med-quota-text")?.textContent).toMatch(/1 GB of 5 GB used/);
  });
});

/* Clone 3584:45522 (drawer · Upload rejected) re-draws V1 145:148. The
   rejected row is the engine's verdict — real size, real limit — and its
   door is a replacement picker, not Retry. */
describe("Clone 3584:45522 · drawer · Upload rejected", () => {
  const rejected = {
    fileName: "pasta-2.jpg",
    reason: "Upload failed — file is 62 MB, the limit is 10 MB per file",
    size: 62 * MB,
    limit: 10 * MB,
  };
  const queueRow = { fileName: "pasta-2.jpg", progress: 0, status: "error" as const, error: rejected.reason };

  it("every picked file reaches the engine — the zone no longer pre-refuses on its own 50 MB", () => {
    /* The zone used to flash `"x" exceeds 50MB limit` for four seconds and
       drop the whole batch. 50 was a number the engine never had (10 MB per
       image, 100 per video), and the flash was gone before anyone could act
       on it. The engine's refusal is a persistent row with the real numbers. */
    const onUpload = vi.fn();
    render(<UploadZone compact storage={{ used: 0, total: 5 * 1024 ** 3 }} onUpload={onUpload} uploadQueue={[]} />);
    const big = makeFile("pasta-2.jpg", 62 * MB);
    const input = screen.getByTestId("media-upload-input") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [big] } });
    expect(onUpload).toHaveBeenCalledWith([big]);
  });

  it("the rejected row reads the engine's reason and offers 'Choose a smaller file…'", () => {
    const onReplacementPicked = vi.fn();
    render(
      <UploadZone
        compact
        storage={{ used: 0, total: 5 * 1024 ** 3 }}
        onUpload={vi.fn()}
        uploadQueue={[queueRow]}
        failedUploads={[rejected]}
        onRetryUpload={vi.fn()}
        onReplacementPicked={onReplacementPicked}
      />,
    );
    expect(screen.getByTestId("media-upload-error-name")).toHaveTextContent("pasta-2.jpg");
    expect(screen.getByTestId("media-upload-error-reason")).toHaveTextContent(
      "Upload failed — file is 62 MB, the limit is 10 MB per file",
    );
    expect(screen.getByTestId("media-upload-error-replace")).toHaveTextContent("Choose a smaller file…");
    expect(screen.queryByTestId("media-upload-error-retry")).toBeNull();
  });

  it("'Choose a smaller file…' opens a picker for ONE file and hands it over with the original", () => {
    const onReplacementPicked = vi.fn();
    render(
      <UploadZone
        compact
        storage={{ used: 0, total: 5 * 1024 ** 3 }}
        onUpload={vi.fn()}
        uploadQueue={[queueRow]}
        failedUploads={[rejected]}
        onReplacementPicked={onReplacementPicked}
      />,
    );
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByTestId("media-upload-error-replace"));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    const picker = screen.getByTestId("media-replacement-input") as HTMLInputElement;
    expect(picker.multiple).toBe(false);
    const smaller = makeFile("pasta-2-small.jpg", 8 * MB);
    fireEvent.change(picker, { target: { files: [smaller] } });
    expect(onReplacementPicked).toHaveBeenCalledWith(rejected, smaller);
  });

  it("a failure that is not the size gate keeps its own reason and Retry", () => {
    const onRetryUpload = vi.fn();
    render(
      <UploadZone
        compact
        storage={{ used: 0, total: 5 * 1024 ** 3 }}
        onUpload={vi.fn()}
        uploadQueue={[{ fileName: "broken.jpg", progress: 0, status: "error", error: "Server rejected" }]}
        failedUploads={[{ fileName: "broken.jpg", reason: "Server rejected" }]}
        onRetryUpload={onRetryUpload}
        onReplacementPicked={vi.fn()}
      />,
    );
    expect(screen.getByTestId("media-upload-error-reason")).toHaveTextContent("Server rejected");
    expect(screen.queryByTestId("media-upload-error-replace")).toBeNull();
    fireEvent.click(screen.getByTestId("media-upload-error-retry"));
    expect(onRetryUpload).toHaveBeenCalledWith("broken.jpg");
  });
});

/* Clone 3584:45876 (drawer · uploading) re-draws V1 145:96. */
describe("Clone 3584:45876 · drawer · uploading", () => {
  it("the row is the name, the mono percent and an accent bar at that width", () => {
    render(
      <UploadZone
        compact
        storage={{ used: 0, total: 5 * 1024 ** 3 }}
        onUpload={vi.fn()}
        uploadQueue={[{ fileName: "pasta-2-small.jpg", progress: 62, status: "uploading" }]}
      />,
    );
    expect(screen.getByTestId("media-upload-name-0")).toHaveTextContent("pasta-2-small.jpg");
    expect(screen.getByTestId("media-upload-pct-0")).toHaveTextContent("62%");
    const track = screen.getByTestId("media-upload-track-0");
    expect(track).toHaveAttribute("aria-valuenow", "62");
    expect(track.firstElementChild).toHaveStyle({ width: "62%" });
  });
});
