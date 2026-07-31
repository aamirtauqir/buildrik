/**
 * MediaCard / SiteCard — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, MediaCard + SiteCard relocated together to chrome-ui/ — same
 * pairing the original describe block already used).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaCard, SiteCard } from "../index";

describe("MediaCard / SiteCard", () => {
  it("decorative images get an empty alt so they are skipped, not read out", () => {
    const { container } = render(<MediaCard name="hero.jpg" src="/hero.jpg" badge="NEW" />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(screen.getByText("NEW")).toBeTruthy();
  });

  it("SiteCard states are labelled in text", () => {
    render(<SiteCard name="Bella Cucina" state="live" stateLabel="Live" meta="2h ago" />);
    expect(screen.getByRole("img", { name: "Live" })).toBeTruthy();
    expect(screen.getByText("Bella Cucina")).toBeTruthy();
  });
});
