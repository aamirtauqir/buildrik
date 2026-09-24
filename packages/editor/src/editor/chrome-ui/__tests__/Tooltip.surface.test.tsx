/**
 * chrome-ui Tooltip — the ink bubble by default (owner ruling 2026-09-24,
 * board 4433:46540), still overridable per call.
 *
 * @license BSD-3-Clause
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tooltip } from "../index";

describe("Tooltip — default surface", () => {
  it("defaults to flowbite's dark bubble with the board's 12px text", () => {
    render(
      <Tooltip content="Duplicate">
        <span>trigger</span>
      </Tooltip>,
    );
    const tip = screen.getByRole("tooltip", { hidden: true });
    expect(tip.className).toContain("tw:bg-gray-900");
    expect(tip.className).toContain("tw:text-xs");
    expect(tip.className).not.toContain("tw:bg-white");
  });
});
