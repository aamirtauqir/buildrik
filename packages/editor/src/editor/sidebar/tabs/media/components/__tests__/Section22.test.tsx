/**
 * §22 UploadZone 6 visual states — Phase 13 Task 69-70.
 *
 * Asserts idle / drag / near-limit / disabled / rejected / uploading
 * state classes plus per-item error row rendering for failed queue
 * entries.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { UploadZone } from "../UploadZone";
import type { UploadProgress } from "@shared/types/media";

function renderZone(extra: Partial<React.ComponentProps<typeof UploadZone>> = {}) {
  return render(
    <UploadZone
      storage={{ used: 0, total: 5_000_000_000 }}
      onUpload={() => {}}
      {...extra}
    />,
  );
}

describe("§22 — UploadZone visual states", () => {
  it("idle: default class only (no state modifier)", () => {
    const { container } = renderZone();
    const zone = container.querySelector(".med-upload-zone");
    expect(zone).toBeInTheDocument();
    expect(zone?.className).not.toMatch(/--/);
  });

  it("near-limit: ≥80% used", () => {
    const { container } = renderZone({
      storage: { used: 4_000_000_000, total: 5_000_000_000 },
    });
    expect(
      container.querySelector(".med-upload-zone--near-limit"),
    ).toBeInTheDocument();
  });

  it("disabled: 100% used", () => {
    const { container } = renderZone({
      storage: { used: 5_000_000_000, total: 5_000_000_000 },
    });
    expect(
      container.querySelector(".med-upload-zone--disabled"),
    ).toBeInTheDocument();
  });

  it("uploading: queue has active item", () => {
    const queue: UploadProgress[] = [
      { fileName: "a.jpg", progress: 50, status: "uploading" },
    ];
    const { container } = renderZone({ uploadQueue: queue });
    expect(
      container.querySelector(".med-upload-zone--uploading"),
    ).toBeInTheDocument();
  });

  it("uploading state takes priority over near-limit", () => {
    const queue: UploadProgress[] = [
      { fileName: "a.jpg", progress: 50, status: "uploading" },
    ];
    const { container } = renderZone({
      storage: { used: 4_000_000_000, total: 5_000_000_000 },
      uploadQueue: queue,
    });
    expect(
      container.querySelector(".med-upload-zone--uploading"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".med-upload-zone--near-limit"),
    ).not.toBeInTheDocument();
  });

  it("error row: per-failed-item rendering", () => {
    const queue: UploadProgress[] = [
      {
        fileName: "broken.jpg",
        progress: 0,
        status: "error",
        error: "Server rejected",
      },
    ];
    const { container } = renderZone({ uploadQueue: queue });
    const errorList = container.querySelector(
      "[data-testid='upload-queue-errors']",
    );
    expect(errorList).toBeInTheDocument();
    expect(
      container.querySelector(".med-upload-queue-item--error"),
    ).toBeInTheDocument();
    expect(screen.getByText(/broken\.jpg/i)).toBeInTheDocument();
    expect(screen.getByText(/Server rejected/i)).toBeInTheDocument();
  });

  it("retry button fires onRetryUpload with fileName", () => {
    const onRetryUpload = vi.fn();
    const queue: UploadProgress[] = [
      {
        fileName: "broken.jpg",
        progress: 0,
        status: "error",
        error: "fail",
      },
    ];
    renderZone({ uploadQueue: queue, onRetryUpload });
    fireEvent.click(
      screen.getByRole("button", { name: /retry broken\.jpg/i }),
    );
    expect(onRetryUpload).toHaveBeenCalledWith("broken.jpg");
  });

  it("error row hidden when onRetryUpload not provided", () => {
    const queue: UploadProgress[] = [
      {
        fileName: "broken.jpg",
        progress: 0,
        status: "error",
        error: "fail",
      },
    ];
    renderZone({ uploadQueue: queue });
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
  });
});
