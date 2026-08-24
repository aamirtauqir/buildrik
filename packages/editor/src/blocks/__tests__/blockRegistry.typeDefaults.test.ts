/**
 * A block dropped from the catalog arrives looking like its type.
 *
 * Most catalog blocks take the HTML branch of `insertOne` — the Heading block's
 * content is `<h2>Heading</h2>` — and parsed HTML carries no style attribute, so
 * the element arrived with no styles at all. The canvas rendered a dropped
 * Heading at 16px, body text with a heading's label on it, while the inspector
 * read 36: it is the one place in the repo that consults `getDefaultStyles`.
 *
 * Seeded HERE rather than in `domElementToElementData`, which parses every paste
 * and every imported site as well. Element styles render inline, so seeding
 * defaults during an import would out-specify the source's own classes and
 * forcibly restyle somebody's existing pages.
 *
 * Two properties are deliberately withheld, and two tests below hold that line —
 * see TOKEN_OWNED_PROPS in blockRegistry.ts.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { insertBlock } from "../blockRegistry";
import { getDefaultStyles } from "../../shared/constants/defaultStyles";

/* eslint-disable @typescript-eslint/no-explicit-any */
function fakeElement(type: string, tagName: string, existing: Record<string, string> = {}) {
  const styles: Record<string, string> = { ...existing };
  const kids: any[] = [];
  return {
    getId: () => `el-${type}`,
    getType: () => type,
    getData: () => ({ tagName }),
    getDescendants: () => kids,
    getStyle: (p: string) => styles[p],
    setStyle: (p: string, v: string) => { styles[p] = v; },
    __styles: styles,
    __kids: kids,
  };
}

function composerWith(created: any[]) {
  return {
    elements: {
      getElement: () => ({ getType: () => "container" }),
      insertHTMLToElement: vi.fn(() => created),
    },
    emit: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as any;
}

const headingBlock = { id: "heading", label: "Heading", elementType: "heading", content: "<h2>Heading</h2>" } as any;

/* The site paints these from its design tokens (`siteFontCSS`). An element style
   is emitted INLINE and beats that layer outright, so seeding them would strand
   every newly inserted block on the shipped defaults — changing the brand font
   or text colour would no longer reach it. */
const TOKEN_OWNED = ["font-family", "color"];

describe("a catalog block gets its type's default styles", () => {
  it("seeds a dropped heading instead of leaving it style-less", () => {
    const el = fakeElement("heading", "h2");
    insertBlock(composerWith([el]), headingBlock, "parent");
    const expected = getDefaultStyles("heading", "h2");
    const seeded = Object.entries(expected).filter(([k]) => !TOKEN_OWNED.includes(k));
    expect(seeded.length).toBeGreaterThan(0);
    for (const [k, v] of seeded) expect(el.__styles[k]).toBe(v);
  });

  /* The whole point of the carve-out: brand font and text colour keep coming
     from the site, not from a copy frozen onto the element at drop time. */
  it("leaves the token-owned properties to the site's own layer", () => {
    const el = fakeElement("heading", "h2");
    insertBlock(composerWith([el]), headingBlock, "parent");
    const expected = getDefaultStyles("heading", "h2");
    for (const prop of TOKEN_OWNED) {
      expect(expected[prop]).toBeTruthy();      // the default HAS one to withhold
      expect(el.__styles[prop]).toBeUndefined(); // and it was withheld
    }
  });

  /* Only gaps are filled. Whatever the block's own HTML set stays. */
  it("never overwrites a style the block already carried", () => {
    const el = fakeElement("heading", "h2", { "font-size": "9px" });
    insertBlock(composerWith([el]), headingBlock, "parent");
    expect(el.__styles["font-size"]).toBe("9px");
    expect(el.__styles["font-weight"]).toBe(getDefaultStyles("heading", "h2")["font-weight"]);
  });

  /* Descendants are NOT seeded. `getElementTypeFromTag` falls back to
     "container" for every tag it does not map — `li` among them — so walking a
     List block's children would stamp container defaults onto its items. */
  it("touches only the inserted root, never its children", () => {
    const root = fakeElement("list", "ul");
    const item = fakeElement("container", "li");
    root.__kids.push(item);
    insertBlock(composerWith([root]), { id: "list", label: "List", elementType: "list", content: "<ul><li>One</li></ul>" } as any, "parent");
    expect(Object.keys(item.__styles)).toEqual([]);
  });

  /* The caller wraps this in a try/catch that turns any throw into "the block
     did not insert" — a far worse failure than a missing default. */
  it("still inserts when the created element implements nothing", () => {
    const bare = { getId: () => "bare-1" } as any;
    const id = insertBlock(composerWith([bare]), headingBlock, "parent");
    expect(id).toBe("bare-1");
  });
});
