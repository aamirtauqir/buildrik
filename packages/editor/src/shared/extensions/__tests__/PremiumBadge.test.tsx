/**
 * PremiumBadge tests — label defaults, aria-label semantics, and size
 * variants.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PremiumBadge } from "../PremiumBadge";

afterEach(cleanup);

describe("PremiumBadge", () => {
  it("defaults to the 'Pro' label with an accessible feature description", () => {
    render(<PremiumBadge />);
    const badge = screen.getByLabelText("Pro feature");
    expect(badge).toHaveTextContent("Pro");
  });

  it("supports a label override (plan name)", () => {
    render(<PremiumBadge label="Enterprise" />);
    expect(screen.getByLabelText("Enterprise feature")).toHaveTextContent("Enterprise");
  });

  it("hides the lock glyph from the accessibility tree", () => {
    const { container } = render(<PremiumBadge />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("scales the lock icon with the size variant", () => {
    const { container: sm } = render(<PremiumBadge size="sm" />);
    const { container: lg } = render(<PremiumBadge size="lg" />);
    expect(sm.querySelector("svg")).toHaveAttribute("width", "10");
    expect(lg.querySelector("svg")).toHaveAttribute("width", "18");
  });
});
