/**
 * OptimizationPanel — format picker, quality slider, savings stat, and the
 * Apply contract. Complements Section18_max_dim.test.tsx (max-dim clamp).
 *
 * MediaOptimizer is mocked at the engine boundary. AVIF is reported
 * unsupported so the disabled-format branch is exercised.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const optimizeMock = vi.fn(async () => ({
  success: true,
  dataUrl: "data:image/webp;base64,b3B0",
  optimizedSize: 400,
}));

vi.mock("../../../engine/media", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: false, jpeg: true, png: true };
    }
    optimize = optimizeMock;
  },
}));

import { OptimizationPanel } from "../OptimizationPanel";

// 800-char base64 → deterministic non-zero original size for the savings calc.
const IMG = `data:image/png;base64,${"A".repeat(800)}`;

function mount(over: Partial<React.ComponentProps<typeof OptimizationPanel>> = {}) {
  const props = {
    imageSrc: IMG,
    onOptimized: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
  const utils = render(<OptimizationPanel {...props} />);
  return { ...utils, props };
}

beforeEach(() => {
  optimizeMock.mockClear();
});

describe("OptimizationPanel — format picker", () => {
  it("renders WebP/AVIF/JPEG/PNG with WebP recommended and defaults to webp", async () => {
    mount();
    expect(screen.getByText(/WebP/)).toBeInTheDocument();
    expect(screen.getByText("AVIF")).toBeInTheDocument();
    expect(screen.getByText("JPEG")).toBeInTheDocument();
    expect(screen.getByText("PNG")).toBeInTheDocument();
    await waitFor(() => expect(optimizeMock).toHaveBeenCalled());
    const opts = (optimizeMock.mock.calls.at(-1)! as unknown[])[1] as Record<string, unknown>;
    expect(opts.format).toBe("webp");
  });

  it("AVIF is disabled when the browser reports no support", async () => {
    mount();
    const avif = screen.getByText("AVIF").closest("button") as HTMLButtonElement;
    await waitFor(() => expect(avif).toBeDisabled());
  });

  it("selecting JPEG re-optimizes with format=jpeg and drops transparency", async () => {
    mount();
    fireEvent.click(screen.getByText("JPEG"));
    await waitFor(() => {
      const opts = (optimizeMock.mock.calls.at(-1)! as unknown[])[1] as Record<string, unknown>;
      expect(opts.format).toBe("jpeg");
      expect(opts.preserveTransparency).toBe(false);
    });
  });
});

describe("OptimizationPanel — quality slider", () => {
  it("defaults quality to 85% and feeds quality/100 into optimize", async () => {
    mount();
    expect(screen.getByText("85%")).toBeInTheDocument();
    await waitFor(() => {
      const opts = (optimizeMock.mock.calls.at(-1)! as unknown[])[1] as Record<string, unknown>;
      expect(opts.quality).toBeCloseTo(0.85, 5);
    });
  });

  it("moving the slider updates the readout and re-optimizes at the new quality", async () => {
    const { container } = mount();
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "40" } });
    expect(screen.getByText("40%")).toBeInTheDocument();
    await waitFor(() => {
      const opts = (optimizeMock.mock.calls.at(-1)! as unknown[])[1] as Record<string, unknown>;
      expect(opts.quality).toBeCloseTo(0.4, 5);
    });
  });
});

describe("OptimizationPanel — savings + apply", () => {
  // Board 1124:4562 puts the saving ON the optimised number ("312 KB · −63%"),
  // not in a third stat column.
  it("the optimised row carries the size and the saving", async () => {
    mount();
    // original = round(800 * 3 / 4) = 600B, optimized 400B → 33% savings.
    await waitFor(() =>
      expect(screen.getByTestId("opt-result")).toHaveTextContent(/−33%/),
    );
  });

  it("Apply forwards the optimized data URL to onOptimized", async () => {
    const { props } = mount();
    await waitFor(() => expect(optimizeMock).toHaveBeenCalled());
    const applyBtn = await waitFor(() => {
      const btn = screen.getByText("Optimise").closest("button") as HTMLButtonElement;
      expect(btn).not.toBeDisabled();
      return btn;
    });
    fireEvent.click(applyBtn);
    expect(props.onOptimized).toHaveBeenCalledWith("data:image/webp;base64,b3B0");
  });

  it("Cancel calls onClose", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });
});
