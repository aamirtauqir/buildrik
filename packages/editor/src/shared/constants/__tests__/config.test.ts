/**
 * constants/config — isFeatureEnabled flag lookup.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { isFeatureEnabled } from "../config";

describe("isFeatureEnabled", () => {
  it("returns the flag value for known features", () => {
    expect(isFeatureEnabled("CODE_EXPORT")).toBe(true);
    expect(isFeatureEnabled("RESPONSIVE_PREVIEW")).toBe(true);
    expect(isFeatureEnabled("COLLABORATION")).toBe(false);
    expect(isFeatureEnabled("VERSION_HISTORY")).toBe(false);
  });
});
