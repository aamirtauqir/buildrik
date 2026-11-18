// @vitest-environment jsdom
/**
 * BD-39 (6): a Heading inserted on a page with no H1 becomes the page's H1.
 * New inserts only — headings already on the page are never touched, and a
 * page that has an H1 gets the block's own <h2>.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockById } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const heading = () => getBlockById("heading")!;
const tagOf = (composer: ReturnType<typeof createTestComposer>, id: string | undefined) =>
  composer.elements.getElement(id!)?.getTagName().toLowerCase();

describe("insertBlock — first heading on a page without H1", () => {
  it("makes the inserted Heading an h1 when the page has none", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const id = insertBlock(composer, heading(), page.root.id);
    expect(tagOf(composer, id)).toBe("h1");
  });

  it("keeps the block's h2 once the page has an H1, and never re-levels existing headings", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const first = insertBlock(composer, heading(), page.root.id);
    const second = insertBlock(composer, heading(), page.root.id);
    expect(tagOf(composer, first)).toBe("h1");
    expect(tagOf(composer, second)).toBe("h2");
  });

  it("counts an H1 nested deeper on the page, not only the drop parent", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    insertBlock(composer, heading(), page.root.id); // h1 at root
    const section = insertBlock(composer, getBlockById("section")!, page.root.id);
    const id = insertBlock(composer, heading(), section!);
    expect(tagOf(composer, id)).toBe("h2");
  });
});
