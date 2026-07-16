/**
 * layersPersistence — localStorage-backed hidden/locked/names/expanded state.
 * Pure functions; jsdom provides localStorage + DOM for applyStoredStatesToDOM.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getStorageKey,
  loadSetFromStorage,
  loadMapFromStorage,
  saveSetToStorage,
  saveMapToStorage,
  applyStoredStatesToDOM,
} from "../layersPersistence";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("getStorageKey", () => {
  it("namespaces by page id and data type", () => {
    expect(getStorageKey("page-1", "hidden")).toBe("buildrick-layers-page-1-hidden");
    expect(getStorageKey("page-1", "locked")).toBe("buildrick-layers-page-1-locked");
    expect(getStorageKey("abc", "expanded")).toBe("buildrick-layers-abc-expanded");
    expect(getStorageKey("abc", "names")).toBe("buildrick-layers-abc-names");
  });
});

describe("Set persistence round-trip", () => {
  it("saves and loads a Set as a JSON array", () => {
    saveSetToStorage("p1", "hidden", new Set(["a", "b", "c"]));
    const loaded = loadSetFromStorage("p1", "hidden");
    expect(loaded).toBeInstanceOf(Set);
    expect([...loaded].sort()).toEqual(["a", "b", "c"]);
  });

  it("keeps hidden/locked/expanded in separate keys", () => {
    saveSetToStorage("p1", "hidden", new Set(["h"]));
    saveSetToStorage("p1", "locked", new Set(["l"]));
    expect([...loadSetFromStorage("p1", "hidden")]).toEqual(["h"]);
    expect([...loadSetFromStorage("p1", "locked")]).toEqual(["l"]);
  });

  it("returns an empty Set when the key is missing", () => {
    expect(loadSetFromStorage("nope", "hidden").size).toBe(0);
  });

  it("returns an empty Set when the stored value is invalid JSON", () => {
    localStorage.setItem(getStorageKey("p1", "hidden"), "{not json");
    expect(loadSetFromStorage("p1", "hidden").size).toBe(0);
  });

  it("returns an empty Set when the stored value is not an array", () => {
    localStorage.setItem(getStorageKey("p1", "hidden"), JSON.stringify({ a: 1 }));
    expect(loadSetFromStorage("p1", "hidden").size).toBe(0);
  });
});

describe("Map persistence round-trip", () => {
  it("saves and loads a Map as a JSON object", () => {
    saveMapToStorage("p1", new Map([["id1", "Hero"], ["id2", "Footer"]]));
    const loaded = loadMapFromStorage("p1");
    expect(loaded).toBeInstanceOf(Map);
    expect(loaded.get("id1")).toBe("Hero");
    expect(loaded.get("id2")).toBe("Footer");
  });

  it("returns an empty Map when the key is missing", () => {
    expect(loadMapFromStorage("nope").size).toBe(0);
  });

  it("returns an empty Map when the stored value is invalid JSON", () => {
    localStorage.setItem(getStorageKey("p1", "names"), "###");
    expect(loadMapFromStorage("p1").size).toBe(0);
  });
});

describe("applyStoredStatesToDOM", () => {
  it("marks hidden and locked elements by data-buildrick-id", () => {
    const hiddenEl = document.createElement("div");
    hiddenEl.setAttribute("data-buildrick-id", "hidden-1");
    const lockedEl = document.createElement("div");
    lockedEl.setAttribute("data-buildrick-id", "locked-1");
    document.body.append(hiddenEl, lockedEl);

    applyStoredStatesToDOM(new Set(["hidden-1"]), new Set(["locked-1"]));

    expect(hiddenEl.getAttribute("data-hidden")).toBe("true");
    expect(lockedEl.getAttribute("data-locked")).toBe("true");
  });

  it("ignores ids with no matching DOM element", () => {
    // No elements in DOM — should not throw.
    expect(() => applyStoredStatesToDOM(new Set(["ghost"]), new Set(["ghost"]))).not.toThrow();
  });
});
