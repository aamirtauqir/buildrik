/**
 * §18 OptimizationPanel max-dim override — Phase 9 Task 55.
 *
 * Asserts the Max dimension input is present, accepts numeric values,
 * and routes maxWidth/maxHeight into MediaOptimizer.optimize().
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";

const optimizeMock = vi.fn(async () => ({
  success: true,
  dataUrl: "data:image/webp;base64,xx",
  optimizedSize: 100,
}));

vi.mock("../../../engine/media", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: false, jpeg: true, png: true };
    }
    optimize = optimizeMock;
  },
  formatBytes: (n: number) => `${n} B`,
}));

import { OptimizationPanel } from "../OptimizationPanel";

function renderPanel() {
  return render(
    <OptimizationPanel
      imageSrc="data:image/png;base64,iVBORw0KGgo="
      onOptimized={() => {}}
      onClose={() => {}}
    />,
  );
}

beforeEach(() => {
  optimizeMock.mockClear();
});

describe("§18 — OptimizationPanel max-dim override", () => {
  it("renders Max dimension input", () => {
    renderPanel();
    expect(
      screen.getByLabelText(/max dimension in pixels/i),
    ).toBeInTheDocument();
  });

  it("default empty value omits maxWidth/maxHeight from optimize call", async () => {
    renderPanel();
    await waitFor(() => expect(optimizeMock).toHaveBeenCalled());
    const calls = optimizeMock.mock.calls as unknown as Array<[unknown, Record<string, unknown>]>;
    const opts = calls.at(-1)?.[1] ?? {};
    expect(opts).not.toHaveProperty("maxWidth");
    expect(opts).not.toHaveProperty("maxHeight");
  });

  it("numeric entry passes maxWidth + maxHeight to optimize", async () => {
    renderPanel();
    const input = screen.getByLabelText(
      /max dimension in pixels/i,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "800" } });
    await waitFor(() => {
      const calls = optimizeMock.mock.calls as unknown as Array<[unknown, Record<string, unknown>]>;
    const opts = calls.at(-1)?.[1] ?? {};
      expect(opts?.maxWidth).toBe(800);
      expect(opts?.maxHeight).toBe(800);
    });
  });

  it("zero / negative values are treated as no clamp", async () => {
    renderPanel();
    const input = screen.getByLabelText(
      /max dimension in pixels/i,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0" } });
    await waitFor(() => {
      const calls = optimizeMock.mock.calls as unknown as Array<[unknown, Record<string, unknown>]>;
    const opts = calls.at(-1)?.[1] ?? {};
      expect(opts).not.toHaveProperty("maxWidth");
    });
  });
});
