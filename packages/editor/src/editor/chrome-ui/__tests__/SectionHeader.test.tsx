/**
 * SectionHeader — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, SectionHeader relocated to chrome-ui/SectionHeader.tsx). The
 * original describe block covered SectionHeader + PanelHeader together;
 * PanelHeader stays in editor/ui/ for now (later T6 batch), so its
 * assertion stayed behind in molecules.test.tsx and this file covers
 * SectionHeader alone.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../index";

describe("SectionHeader", () => {
  it("is a heading so the panel has an outline", () => {
    render(<SectionHeader count={3}>Collections</SectionHeader>);
    expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
  });

  it("renders the count", () => {
    render(<SectionHeader count={3}>Collections</SectionHeader>);
    expect(screen.getByText("3")).toBeTruthy();
  });
});
