/**
 * canvas constants — ZOOM_PRESETS / ZOOM_LIMITS SSOT invariants
 *
 * Verifies that ZOOM_PRESETS stays consistent with ZOOM_LIMITS:
 *   - No preset exceeds ZOOM_LIMITS.max (SSOT violation guard)
 *   - ZOOM_LIMITS.max is reachable via a preset (usability guard)
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { ZOOM_PRESETS, ZOOM_LIMITS, stepZoom } from "../canvas";
import { THRESHOLDS } from "../config";

describe("ZOOM_PRESETS / ZOOM_LIMITS SSOT invariants", () => {
  it("no preset exceeds ZOOM_LIMITS.max", () => {
    const violations = ZOOM_PRESETS.filter((p) => p > ZOOM_LIMITS.max);
    expect(violations).toEqual([]);
  });

  it("ZOOM_LIMITS.max is reachable via a preset", () => {
    expect(ZOOM_PRESETS).toContain(ZOOM_LIMITS.max);
  });
});

describe("stepZoom — the one zoom step rule (G2-016)", () => {
  it("steps to the next / previous preset", () => {
    expect(stepZoom(100, 1)).toBe(150);
    expect(stepZoom(100, -1)).toBe(75);
    expect(stepZoom(110, 1)).toBe(150);
    expect(stepZoom(110, -1)).toBe(100);
  });

  it("stops at the ends of the range", () => {
    expect(stepZoom(400, 1)).toBe(400);
    expect(stepZoom(10, -1)).toBe(10);
  });

  it("the engine clamp and the preset range agree", () => {
    expect(THRESHOLDS.ZOOM_MAX).toBe(ZOOM_LIMITS.max);
    expect(THRESHOLDS.ZOOM_MIN).toBe(ZOOM_LIMITS.min);
  });
});
