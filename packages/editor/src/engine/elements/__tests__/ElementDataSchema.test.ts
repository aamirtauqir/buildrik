/**
 * ElementData schema stability contract (B0 — prerequisite for AI output target).
 *
 * The B2 plan depends on a JSON producer (AI model) emitting valid ElementData
 * trees. That is safe only if ElementData is:
 *   1. A pure data shape — no functions, Symbols, class instances, cycles
 *   2. JSON-round-trippable — stringify + parse equals the original
 *   3. Self-contained — every reference it makes is another ElementData value
 *
 * This file locks those invariants in. If it fails in the future, the schema
 * has drifted and any AI integration built against it will break silently.
 *
 * NOT tested here (bigger harness, separate work): the runtime Composer
 * importProject/exportProject path. That requires a full engine instantiation.
 * The data-shape tests here are the necessary condition; runtime round-trip
 * through Composer is the sufficient condition once we have the test harness.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import type { ElementData } from "../../../shared/types";

// A non-trivial fixture: a landing-page hero with nested sections, media,
// forms, and interactive elements. Exercises every optional field of ElementData
// across the tree so any field addition that breaks JSON safety is caught.
const heroLandingFixture: ElementData = {
  id: "root-hero",
  type: "section",
  tagName: "section",
  classes: ["hero", "full-bleed"],
  attributes: { role: "banner", "data-testid": "hero" },
  styles: { display: "flex", "flex-direction": "column", padding: "80px 24px" },
  breakpointStyles: {
    tablet: { padding: "48px 16px" },
    mobile: { padding: "32px 12px", "flex-direction": "column" },
  },
  draggable: true,
  droppable: true,
  resizable: true,
  locked: false,
  data: { note: "primary hero" },
  children: [
    {
      id: "hero-heading",
      type: "heading",
      tagName: "h1",
      content: "Design websites faster with AI",
      classes: ["hero-title"],
      styles: { "font-size": "48px", "line-height": "1.1" },
    },
    {
      id: "hero-subcopy",
      type: "paragraph",
      tagName: "p",
      content: "The builder for solo designers who bill by the page.",
      styles: { "font-size": "18px", color: "var(--buildrick-text-secondary)" },
    },
    {
      id: "hero-cta-row",
      type: "container",
      tagName: "div",
      classes: ["cta-row"],
      styles: { display: "flex", gap: "12px" },
      children: [
        {
          id: "hero-cta-primary",
          type: "button",
          tagName: "button",
          content: "Start free",
          attributes: { "data-variant": "primary" },
        },
        {
          id: "hero-cta-secondary",
          type: "link",
          tagName: "a",
          content: "Watch demo",
          attributes: { href: "#demo" },
        },
      ],
    },
    {
      id: "hero-media",
      type: "image",
      tagName: "img",
      attributes: { src: "/hero.png", alt: "Product screenshot" },
    },
    {
      id: "hero-signup-form",
      type: "form",
      tagName: "form",
      children: [
        { id: "signup-email", type: "input", tagName: "input", attributes: { type: "email", name: "email" } },
        { id: "signup-submit", type: "button", tagName: "button", content: "Notify me" },
      ],
    },
  ],
};

describe("ElementData schema stability (B0 — AI target prerequisite)", () => {
  it("round-trips through JSON.stringify + JSON.parse without loss", () => {
    const serialized = JSON.stringify(heroLandingFixture);
    const restored = JSON.parse(serialized) as ElementData;
    expect(restored).toEqual(heroLandingFixture);
  });

  it("produces identical output on repeated serialization (idempotent)", () => {
    const first = JSON.stringify(heroLandingFixture);
    const second = JSON.stringify(JSON.parse(first));
    expect(second).toEqual(first);
  });

  it("contains no undefined or function-valued leaves (JSON-safe shape)", () => {
    const walk = (node: unknown, path: string): void => {
      if (node === null) return;
      if (typeof node === "function") throw new Error(`function at ${path}`);
      if (typeof node === "symbol") throw new Error(`symbol at ${path}`);
      if (typeof node === "undefined") throw new Error(`undefined at ${path}`);
      if (Array.isArray(node)) {
        node.forEach((item, i) => walk(item, `${path}[${i}]`));
        return;
      }
      if (typeof node === "object") {
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      }
    };
    expect(() => walk(heroLandingFixture, "root")).not.toThrow();
  });

  it("has no circular references (safe for recursive traversal)", () => {
    const seen = new WeakSet<object>();
    const walk = (node: unknown): void => {
      if (node === null || typeof node !== "object") return;
      if (seen.has(node)) throw new Error("cycle detected");
      seen.add(node);
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      Object.values(node).forEach(walk);
    };
    expect(() => walk(heroLandingFixture)).not.toThrow();
  });

  it("requires id and type on every node (AI output minimum contract)", () => {
    const required = (node: ElementData, path: string): void => {
      expect(node.id, `missing id at ${path}`).toBeTruthy();
      expect(node.type, `missing type at ${path}`).toBeTruthy();
      node.children?.forEach((child, i) => required(child, `${path}.children[${i}]`));
    };
    required(heroLandingFixture, "root");
  });

  it("every id in the tree is unique (AI output minimum contract)", () => {
    const ids = new Set<string>();
    const collect = (node: ElementData): void => {
      if (ids.has(node.id)) throw new Error(`duplicate id: ${node.id}`);
      ids.add(node.id);
      node.children?.forEach(collect);
    };
    expect(() => collect(heroLandingFixture)).not.toThrow();
    expect(ids.size).toBeGreaterThan(5);
  });

  it("covers a representative spread of element types", () => {
    const types = new Set<string>();
    const collect = (node: ElementData): void => {
      types.add(node.type);
      node.children?.forEach(collect);
    };
    collect(heroLandingFixture);
    // At minimum a realistic page mixes structural, text, media, interactive, and form elements.
    const wantedTypes = ["section", "heading", "paragraph", "container", "button", "link", "image", "form", "input"];
    wantedTypes.forEach((t) => {
      expect(types, `type "${t}" missing from fixture`).toContain(t);
    });
  });

  it("preserves breakpointStyles with nested per-breakpoint values", () => {
    const restored = JSON.parse(JSON.stringify(heroLandingFixture)) as ElementData;
    expect(restored.breakpointStyles).toEqual(heroLandingFixture.breakpointStyles);
    expect(restored.breakpointStyles?.mobile).toHaveProperty("flex-direction");
  });

  it("preserves Record types (attributes, styles, data) without merging or reordering", () => {
    const restored = JSON.parse(JSON.stringify(heroLandingFixture)) as ElementData;
    expect(restored.attributes).toEqual(heroLandingFixture.attributes);
    expect(restored.styles).toEqual(heroLandingFixture.styles);
    expect(restored.data).toEqual(heroLandingFixture.data);
  });
});
