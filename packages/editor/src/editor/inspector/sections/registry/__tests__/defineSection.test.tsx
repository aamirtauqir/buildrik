/**
 * defineSection + pickKeys — the registry factory slices ctx.styles down to
 * the section's declared styleKeys (so an unrelated style edit doesn't force
 * a re-render), and passes the full styles when styleKeys is empty.
 *
 * @license BSD-3-Clause
 */

import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { defineSection, type SectionContext } from "../index";

function makeCtx(styles: Record<string, string>): SectionContext {
  // Only `styles` is read by the probe adapter below; the factory spreads
  // ctx, so a partial object is sufficient for this unit.
  return { styles } as unknown as SectionContext;
}

describe("defineSection — style slicing via pickKeys", () => {
  it("passes only declared styleKeys to the adapter", () => {
    const received: Array<Record<string, string>> = [];
    const Probe = (p: { styles: Record<string, string> }) => {
      received.push(p.styles);
      return null;
    };
    const entry = defineSection({
      Component: Probe,
      adaptProps: (ctx) => ({ styles: ctx.styles }),
      styleKeys: ["width", "height"],
    });

    render(<>{entry.render(makeCtx({ width: "10px", height: "20px", color: "red" }))}</>);
    expect(received[0]).toEqual({ width: "10px", height: "20px" });
    expect(received[0]).not.toHaveProperty("color");
  });

  it("omits keys absent from the incoming styles", () => {
    const received: Array<Record<string, string>> = [];
    const Probe = (p: { styles: Record<string, string> }) => {
      received.push(p.styles);
      return null;
    };
    const entry = defineSection({
      Component: Probe,
      adaptProps: (ctx) => ({ styles: ctx.styles }),
      styleKeys: ["width", "margin-top"],
    });
    render(<>{entry.render(makeCtx({ width: "5px" }))}</>);
    expect(received[0]).toEqual({ width: "5px" });
  });

  it("passes the full styles object untouched when styleKeys is empty", () => {
    const received: Array<Record<string, string>> = [];
    const Probe = (p: { styles: Record<string, string> }) => {
      received.push(p.styles);
      return null;
    };
    const full = { width: "10px", color: "red" };
    const entry = defineSection({
      Component: Probe,
      adaptProps: (ctx) => ({ styles: ctx.styles }),
      styleKeys: [],
    });
    render(<>{entry.render(makeCtx(full))}</>);
    expect(received[0]).toBe(full);
  });

  it("exposes styleKeys + shouldRender on the erased entry", () => {
    const Probe = () => null;
    const shouldRender = () => true;
    const entry = defineSection({
      Component: Probe,
      adaptProps: () => ({}),
      styleKeys: ["opacity"],
      shouldRender,
    });
    expect(entry.styleKeys).toEqual(["opacity"]);
    expect(entry.shouldRender).toBe(shouldRender);
    expect(typeof entry.render).toBe("function");
  });
});
