/**
 * MixedValueBadge — compact dot vs. full "Mixed" pill.
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MixedValueBadge } from "../MixedValueBadge";

describe("MixedValueBadge", () => {
  it("renders the compact dot with a Mixed value accessible name", () => {
    render(<MixedValueBadge compact />);
    const dot = screen.getByLabelText("Mixed value");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("title", expect.stringContaining("values differ"));
  });

  it("renders the full pill (with the 'Mixed' label) by default", () => {
    render(<MixedValueBadge />);
    expect(screen.getByText("Mixed")).toBeInTheDocument();
    // Full pill is not the compact dot — it has no aria-label.
    expect(screen.queryByLabelText("Mixed value")).not.toBeInTheDocument();
  });
});
