/**
 * setClassStyleAt — class rule writes (CLASS-FIRST-SPEC §2.2), on a real
 * Composer.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { setClassStyleAt } from "../commandOperations";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function site() {
  const composer = createTestComposer();
  composer.importProject({
    pages: [{ id: "p", name: "P", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children: [
      { id: "a", type: "heading", tagName: "h2", classes: ["card"], children: [] },
      { id: "b", type: "heading", tagName: "h2", classes: ["card", "is-dark"], children: [] },
    ] } }],
  } as never);
  return composer;
}

describe("setClassStyleAt", () => {
  it("writes the chain's rule at breakpoint × state and leaves the elements untouched", () => {
    const composer = site();
    expect(setClassStyleAt(composer, ["card"], "desktop", "normal", "padding", "24px")).toBe(true);
    expect(setClassStyleAt(composer, ["card"], "tablet", "normal", "padding", "16px")).toBe(true);
    expect(setClassStyleAt(composer, ["card", "is-dark"], "mobile", "hover", "color", "white")).toBe(true);

    expect(composer.styles.getRule(".card")?.properties).toEqual({ padding: "24px" });
    expect(composer.styles.getRule(".card", "(max-width: 1023px)")?.properties).toEqual({ padding: "16px" });
    expect(composer.styles.getRule(".card.is-dark:hover", "(max-width: 767px)")?.properties).toEqual({ color: "white" });
    expect(composer.elements.getElement("a")!.getStyles()).toEqual({});
    expect(composer.elements.getElement("b")!.getStyles()).toEqual({});
    composer.destroy();
  });

  it("removes one property with \"\" and keeps the rest", () => {
    const composer = site();
    setClassStyleAt(composer, ["card"], "desktop", "focus", "outline", "1px solid red");
    setClassStyleAt(composer, ["card"], "desktop", "focus", "color", "blue");
    setClassStyleAt(composer, ["card"], "desktop", "focus", "outline", "");
    expect(composer.styles.getRule(".card:focus")?.properties).toEqual({ color: "blue" });
    setClassStyleAt(composer, ["card"], "desktop", "focus", "color", "");
    expect(composer.classes.list().find((c) => c.name === "card")!.rules).toBe(0);
    composer.destroy();
  });

  it("refuses a chain that is not a class selector and writes nothing", () => {
    const composer = site();
    const before = composer.styles.exportStyles().length;
    expect(setClassStyleAt(composer, ["Card"], "desktop", "normal", "color", "red")).toBe(false);
    expect(setClassStyleAt(composer, ["a", "b", "c", "d"], "desktop", "normal", "color", "red")).toBe(false);
    expect(setClassStyleAt(composer, [], "desktop", "normal", "color", "red")).toBe(false);
    expect(composer.styles.exportStyles().length).toBe(before);
    composer.destroy();
  });

  it("is one undo step inside the caller's transaction", () => {
    const composer = site();
    composer.history.flushPending?.();
    composer.beginTransaction("class-style");
    setClassStyleAt(composer, ["card"], "desktop", "normal", "padding", "24px");
    setClassStyleAt(composer, ["card"], "tablet", "normal", "padding", "16px");
    composer.endTransaction();
    expect(composer.styles.getRule(".card")).toBeDefined();
    composer.history.undo();
    expect(composer.styles.getRule(".card")).toBeUndefined();
    expect(composer.styles.getRule(".card", "(max-width: 1023px)")).toBeUndefined();
    composer.destroy();
  });
});
