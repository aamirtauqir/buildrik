/**
 * SpotlightOverlay tests — render contract: hidden without a target,
 * positioned box-shadow cutout around a measured target (+8px pad),
 * fade-out then unmount 300ms after the target clears.
 *
 * PIN: orphan component — no live consumers as of 2026-07-16 (task audit);
 * tested for contract anyway. Only export is the onboarding index barrel
 * (src/editor/onboarding/index.ts), which itself has no external importers;
 * OnboardingMount never renders it (steps' spotlightTarget ids go unused).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { SpotlightOverlay } from "../SpotlightOverlay";

const TARGET_ID = "spotlight-test-target";
let target: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  target = document.createElement("button");
  target.id = TARGET_ID;
  document.body.appendChild(target);
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
    top: 100,
    left: 200,
    width: 50,
    height: 30,
    right: 250,
    bottom: 130,
    x: 200,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect);
});

afterEach(() => {
  target.remove();
  vi.useRealTimers();
});

describe("SpotlightOverlay", () => {
  it("renders nothing when targetId is null", () => {
    const { container } = render(<SpotlightOverlay targetId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the target element does not exist in the DOM", () => {
    const { container } = render(<SpotlightOverlay targetId="no-such-element" />);
    expect(container.firstChild).toBeNull();
  });

  it("positions the cutout over the target rect with an 8px pad, fully visible", () => {
    const { container } = render(<SpotlightOverlay targetId={TARGET_ID} />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    // Target rect (100,200,50x30) padded by 8 on every side.
    expect(overlay.style.top).toBe("92px");
    expect(overlay.style.left).toBe("192px");
    expect(overlay.style.width).toBe("66px");
    expect(overlay.style.height).toBe("46px");
    expect(overlay.style.opacity).toBe("1");
    // The dimming IS the giant box-shadow; clicks must pass through.
    expect(overlay.style.boxShadow).toContain("9999px");
    expect(overlay.style.pointerEvents).toBe("none");
  });

  it("clearing the target fades out (opacity 0) and unmounts after 300ms", () => {
    const { container, rerender } = render(<SpotlightOverlay targetId={TARGET_ID} />);
    expect((container.firstChild as HTMLElement).style.opacity).toBe("1");

    rerender(<SpotlightOverlay targetId={null} />);

    // Rect is kept for the 300ms fade-out window — still mounted, opacity 0.
    const fading = container.firstChild as HTMLElement;
    expect(fading).not.toBeNull();
    expect(fading.style.opacity).toBe("0");

    act(() => vi.advanceTimersByTime(300));
    expect(container.firstChild).toBeNull();
  });

  it("retargeting moves the cutout to the new element's rect", () => {
    const second = document.createElement("button");
    second.id = "spotlight-second-target";
    document.body.appendChild(second);
    vi.spyOn(second, "getBoundingClientRect").mockReturnValue({
      top: 10,
      left: 20,
      width: 100,
      height: 40,
      right: 120,
      bottom: 50,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    const { container, rerender } = render(<SpotlightOverlay targetId={TARGET_ID} />);
    rerender(<SpotlightOverlay targetId="spotlight-second-target" />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay.style.top).toBe("2px");
    expect(overlay.style.left).toBe("12px");
    expect(overlay.style.width).toBe("116px");
    expect(overlay.style.height).toBe("56px");

    second.remove();
  });
});
