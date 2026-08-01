/**
 * StatusDot — contract tests.
 *
 * Moved from `editor/ui/__tests__/atoms.test.tsx` (flowbite big-bang: T6
 * batch 1, StatusDot relocated to chrome-ui/StatusDot.tsx).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusDot } from "../index";

describe("StatusDot", () => {
  it("never leans on colour alone", () => {
    render(<StatusDot state="failed" />);
    expect(screen.getByRole("img", { name: "Failed" })).toBeTruthy();
  });

  it("accepts a caller label", () => {
    render(<StatusDot state="live" label="Published 2m ago" />);
    expect(screen.getByRole("img", { name: "Published 2m ago" })).toBeTruthy();
  });
});
