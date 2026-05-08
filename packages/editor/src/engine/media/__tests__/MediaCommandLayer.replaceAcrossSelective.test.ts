/**
 * S21 — replaceAcrossSelective + getUsagesByPage contract tests.
 *
 * Stub Composer with multi-page element trees. The new methods walk
 * `composer.elements.getAllPages()` + `getAllDescendants(root)` so the
 * stub mirrors that surface only.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { MediaCommandLayer } from "../MediaCommandLayer";
import { MEDIA_EVENTS } from "../../../shared/constants/media";
import type { Composer } from "../../Composer";

interface StubElement {
  id: string;
  pageId: string;
  src?: string;
  bgImage?: string;
}

interface StubPage {
  id: string;
  rootId: string;
}

function makeMultiPageComposer(opts: {
  pages: StubPage[];
  elements: StubElement[];
  failOnElementId?: string;
}) {
  const events: Array<{ event: string; payload: unknown }> = [];
  const elementState: Record<string, StubElement> = {};
  for (const e of opts.elements) elementState[e.id] = { ...e };

  function makeFacade(el: StubElement) {
    return {
      getId: () => el.id,
      getAttribute: (name: string) => (name === "src" ? el.src : undefined),
      getStyle: (prop: string) =>
        prop === "background-image" ? el.bgImage : undefined,
      setAttribute: (name: string, value: string) => {
        if (opts.failOnElementId === el.id) throw new Error("simulated write failure");
        if (name === "src") el.src = value;
      },
      setStyle: (prop: string, value: string) => {
        if (opts.failOnElementId === el.id) throw new Error("simulated write failure");
        if (prop === "background-image") el.bgImage = value;
      },
      // Element.getDescendants(): in the real engine, walks the element's
      // child tree. Stub: return all elements sharing the same pageId
      // (excluding the root itself) so the per-page traversal works.
      getDescendants: () => {
        return Object.values(elementState)
          .filter((other) => other.pageId === el.pageId && other.id !== el.id)
          .map(makeFacade);
      },
    };
  }

  const composer = {
    elements: {
      getAllPages: () =>
        opts.pages.map((p) => ({ id: p.id, root: { id: p.rootId } })),
      getElement: (id: string) =>
        elementState[id] ? makeFacade(elementState[id]) : undefined,
      findByMediaSrc: vi.fn(),
    },
    media: {
      emitEvent: (event: string, payload: unknown) =>
        events.push({ event, payload }),
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    emit: vi.fn(),
  };

  return {
    composer: composer as unknown as Composer,
    events,
    elementState,
  };
}

describe("MediaCommandLayer.getUsagesByPage", () => {
  it("returns an empty map for empty src", () => {
    const { composer } = makeMultiPageComposer({ pages: [], elements: [] });
    const cmd = new MediaCommandLayer(composer);
    expect(cmd.getUsagesByPage("").size).toBe(0);
  });

  it("groups matching elements by pageId", () => {
    const { composer } = makeMultiPageComposer({
      pages: [
        { id: "p1", rootId: "root-p1" },
        { id: "p2", rootId: "root-p2" },
      ],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "root-p2", pageId: "p2" },
        { id: "img-1", pageId: "p1", src: "logo.png" },
        { id: "img-2", pageId: "p1", src: "logo.png" },
        { id: "img-3", pageId: "p2", src: "logo.png" },
        { id: "img-4", pageId: "p2", src: "different.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);
    const map = cmd.getUsagesByPage("logo.png");
    expect(map.size).toBe(2);
    expect(map.get("p1")).toHaveLength(2);
    expect(map.get("p2")).toHaveLength(1);
  });

  it("matches background-image url() references", () => {
    const { composer } = makeMultiPageComposer({
      pages: [{ id: "p1", rootId: "root-p1" }],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "div-1", pageId: "p1", bgImage: 'url("hero.jpg")' },
      ],
    });
    const cmd = new MediaCommandLayer(composer);
    expect(cmd.getUsagesByPage("hero.jpg").get("p1")).toHaveLength(1);
  });

  it("excludes pages with no matching elements", () => {
    const { composer } = makeMultiPageComposer({
      pages: [
        { id: "p1", rootId: "root-p1" },
        { id: "p2", rootId: "root-p2" },
      ],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "root-p2", pageId: "p2" },
        { id: "img-1", pageId: "p1", src: "logo.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);
    const map = cmd.getUsagesByPage("logo.png");
    expect(map.has("p1")).toBe(true);
    expect(map.has("p2")).toBe(false);
  });
});

describe("MediaCommandLayer.replaceAcrossSelective", () => {
  it("only replaces elements on selected pages", () => {
    const { composer, elementState } = makeMultiPageComposer({
      pages: [
        { id: "p1", rootId: "root-p1" },
        { id: "p2", rootId: "root-p2" },
        { id: "p3", rootId: "root-p3" },
      ],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "root-p2", pageId: "p2" },
        { id: "root-p3", pageId: "p3" },
        { id: "img-a", pageId: "p1", src: "old.png" },
        { id: "img-b", pageId: "p2", src: "old.png" },
        { id: "img-c", pageId: "p3", src: "old.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.replaceAcrossSelective("old.png", "new.png", ["p1", "p3"]);

    expect(result.clean).toBe(true);
    expect(result.replaced).toHaveLength(2);
    expect(elementState["img-a"].src).toBe("new.png");
    expect(elementState["img-b"].src).toBe("old.png"); // p2 not selected
    expect(elementState["img-c"].src).toBe("new.png");
  });

  it("emits REPLACE_COMMITTED with the partial count when clean", () => {
    const { composer, events } = makeMultiPageComposer({
      pages: [{ id: "p1", rootId: "root-p1" }],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "img-1", pageId: "p1", src: "old.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);
    cmd.replaceAcrossSelective("old.png", "new.png", ["p1"]);
    const committed = events.find((e) => e.event === MEDIA_EVENTS.REPLACE_COMMITTED);
    expect(committed?.payload).toMatchObject({ oldSrc: "old.png", newSrc: "new.png", count: 1 });
  });

  it("rolls back when every selected element fails", () => {
    const { composer, elementState, events } = makeMultiPageComposer({
      pages: [{ id: "p1", rootId: "root-p1" }],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "bad", pageId: "p1", src: "old.png" },
      ],
      failOnElementId: "bad",
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.replaceAcrossSelective("old.png", "new.png", ["p1"]);

    expect(result.clean).toBe(false);
    expect(result.replaced).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(elementState.bad.src).toBe("old.png");
    const rolled = events.find((e) => e.event === MEDIA_EVENTS.REPLACE_ROLLED_BACK);
    expect(rolled?.payload).toMatchObject({ oldSrc: "old.png", reason: "all-failed" });
  });

  it("treats empty pageIds list as a no-op (zero elements processed)", () => {
    const { composer, elementState } = makeMultiPageComposer({
      pages: [{ id: "p1", rootId: "root-p1" }],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "img-1", pageId: "p1", src: "old.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);
    const result = cmd.replaceAcrossSelective("old.png", "new.png", []);
    expect(result.replaced).toHaveLength(0);
    expect(elementState["img-1"].src).toBe("old.png");
  });

  it("returns partial-success when some pages succeed and some fail", () => {
    const { composer, elementState, events } = makeMultiPageComposer({
      pages: [
        { id: "p1", rootId: "root-p1" },
        { id: "p2", rootId: "root-p2" },
      ],
      elements: [
        { id: "root-p1", pageId: "p1" },
        { id: "root-p2", pageId: "p2" },
        { id: "ok", pageId: "p1", src: "old.png" },
        { id: "bad", pageId: "p2", src: "old.png" },
      ],
      failOnElementId: "bad",
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.replaceAcrossSelective("old.png", "new.png", ["p1", "p2"]);

    expect(result.clean).toBe(false);
    expect(result.replaced).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(elementState.ok.src).toBe("new.png");
    expect(elementState.bad.src).toBe("old.png");
    const partial = events.find((e) => e.event === MEDIA_EVENTS.REPLACE_PARTIAL);
    expect(partial?.payload).toMatchObject({ succeeded: 1 });
  });
});
