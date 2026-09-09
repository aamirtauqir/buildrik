// @vitest-environment jsdom
/**
 * CMSExportResolver — what a published page keeps when bindings resolve.
 *
 * Resolution used to be opt-in (`cmsMode`), and nothing opted in: publish and
 * the ZIP export both called exportAllPages without it, so an element bound to
 * a collection shipped the placeholder text sitting in the tree while the
 * canvas beside it showed the real entry. Making "static" the default put this
 * resolver on the path of EVERY export and immediately exposed two things it
 * had never had to survive: a full HTML document, and a composer with no CMS.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CMSExportResolver } from "../CMSExportResolver";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import type { Composer } from "../../Composer";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><title>Their Title</title>
<link rel="stylesheet" href="styles.css">
<meta name="description" content="Their description."></head>
<body><h1 data-buildrick-id="h1" data-buildrick-selected="true" data-cms-bound="true">Placeholder</h1></body></html>`;

function composerWith(bindings: unknown): Composer {
  return { cms: { bindings } } as unknown as Composer;
}

const boundTo = (value: string) => ({
  getBindings: (id: string) =>
    id === "h1" ? [{ property: "content", collectionId: "c", fieldId: "title" }] : [],
  resolveBinding: vi.fn().mockResolvedValue(value),
});

describe("static resolution keeps the document it was given", () => {
  it("returns a whole page, not just its body", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("Real Title"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain("<title>Their Title</title>");
    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
    expect(html).toContain('content="Their description."');
    expect(html).toContain('lang="en"');
  });

  it("applies the bound value to the element", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("Real Title"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toContain("Real Title");
    expect(html).not.toContain("Placeholder");
  });

  it("keeps data-buildrick-id — the breakpoint CSS selects on it", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("X"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toContain('data-buildrick-id="h1"');
    // Editor-only state does go.
    expect(html).not.toContain("data-buildrick-selected");
    expect(html).not.toContain("data-cms-bound");
  });

  it("still returns a fragment when given a fragment", async () => {
    const frag = '<div data-buildrick-id="h1">Placeholder</div>';
    const html = await new CMSExportResolver(composerWith(boundTo("Real"))).resolve(frag, {
      mode: "static",
    });
    expect(html).not.toMatch(/<html/i);
    expect(html).toContain("Real");
  });
});

describe("a site with no CMS exports unchanged", () => {
  it("passes the page through when the composer has no cms manager", async () => {
    const resolver = new CMSExportResolver({} as unknown as Composer);
    expect(await resolver.resolve(PAGE, { mode: "static" })).toBe(PAGE);
  });

  it("passes the page through when there are no bindings", async () => {
    const resolver = new CMSExportResolver(composerWith(undefined));
    expect(await resolver.resolve(PAGE, { mode: "static" })).toBe(PAGE);
  });

  it("leaves mode:none alone entirely", async () => {
    const resolver = new CMSExportResolver(composerWith(boundTo("Real")));
    expect(await resolver.resolve(PAGE, { mode: "none" })).toBe(PAGE);
  });
});

/**
 * The publication switch has to govern what ships.
 *
 * `resolveBinding` queried with `filter: {}` and no status, so it resolved
 * whichever record carried the bound id — draft, published or archived alike —
 * and static resolution is the export DEFAULT. A record the author had
 * explicitly marked Draft was therefore embedded in the deployed page with no
 * warning, and the Published switch changed a field nothing downstream read.
 *
 * These run the real CollectionManager and the real CMSBindingManager through
 * the real resolver: a stub `resolveBinding` cannot show which records the
 * query lets through, which is the entire defect.
 */
describe("only published records reach the exported page", () => {
  const BOUND_PAGE = '<h1 data-buildrick-id="h1">Placeholder</h1>';
  const DRAFT_COPY = "UNFINISHED DRAFT COPY";

  type MockedStorage = typeof Storage & { __reset: () => void };

  /** A composer real enough for BaseBindingManager, carrying its own bindings. */
  async function setup() {
    const cms = new CollectionManager();
    const composer = {
      data: { on: vi.fn(), off: vi.fn() },
      markDirty: vi.fn(),
      emit: vi.fn(),
      // No live elements: applyBinding returns early and the export path is
      // the only thing resolving here.
      elements: { getElement: () => null },
    } as unknown as Composer;
    const bindings = new CMSBindingManager(composer, cms);
    (composer as unknown as { cms: unknown }).cms = { bindings };

    const collection = await cms.createCollection("Posts");
    // createContentItem defaults to status "draft".
    const record = (await cms.createContentItem(collection.id, { title: DRAFT_COPY }))!;
    bindings.bindToField("h1", collection.id, record.id, "title", "content", "Fallback copy");

    const exported = () => new CMSExportResolver(composer).resolve(BOUND_PAGE, { mode: "static" });
    return { cms, collection, record, exported };
  }

  beforeEach(() => {
    (Storage as MockedStorage).__reset();
  });

  it("does not ship a record the author left in Draft", async () => {
    const { exported } = await setup();
    expect(await exported()).not.toContain(DRAFT_COPY);
  });

  /* Draft is the fourth flavour of "this binding has no publishable value",
     alongside no itemId, unknown item and a null field — so it takes the same
     exit the other three already take: the author's fallback. */
  it("renders the author's fallback in the draft record's place", async () => {
    const { exported } = await setup();
    expect(await exported()).toContain("Fallback copy");
  });

  it("ships the same record once it is published", async () => {
    const { cms, record, exported } = await setup();
    await cms.updateContentItem(record.id, { status: "published" });
    expect(await exported()).toContain(DRAFT_COPY);
  });

  /* "not draft" would have been the wrong test: status is a three-value enum
     and archived is equally un-published. */
  it("does not ship an archived record either", async () => {
    const { cms, record, exported } = await setup();
    await cms.updateContentItem(record.id, { status: "published" });
    await cms.updateContentItem(record.id, { status: "archived" });
    expect(await exported()).not.toContain(DRAFT_COPY);
  });
});
