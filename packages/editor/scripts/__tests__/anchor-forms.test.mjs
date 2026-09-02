/**
 * F5 — check-anchors could only see a literal `data-testid="x"`.
 *
 * Two forms in normal use here were invisible to it, and both failed in the
 * worse direction: a real, rendering anchor read as ABSENT, which blocked three
 * per-family recipes that were waiting on exactly those anchors. A gate that
 * cannot see a construct blocks the work instead of protecting it.
 *
 * The last test is the one that matters most — widening a matcher is only safe
 * if it still says no.
 */
import { describe, it, expect } from "vitest";
import { anchorForm } from "../conformance/lib.mjs";

describe("anchorForm — the three ways an anchor reaches the DOM", () => {
  it("sees a literal attribute", () => {
    expect(anchorForm("topbar", `<div data-testid="topbar" />`)).toBe("literal");
    expect(anchorForm("topbar", `<div data-testid='topbar' />`)).toBe("literal");
    expect(anchorForm("topbar", "<div data-testid={`topbar`} />")).toBe("literal");
  });

  /* The component owns the attribute and the caller names it. The literal
     `data-testid="pages-row"` is nowhere in the source, so the old grep called
     a rendering anchor missing. */
  it("sees an id forwarded through a `testId` prop", () => {
    const src = `
      function Row({ testId }) { return <div data-testid={testId} />; }
      <Row testId="pages-row" />
    `;
    expect(anchorForm("pages-row", src)).toBe("forwarded");
  });

  /* `insert-group-${id}` renders `insert-group-layout`, which no literal
     matches. Reported as the weaker verdict it is. */
  it("sees a templated id, and says the verdict is weaker", () => {
    const src = "<div data-testid={`insert-group-${group.id}`} />";
    expect(anchorForm("insert-group-layout", src)).toBe("template:insert-group-${…}");
  });

  it("matches a template written on a forwarded prop too", () => {
    const src = "<Row testId={`notif-row-${n.id}`} />";
    expect(anchorForm("notif-row-3", src)).toBe("template:notif-row-${…}");
  });

  /* THE ONE THAT KEEPS THE GATE HONEST. Widening a matcher is only worth
     anything if it still refuses an anchor that genuinely is not there. */
  it("still returns null for an anchor nothing renders", () => {
    const src = `
      <div data-testid="topbar" />
      function Row({ testId }) { return <div data-testid={testId} />; }
      <Row testId="pages-row" />
      <div data-testid={\`insert-group-\${group.id}\`} />
    `;
    expect(anchorForm("this-anchor-was-deleted", src)).toBeNull();
  });

  it("does not let a template prefix swallow an unrelated id", () => {
    const src = "<div data-testid={`insert-group-${g}`} />";
    // shares no prefix — a bare "insert" must not ride the template's coat-tails
    expect(anchorForm("insert", src)).toBeNull();
  });

  it("returns null against an empty source rather than guessing", () => {
    expect(anchorForm("anything", "")).toBeNull();
  });
});
