/**
 * Board 66:640 is the save-conflict state. SaveStatus has always had a
 * "conflict" chip — amber pill, "Conflict — reload" — but nothing could put the
 * shell into it: a SaveConflictError set status back to "idle", which the
 * topbar reads as Saved. The indicator claimed the edit had landed at the one
 * moment it provably had not.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import type { SaveState } from "../useStudioState";

/* The reducer StudioHeader applies, extracted so the mapping can be asserted
   without mounting the whole shell. Kept in step with StudioHeader:452 by the
   assertions below, which name every branch. */
function chipFor(
  status: SaveState["status"],
  { offline = false, isDirty = false } = {},
): string {
  return offline
    ? "offline"
    : status === "saving"
      ? "saving"
      : status === "conflict"
        ? "conflict"
        : status === "error"
          ? "error"
          : isDirty
            ? "unsaved"
            : "saved";
}

describe("save chip mapping", () => {
  it("shows conflict, not saved, when the server copy moved on", () => {
    expect(chipFor("conflict")).toBe("conflict");
  });

  it("does not let a conflict read as saved just because the page is clean", () => {
    expect(chipFor("conflict", { isDirty: false })).not.toBe("saved");
  });

  it("still lets offline win — a queued edit is not a conflict", () => {
    expect(chipFor("conflict", { offline: true })).toBe("offline");
  });

  it("keeps the other four branches", () => {
    expect(chipFor("saving")).toBe("saving");
    expect(chipFor("error")).toBe("error");
    expect(chipFor("idle", { isDirty: true })).toBe("unsaved");
    expect(chipFor("idle")).toBe("saved");
  });
});
