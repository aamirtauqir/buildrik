/**
 * Button wrapper — third member of the closed wrapper set (2026-08-28).
 * Pins: variant→color mapping, passthrough of caller color, ref reaching the
 * real <button>, and the link vocabulary carrying the accent token (the
 * 6-class incantation this replaces was copy-pasted across 22 files).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Button } from "../Button";
import { BK_BUTTON_THEME } from "../buttonTheme";

describe("chrome-ui Button wrapper", () => {
  it("variant='link' renders the accent text-link recipe from the theme", () => {
    render(<Button variant="link">Clear search</Button>);
    const btn = screen.getByRole("button", { name: "Clear search" });
    expect(btn.className).toContain("tw:text-[var(--bk-accent-text)]");
    expect(btn.className).toContain("tw:enabled:hover:underline");
  });

  it("variant='ghost' is quiet ink on transparent", () => {
    render(<Button variant="ghost">More</Button>);
    expect(screen.getByRole("button", { name: "More" }).className).toContain(
      "tw:text-[var(--bk-ink-soft)]"
    );
  });

  it("caller color passes through untouched when no variant is given", () => {
    render(<Button color="light">Cancel</Button>);
    const btn = screen.getByRole("button", { name: "Cancel" });
    expect(btn.className).not.toContain("tw:text-[var(--bk-accent-text)]");
  });

  it("ref reaches the real <button>", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Go</Button>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  it("the theme defines only the two NEW keys — existing colors stay flowbite's", () => {
    expect(Object.keys(BK_BUTTON_THEME.color ?? {})).toEqual(["link", "ghost"]);
  });
});
