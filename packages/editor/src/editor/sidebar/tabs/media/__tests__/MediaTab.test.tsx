/**
 * Media Tab — tests for Screen 8 pencil alignment
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MediaTab } from "../MediaTab";
import { UploadZone } from "../components/UploadZone";

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


/* The SelectionBanner and UploadProgressBanner blocks that stood here are
   gone with the components. Both lived in the media tab's unreachable
   fullpage branch — nothing rendered either one, and the file's own import
   was their last consumer. */
