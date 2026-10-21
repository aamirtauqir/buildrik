/**
 * CLASS-FIRST-SPEC §6 P0 acceptance 4: deleting an element with a tablet
 * override removes its rule — from the StyleEngine and the saved project,
 * not only from the published CSS — and ⌘Z brings it back.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { elementSelector } from "@/shared/utils/elementSelector";

beforeAll(() => {
  installEngineBrowserStubs();
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});
afterAll(() => {
  removeEngineBrowserStubs();
  vi.unstubAllGlobals();
});

function site() {
  const composer = createTestComposer();
  composer.importProject({
    pages: [{ id: "p", name: "P", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children: [
      { id: "box", type: "container", tagName: "div", classes: ["card"], children: [
        { id: "child", type: "paragraph", tagName: "p", content: "x", children: [] },
      ] },
      { id: "keep", type: "paragraph", tagName: "p", content: "y", children: [] },
    ] } }],
  } as never);
  composer.styles.setBreakpointStyle("box", "tablet", { padding: "17px" });
  composer.styles.setRule(elementSelector("child"), { color: "rgb(1, 2, 3)" }, { pseudo: ":hover" });
  composer.styles.setBreakpointStyle("keep", "tablet", { padding: "9px" });
  composer.styles.setRule(".card", { margin: "4px" });
  composer.history.flushPending?.();
  return composer;
}

const selectorsOf = (composer: ReturnType<typeof site>) => composer.exportProject().styles.map((s) => `${s.selector}|${s.mediaQuery ?? ""}`).sort();

describe("delete prunes the element's own rules", () => {
  it("removes the deleted subtree's rules, keeps class rules and other elements' rules, and undo restores them", async () => {
    const composer = site();
    const before = selectorsOf(composer);
    composer.selection.select(composer.elements.getElement("box")!);
    composer.commands.run("delete");
    expect(composer.elements.getElement("box")).toBeUndefined();
    expect(selectorsOf(composer)).toEqual([
      `.card|`,
      `${elementSelector("keep")}|(max-width: 1023px)`,
    ]);
    const { files } = await new ExportEngine(composer).exportAllPages({ format: "html", minify: true, inlineStyles: true });
    for (const f of files) {
      expect(f.content).not.toContain('buildrick-id="box"');
      expect(f.content).not.toContain("17px");
    }

    composer.history.undo();
    expect(composer.elements.getElement("box")).toBeDefined();
    expect(selectorsOf(composer)).toEqual(before);
    composer.destroy();
  });

  it("cut keeps the rules, so cut + paste still carries the tablet value", () => {
    const composer = site();
    composer.selection.select(composer.elements.getElement("box")!);
    composer.commands.run("cut");
    expect(composer.styles.getRule(elementSelector("box"), "(max-width: 1023px)")).toBeDefined();
    composer.destroy();
  });

  it("keeps the rules of an element whose copy is on the clipboard", () => {
    const composer = site();
    composer.selection.select(composer.elements.getElement("box")!);
    composer.commands.run("copy");
    composer.commands.run("delete");
    expect(composer.styles.getRule(elementSelector("box"), "(max-width: 1023px)")).toBeDefined();
    composer.destroy();
  });
});
