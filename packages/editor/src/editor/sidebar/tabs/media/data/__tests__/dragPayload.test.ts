/**
 * Contract tests for the unified media drag payload.
 *
 * The `application/x-aquibra-media-*` keys are the shared vocabulary
 * between every drag source (SlimLauncher tile, library grid card) and
 * the canvas drop handler (useCanvasDragDrop.handleInternalMediaDrop).
 * Drift here silently breaks drag-to-canvas.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  setMediaDragData,
  readMediaDragData,
  libraryTypeToInsertType,
} from "../dragPayload";
import type { LibraryItem } from "../mediaTypes";

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "asset-1",
    name: "logo",
    type: "img",
    src: "blob:https://app/abc",
    size: 1234,
    ...overrides,
  } as LibraryItem;
}

function makeDT() {
  // Polyfill DataTransfer for jsdom — node doesn't ship it.
  const store = new Map<string, string>();
  const dt: Partial<DataTransfer> & {
    getData: (k: string) => string;
    setData: (k: string, v: string) => void;
  } = {
    effectAllowed: "none" as DataTransfer["effectAllowed"],
    getData: (k: string) => store.get(k) ?? "",
    setData: (k: string, v: string) => {
      store.set(k, v);
    },
  };
  return dt as DataTransfer;
}

describe("libraryTypeToInsertType", () => {
  it("maps all known LibraryItem.type values", () => {
    expect(libraryTypeToInsertType("img")).toBe("image");
    expect(libraryTypeToInsertType("vid")).toBe("video");
    expect(libraryTypeToInsertType("ico")).toBe("icon");
    expect(libraryTypeToInsertType("fnt")).toBe("font");
  });
});

describe("setMediaDragData / readMediaDragData round-trip", () => {
  it("writes the three canonical keys + text/plain fallback", () => {
    const dt = makeDT();
    setMediaDragData(dt, makeItem());

    expect(dt.getData("application/x-aquibra-media-src")).toBe("blob:https://app/abc");
    expect(dt.getData("application/x-aquibra-media-type")).toBe("image");
    expect(dt.getData("application/x-aquibra-media-name")).toBe("logo");
    expect(dt.getData("text/plain")).toBe("blob:https://app/abc");
  });

  it("sets effectAllowed = copy so the drop handler shows the copy cursor", () => {
    const dt = makeDT();
    setMediaDragData(dt, makeItem());
    expect(dt.effectAllowed).toBe("copy");
  });

  it("translates LibraryItem.type → MediaInsertType in the payload", () => {
    const dt = makeDT();
    setMediaDragData(dt, makeItem({ type: "vid" }));
    expect(dt.getData("application/x-aquibra-media-type")).toBe("video");

    const dt2 = makeDT();
    setMediaDragData(dt2, makeItem({ type: "fnt" }));
    expect(dt2.getData("application/x-aquibra-media-type")).toBe("font");
  });

  it("readMediaDragData returns the same payload the source wrote", () => {
    const dt = makeDT();
    setMediaDragData(dt, makeItem({ name: "hero-bg", type: "vid", src: "blob:xyz" }));

    const read = readMediaDragData(dt);
    expect(read).toEqual({ src: "blob:xyz", type: "video", name: "hero-bg" });
  });

  it("readMediaDragData returns null when the drag is not a media drag", () => {
    const dt = makeDT();
    dt.setData("text/plain", "just some text");
    expect(readMediaDragData(dt)).toBeNull();
  });

  it("readMediaDragData returns null when src is set but type is missing", () => {
    const dt = makeDT();
    dt.setData("application/x-aquibra-media-src", "blob:xyz");
    // No type set.
    expect(readMediaDragData(dt)).toBeNull();
  });
});
