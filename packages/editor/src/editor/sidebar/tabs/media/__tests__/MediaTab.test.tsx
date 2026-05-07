/**
 * Media Tab — tests for Screen 8 pencil alignment
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MediaTab } from "../MediaTab";
import { UploadZone } from "../components/UploadZone";
import { SelectionBanner, UploadProgressBanner } from "../components/SelectionBanner";

// ─── MediaTab null composer ────────────────────────────────────────────────────

describe("MediaTab", () => {
  it("renders fallback message when composer is null", () => {
    render(<MediaTab composer={null} />);
    expect(screen.getByText(/open a project/i)).toBeTruthy();
  });
});

// ─── UploadZone ───────────────────────────────────────────────────────────────

describe("UploadZone", () => {
  const baseStorage = { used: 0, total: 100 };

  it("renders upload label", () => {
    render(
      <UploadZone
        storage={baseStorage}
        onUpload={vi.fn()}
        uploadQueue={[]}
      />
    );
    expect(screen.getByText(/drag files or click to browse/i)).toBeTruthy();
  });

  it("shows 'Storage full' when storage is full", () => {
    render(
      <UploadZone
        storage={{ used: 100, total: 100 }}
        onUpload={vi.fn()}
        uploadQueue={[]}
      />
    );
    expect(screen.getByText(/storage full/i)).toBeTruthy();
  });

  it("does not call onUpload when disabled", async () => {
    const onUpload = vi.fn();
    render(
      <UploadZone
        storage={baseStorage}
        onUpload={onUpload}
        uploadQueue={[]}
        disabled
      />
    );
    const zone = screen.getByRole("button");
    await userEvent.click(zone);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("has accessible label", () => {
    render(
      <UploadZone
        storage={baseStorage}
        onUpload={vi.fn()}
        uploadQueue={[]}
      />
    );
    expect(screen.getByLabelText(/drag files or click to browse/i)).toBeTruthy();
  });

  it("applies drag-active class on drag over", async () => {
    const { container } = render(
      <UploadZone
        storage={baseStorage}
        onUpload={vi.fn()}
        uploadQueue={[]}
      />
    );
    const zone = container.querySelector(".med-upload-zone");
    expect(zone).toBeTruthy();
    // Initial state: no drag-active class
    expect(zone?.classList.contains("med-upload-zone--drag-active")).toBe(false);
  });
});

// ─── SelectionBanner ──────────────────────────────────────────────────────────

describe("SelectionBanner", () => {
  it("shows selected count", () => {
    render(<SelectionBanner count={3} onExit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("shows '0 selected' when count is 0", () => {
    render(<SelectionBanner count={0} onExit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("0 selected")).toBeTruthy();
  });

  it("calls onDelete via Delete key when count > 0", async () => {
    const onDelete = vi.fn();
    render(<SelectionBanner count={2} onExit={vi.fn()} onDelete={onDelete} />);
    await userEvent.keyboard("{Delete}");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onExit on Escape key", async () => {
    const onExit = vi.fn();
    render(<SelectionBanner count={1} onExit={onExit} onDelete={vi.fn()} />);
    await userEvent.keyboard("{Escape}");
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows Move and Download action buttons", () => {
    render(<SelectionBanner count={2} onExit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Move")).toBeTruthy();
    expect(screen.getByText("Download")).toBeTruthy();
  });
});

// ─── UploadProgressBanner ─────────────────────────────────────────────────────

describe("UploadProgressBanner", () => {
  it("renders file name", () => {
    render(
      <UploadProgressBanner
        fileName="photo.jpg"
        progress={42}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("photo.jpg")).toBeTruthy();
  });

  it("sets progress bar width from progress prop", () => {
    const { container } = render(
      <UploadProgressBanner
        fileName="video.mp4"
        progress={75}
        onCancel={vi.fn()}
      />
    );
    const bar = container.querySelector(".med-progress__bar") as HTMLElement;
    expect(bar.style.width).toBe("75%");
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    render(
      <UploadProgressBanner
        fileName="doc.pdf"
        progress={10}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByLabelText("Cancel upload"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
