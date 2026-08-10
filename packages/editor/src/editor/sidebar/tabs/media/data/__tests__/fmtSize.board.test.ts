/**
 * fmtSize — the boards never draw a padded decimal.
 *
 * `840 KB` (146:2), `24 MB` / `10 MB` (145:148), `842 MB of 1 GB` (145:199).
 * `toFixed(1)` alone rendered every one of those with a false ".0", which is
 * why the asset-detail drill-in read "840.0 KB" against a board that says
 * "840 KB". A genuinely fractional size still keeps its digit.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { fmtSize } from "../mediaUtils";

describe("fmtSize (boards 146:2 / 145:148 / 145:199)", () => {
  it("drops the decimal when the value is round", () => {
    expect(fmtSize(840 * 1024)).toBe("840 KB");
    expect(fmtSize(24 * 1024 * 1024)).toBe("24 MB");
    expect(fmtSize(10 * 1024 * 1024)).toBe("10 MB");
    expect(fmtSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("keeps a decimal that carries information", () => {
    expect(fmtSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(fmtSize(2.4 * 1024)).toBe("2.4 KB");
  });

  it("stays in bytes below 1 KB", () => {
    expect(fmtSize(512)).toBe("512 B");
  });
});
