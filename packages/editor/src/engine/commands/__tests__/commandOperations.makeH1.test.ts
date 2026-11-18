// @vitest-environment jsdom
/**
 * BD-39 (6): "Make this H1" — the Issues panel's fix for a page with no H1
 * turns the page's FIRST heading into an h1, as one undo step through the
 * engine's lock gate.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { makeFirstHeadingH1 } from "../commandOperations";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function pageWithHeadings(tags: string[]) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const ids = tags.map((tag) => {
    const el = composer.elements.createElement("heading", { tagName: tag, content: tag });
    composer.elements.addElement(el, page.root.id);
    return el.getId();
  });
  composer.history.flushPending?.();
  return { composer, page, ids };
}

describe("makeFirstHeadingH1", () => {
  it("re-levels the first heading in document order, and only it", () => {
    const { composer, page, ids } = pageWithHeadings(["h3", "h2"]);
    expect(makeFirstHeadingH1(composer, page.id)).toBe(true);
    expect(composer.elements.getElement(ids[0])?.getTagName()).toBe("h1");
    expect(composer.elements.getElement(ids[1])?.getTagName()).toBe("h2");
  });

  it("is one undo step", () => {
    const { composer, page, ids } = pageWithHeadings(["h2"]);
    makeFirstHeadingH1(composer, page.id);
    composer.history.flushPending?.();
    composer.history.undo();
    expect(composer.elements.getElement(ids[0])?.getTagName()).toBe("h2");
  });

  it("refuses a locked heading and a page with no heading", () => {
    const locked = pageWithHeadings(["h2"]);
    locked.composer.elements.getElement(locked.ids[0])!.setLocked(true);
    expect(makeFirstHeadingH1(locked.composer, locked.page.id)).toBe(false);
    expect(locked.composer.elements.getElement(locked.ids[0])?.getTagName()).toBe("h2");

    const none = pageWithHeadings([]);
    expect(makeFirstHeadingH1(none.composer, none.page.id)).toBe(false);
  });
});
