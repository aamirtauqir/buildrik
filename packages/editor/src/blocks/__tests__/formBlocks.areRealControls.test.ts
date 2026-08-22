/**
 * A form field must be a form control, not a div that looks like one.
 *
 * Twelve of the sixteen field types once rendered as `<div>`: they looked
 * right on the canvas, and the published page had nothing a browser would
 * submit, nothing a screen reader would announce as a field, and no name to
 * carry a value. The fix landed; this is what stops it coming back, because
 * "looks like a text box" is exactly the kind of regression a screenshot test
 * approves.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { blockDefinitions } from "../blockRegistry";

/** What each form block must actually emit. */
const REQUIRED: Record<string, RegExp> = {
  form: /<form[\s>]/i,
  select: /<select[\s>]/i,
  textarea: /<textarea[\s>]/i,
  button: /<button[\s>]/i,
  input: /<input[\s>]/i,
  text: /<label[\s>]|<input[\s>]/i,
};

const formBlocks = blockDefinitions.filter((b) => b.category === "Forms");

describe("form blocks emit real controls", () => {
  it("finds the form category", () => {
    expect(formBlocks.length).toBeGreaterThanOrEqual(16);
  });

  it("never ships a field whose markup is a bare div", () => {
    const fake = formBlocks
      .filter((b) => typeof b.content === "string")
      .filter((b) => {
        const want = REQUIRED[b.elementType];
        /* No rule for this elementType means the map needs updating, not that
           the block passes — say so rather than skipping it. */
        if (!want) return true;
        return !want.test(b.content as string);
      })
      .map((b) => `${b.id} (${b.elementType}): ${String(b.content).slice(0, 40)}`);
    expect(fake).toEqual([]);
  });

  it("gives every control a submittable identity or a label bound to one", () => {
    /* A control with no name and no label carries no value to the server and
       announces nothing. `<label>` wrappers count: the input inside them is the
       named thing. */
    const anonymous = formBlocks
      .filter((b) => typeof b.content === "string")
      .filter((b) => ["input", "select", "textarea"].includes(b.elementType))
      .filter((b) => {
        const c = b.content as string;
        return !/\bname=|\bplaceholder=|<label[\s>]|aria-label=/i.test(c);
      })
      .map((b) => b.id);
    expect(anonymous).toEqual([]);
  });
});
