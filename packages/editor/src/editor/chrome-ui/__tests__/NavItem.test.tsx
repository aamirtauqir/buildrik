/**
 * NavItem — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, NavItem relocated to chrome-ui/NavItem.tsx).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavItem } from "../index";

describe("NavItem", () => {
  it("answers 'where am I' with aria-current", () => {
    render(<NavItem current>Domains</NavItem>);
    expect(screen.getByRole("button", { name: "Domains" }).getAttribute("aria-current")).toBe("page");
  });
});
