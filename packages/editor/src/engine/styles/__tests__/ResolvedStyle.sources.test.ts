/**
 * resolveStyleSources — value plus origin across tag, class and local
 * sources (CLASS-FIRST-SPEC §2.2) — and proof that this pure model is what
 * the class model's emitted sheet does: for every element, breakpoint and
 * state it agrees with an exact CSS cascade over the canvas sheet.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { canvasSheet, loadStyleModelSite } from "@/engine/export/__tests__/fixtures/styleModelSite";
import { cascade, type State } from "@/engine/export/__tests__/fixtures/cssCascade";
import { styleSourcesOf, stylesAt } from "@/engine/commands/commandOperations";
import { resolveStyleSources } from "../ResolvedStyle";
import { elementSelector } from "@/shared/utils/elementSelector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function classSite() {
  const composer = createTestComposer();
  composer.styleModel = "class";
  loadStyleModelSite(composer);
  return composer;
}

describe("resolveStyleSources", () => {
  it("reports where each value comes from", () => {
    const composer = classSite();
    const hero = composer.elements.getElement("heroTitle")!;
    const sources = styleSourcesOf(composer, hero);
    expect(sources.map((s) => `${s.kind} ${s.selector}`)).toEqual(["tag h1", "class .hero-title", `local ${elementSelector("heroTitle")}`]);

    const tabletHover = resolveStyleSources(sources, "tablet", "hover");
    expect(tabletHover["font-weight"]).toEqual({ value: "600", from: { kind: "tag", selector: "h1", breakpoint: "desktop", state: "normal" } });
    expect(tabletHover["letter-spacing"]).toEqual({ value: "2px", from: { kind: "class", selector: ".hero-title", breakpoint: "tablet", state: "normal" } });
    // Local beats the class's :hover (owner Q3) — the local :hover wins here.
    expect(tabletHover.color.from).toEqual({ kind: "local", selector: elementSelector("heroTitle"), breakpoint: "desktop", state: "hover" });
    expect(tabletHover["font-size"]).toEqual({ value: "36px", from: { kind: "local", selector: elementSelector("heroTitle"), breakpoint: "tablet", state: "normal" } });
    composer.destroy();
  });

  it("orders a combo after its base", () => {
    const composer = classSite();
    const box = composer.elements.getElement("cardBox")!;
    expect(styleSourcesOf(composer, box).map((s) => s.selector)).toEqual([".card", ".card.note", elementSelector("cardBox")]);
    expect(resolveStyleSources(styleSourcesOf(composer, box), "desktop").border.from.selector).toBe(".card.note");
    composer.destroy();
  });

  it("the element model's stylesAt is unchanged (local source only)", () => {
    const composer = classSite();
    const hero = composer.elements.getElement("heroTitle")!;
    expect(stylesAt(composer, hero, "mobile", "hover")).toEqual({ color: "rgb(11, 21, 31)", "font-size": "28px" });
    composer.destroy();
  });

  it("agrees with the class model's canvas sheet for every element, breakpoint and state", () => {
    const composer = classSite();
    const states: State[] = ["normal", "hover", "focus"];
    let checked = 0;
    for (const bp of ["desktop", "tablet", "mobile"] as const) {
      const css = canvasSheet(composer, bp);
      // The canvas sheet carries the active page only.
      const root = composer.elements.getElement(composer.elements.getActivePage()!.root.id)!;
      for (const el of [root, ...root.getDescendants()]) {
        const desc = { tag: el.getTagName(), classes: el.getClasses(), id: el.getId() };
        for (const state of states) {
          const model = resolveStyleSources(styleSourcesOf(composer, el), bp, state === "normal" ? "normal" : state);
          const sheet = cascade(css, desc, 0, state);
          for (const [prop, { value }] of Object.entries(model)) {
            if (prop.startsWith("--")) continue;
            expect(sheet[prop], `${el.getId()} ${bp} ${state} ${prop}`).toBe(value);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
    composer.destroy();
  });
});
