/**
 * commandRecents (S3.14) — the ⌘K MRU list. Newest-first, deduped, capped,
 * and resilient to a corrupt/empty store.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getRecentCommandIds, recordCommandRun } from "../commandRecents";

beforeEach(() => localStorage.clear());

describe("commandRecents", () => {
  it("returns [] when nothing has run", () => {
    expect(getRecentCommandIds()).toEqual([]);
  });

  it("records newest-first", () => {
    recordCommandRun("a");
    recordCommandRun("b");
    expect(getRecentCommandIds()).toEqual(["b", "a"]);
  });

  it("dedupes — re-running a command moves it to the front, not a duplicate", () => {
    recordCommandRun("a");
    recordCommandRun("b");
    recordCommandRun("a");
    expect(getRecentCommandIds()).toEqual(["a", "b"]);
  });

  it("caps at 5", () => {
    for (const id of ["a", "b", "c", "d", "e", "f", "g"]) recordCommandRun(id);
    expect(getRecentCommandIds()).toEqual(["g", "f", "e", "d", "c"]);
  });

  it("ignores an empty id", () => {
    recordCommandRun("");
    expect(getRecentCommandIds()).toEqual([]);
  });

  it("returns [] on a corrupt store instead of throwing", () => {
    localStorage.setItem("buildrick:command-recents", "{not json");
    expect(getRecentCommandIds()).toEqual([]);
  });
});
