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
import { ZOOM_PRESETS, ZOOM_LIMITS } from "../canvas";

describe("ZOOM_PRESETS / ZOOM_LIMITS SSOT invariants", () => {
  it("no preset exceeds ZOOM_LIMITS.max", () => {
    const violations = ZOOM_PRESETS.filter((p) => p > ZOOM_LIMITS.max);
    expect(violations).toEqual([]);
  });

  it("ZOOM_LIMITS.max is reachable via a preset", () => {
    expect(ZOOM_PRESETS).toContain(ZOOM_LIMITS.max);
  });
});
