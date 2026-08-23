/**
 * Board 162:2 calls every auto-save "Auto-save".
 *
 * They are STORED as `Auto: ${eventName}` — the engine's own event id — so the
 * Saves list printed rows reading "Auto: project:loaded", seven identical ones
 * on a session with seven opens. That is an internal identifier shown to a
 * customer, and it is also useless for telling two auto-saves apart, which the
 * board does with time and change count instead.
 *
 * The first fix tested the NAME for that prefix, and these tests pinned it.
 * That was wrong, and codex caught it: `createVersion` takes whatever a person
 * types, so a milestone deliberately named "Auto: launch checklist" was
 * silently relabelled "Auto-save" — a user's own words overwritten because they
 * collided with a prefix the engine happens to use. `NamedVersion` carries
 * `isAutoCheckpoint`, so the guess was never needed. Rewritten to the flag.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { versionDisplayName } from "../versionLabel";

describe("versionDisplayName", () => {
  it("calls an auto-checkpoint what the board calls it", () => {
    expect(versionDisplayName({ name: "Auto: project:loaded", isAutoCheckpoint: true })).toBe("Auto-save");
    expect(versionDisplayName({ name: "Auto: element:added", isAutoCheckpoint: true })).toBe("Auto-save");
  });

  it("leaves a name a person chose alone", () => {
    expect(versionDisplayName({ name: "before the rebrand", isAutoCheckpoint: false })).toBe("before the rebrand");
    expect(versionDisplayName({ name: "v2 launch", isAutoCheckpoint: false })).toBe("v2 launch");
  });

  /* The regression codex found. A person may name a version anything, and
     "Auto:" is not reserved. The flag decides, never the string. */
  it("keeps a MANUAL version whose name starts with Auto:", () => {
    expect(versionDisplayName({ name: "Auto: launch checklist", isAutoCheckpoint: false }))
      .toBe("Auto: launch checklist");
    expect(versionDisplayName({ name: "Auto: pre-migration", isAutoCheckpoint: false }))
      .toBe("Auto: pre-migration");
  });

  /* And the mirror: an auto-checkpoint is collapsed whatever it is called, so
     a future change to the stored format cannot leak an id onto the screen. */
  it("collapses an auto-checkpoint that does NOT use the Auto: prefix", () => {
    expect(versionDisplayName({ name: "checkpoint-4711", isAutoCheckpoint: true })).toBe("Auto-save");
  });

  it("treats a missing flag as manual — never invent an auto-save", () => {
    expect(versionDisplayName({ name: "Auto: something" })).toBe("Auto: something");
  });
});
