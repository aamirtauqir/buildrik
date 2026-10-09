/**
 * L2-027 (editor audit 2026-10-08): the trigger tiles used emoji as icons
 * (👆 🖱 🎯 …) — DESIGN.md's anti-slop rules and the DS want Lucide glyphs.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { AddInteractionPanel } from "../AddInteractionPanel";

describe("AddInteractionPanel — trigger icons", () => {
  it("draws an svg glyph per trigger and no emoji", () => {
    const { container } = render(<AddInteractionPanel onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(container.querySelectorAll("button svg").length).toBeGreaterThanOrEqual(14);
    expect(container.textContent ?? "").not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
