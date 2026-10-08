/**
 * layersPersistence — localStorage-backed hidden/locked/names/expanded state.
 * Pure functions; jsdom provides localStorage.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getStorageKey,
  loadSetFromStorage,
  takeLegacyLayerState,
  getLayerName,
  saveSetToStorage,
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

describe("legacy names / locked keys (pre G2-061)", () => {
  it("are read once and removed", () => {
    localStorage.setItem(getStorageKey("p1", "names"), JSON.stringify({ id1: "Hero" }));
    localStorage.setItem(getStorageKey("p1", "locked"), JSON.stringify(["id2"]));
    const { names, locked } = takeLegacyLayerState("p1");
    expect(names.get("id1")).toBe("Hero");
    expect([...locked]).toEqual(["id2"]);
    expect(localStorage.getItem(getStorageKey("p1", "names"))).toBeNull();
    expect(localStorage.getItem(getStorageKey("p1", "locked"))).toBeNull();
  });

  it("an invalid stored value migrates nothing", () => {
    localStorage.setItem(getStorageKey("p1", "names"), "###");
    expect(takeLegacyLayerState("p1").names.size).toBe(0);
  });
});

describe("getLayerName", () => {
  it("reads data.layerName, and nothing else", () => {
    expect(getLayerName({ getCustomData: (k) => (k === "layerName" ? "Hero" : undefined) })).toBe("Hero");
    expect(getLayerName({ getCustomData: () => "" })).toBeUndefined();
    expect(getLayerName(undefined)).toBeUndefined();
  });
});
