/**
 * stylePeers — "Apply style to all {H3 headings} on this page" (DD-6b):
 * who the peers are, who is skipped, what is copied, and one Undo.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { applyStyleToPeers, findStylePeers } from "../stylePeers";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let root: string;
const add = (type: string, props: Record<string, unknown> = {}, parent = root): Element => {
  const el = c.elements.createElement(type as never, props as never);
  c.elements.addElement(el, parent);
  return c.elements.getElement(el.getId())!;
};

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
});

describe("findStylePeers", () => {
  it("same type and, for a heading, the same level — never the source", () => {
    const src = add("heading", { tagName: "h3" });
    const h3 = add("heading", { tagName: "h3" });
    add("heading", { tagName: "h2" });
    add("paragraph");
    src.setTagName("h3");
    h3.setTagName("h3");
    const { peers } = findStylePeers(c, src);
    expect(peers.map((p) => p.getId())).toEqual([h3.getId()]);
  });

  it("counts and leaves out locked peers", () => {
    const src = add("button");
    const a = add("button");
    const b = add("button");
    b.setLocked(true);
    const r = findStylePeers(c, src);
    expect(r.peers.map((p) => p.getId())).toEqual([a.getId()]);
    expect(r.skippedLocked).toBe(1);
  });

  it("only looks at the active page", () => {
    const src = add("button");
    const other = c.elements.createPage("About");
    c.elements.setActivePage?.(c.elements.getAllPages()[0].id);
    const away = c.elements.createElement("button" as never, {} as never);
    c.elements.addElement(away, other.root.id);
    expect(findStylePeers(c, src).peers).toHaveLength(0);
  });
});

describe("applyStyleToPeers", () => {
  it("merges the source's styles onto every peer in one transaction — one Undo restores all", () => {
    const src = add("button");
    const a = add("button");
    const b = add("button");
    a.setStyle("margin", "8px");
    src.setStyle("color", "rgb(255, 0, 0)");
    c.history.flushPending();
    const n = applyStyleToPeers(c, src, [a, b], { breakpoint: "desktop", pseudo: "normal" });
    expect(n).toBe(2);
    expect(c.elements.getElement(a.getId())!.getStyles()).toMatchObject({ color: "rgb(255, 0, 0)", margin: "8px" });
    expect(c.elements.getElement(b.getId())!.getStyles().color).toBe("rgb(255, 0, 0)");
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(a.getId())!.getStyles().color).toBeUndefined();
    expect(c.elements.getElement(b.getId())!.getStyles().color).toBeUndefined();
  });

  it("copies styles only — never text", () => {
    const src = add("heading", { content: "Source" });
    const peer = add("heading", { content: "Peer" });
    src.setStyle("font-size", "40px");
    applyStyleToPeers(c, src, [peer], { breakpoint: "desktop", pseudo: "normal" });
    expect(c.elements.getElement(peer.getId())!.getContent()).toBe("Peer");
  });

  it("copies the breakpoint layer on a breakpoint", () => {
    const src = add("button");
    const peer = add("button");
    c.styles.setBreakpointStyle(src.getId(), "tablet", { color: "rgb(0, 0, 255)", width: "50%" });
    applyStyleToPeers(c, src, [peer], { breakpoint: "tablet", pseudo: "normal" });
    expect(c.styles.getBreakpointStyle(peer.getId(), "tablet")).toEqual({ color: "rgb(0, 0, 255)" });
    expect(c.elements.getElement(peer.getId())!.getStyles().color).toBeUndefined();
  });

  it("copies typography, fill, border and effects only — keeps layout, size, spacing and position (board 31)", () => {
    const src = add("heading");
    const peer = add("heading");
    const copied = {
      "font-family": "Inter",
      "font-size": "24px",
      "font-weight": "600",
      "line-height": "32px",
      "letter-spacing": "1px",
      color: "rgb(1, 2, 3)",
      "text-align": "center",
      "text-transform": "uppercase",
      "background-color": "rgb(4, 5, 6)",
      "background-image": "none",
      "border-width": "1px",
      "border-style": "solid",
      "border-color": "rgb(7, 8, 9)",
      "border-radius": "4px",
      "outline-color": "rgb(7, 8, 9)",
      opacity: "0.5",
      "box-shadow": "0 1px 2px rgb(0, 0, 0)",
      filter: "blur(2px)",
      transform: "rotate(2deg)",
      transition: "all 0.2s",
      cursor: "pointer",
      "mix-blend-mode": "multiply",
      "text-shadow": "0 1px 0 rgb(0, 0, 0)",
    };
    const kept = {
      display: "flex",
      "flex-direction": "column",
      gap: "8px",
      "grid-template-columns": "1fr 1fr",
      width: "640px",
      height: "auto",
      "max-width": "100%",
      "padding-top": "12px",
      margin: "4px",
      position: "absolute",
      top: "10px",
      "z-index": "3",
      overflow: "hidden",
      "align-self": "center",
    };
    for (const [k, v] of Object.entries({ ...copied, ...kept })) src.setStyle(k, v);
    peer.setStyle("width", "100px");
    applyStyleToPeers(c, src, [peer], { breakpoint: "desktop", pseudo: "normal" });
    const got = c.elements.getElement(peer.getId())!.getStyles();
    expect(got).toMatchObject(copied);
    for (const k of Object.keys(kept)) if (k !== "width") expect(got[k], k).toBeUndefined();
    expect(got.width).toBe("100px");
  });

  it("nothing to copy when the source has only layout styles", () => {
    const src = add("button");
    const peer = add("button");
    src.setStyle("width", "50%");
    expect(applyStyleToPeers(c, src, [peer], { breakpoint: "desktop", pseudo: "normal" })).toBe(0);
  });

  it("does nothing when the source has no style here", () => {
    const src = add("button");
    const peer = add("button");
    expect(applyStyleToPeers(c, src, [peer], { breakpoint: "desktop", pseudo: "hover" })).toBe(0);
  });
});
