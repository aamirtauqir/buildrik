/**
 * The hover state that made a button disappear.
 *
 * `ghost` maps to flowbite's `light`, whose hover is `hover:bg-gray-100` —
 * #F3F4F6. That is EXACTLY `--color-bg-page`, and `--color-bg-subtle` holds the
 * same value. So a white bordered button sitting on the page background changed
 * TO the page background on hover: the affordance that exists to say "this is
 * interactive" made the control vanish instead.
 *
 * Measured in a browser before the fix (rest #FFFFFF, hover #F3F4F6 on a
 * #F3F4F6 page) and after (rest #FFFFFF, hover #E5E7EB).
 *
 * jsdom cannot evaluate the Tailwind rule, so this asserts the two things it
 * CAN see: the override class is present and `tw:`-prefixed (an unprefixed one
 * would lose to flowbite's own base — see AGENTS.md), and the token it points
 * at is distinct from both surfaces in globals.css.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

const globals = readFileSync(path.resolve(__dirname, "../../../../app/globals.css"), "utf-8");
const tokenValue = (name: string) =>
  globals.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim().toLowerCase();

describe("ghost button hover", () => {
  it("overrides flowbite's hover with a tw:-prefixed class, or the override is an orphan", () => {
    render(<Button variant="ghost">Select</Button>);
    expect(screen.getByRole("button").className).toContain("tw:hover:bg-[var(--color-bg-hover)]");
  });

  it("the hover token is distinct from BOTH surfaces the button can sit on", () => {
    const hover = tokenValue("--color-bg-hover");
    expect(hover, "--color-bg-hover missing from globals.css").toBeTruthy();
    expect(hover).not.toBe(tokenValue("--color-bg-page"));
    expect(hover).not.toBe(tokenValue("--color-bg-subtle"));
    expect(hover).not.toBe(tokenValue("--color-bg-surface"));
  });

  it("primary keeps flowbite's own hover — only ghost collided", () => {
    render(<Button variant="primary">New site</Button>);
    expect(screen.getByRole("button").className).not.toContain("--color-bg-hover");
  });
});
