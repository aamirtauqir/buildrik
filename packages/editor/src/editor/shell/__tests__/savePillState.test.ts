/**
 * Design decision 4 / DR-T3: one save state at a time, in priority order —
 * Conflict > Offline > Save failed > Not saving > Saving > Unsaved > Saved.
 */
import { describe, it, expect } from "vitest";
import { savePillState } from "../StudioHeader";

const base = { saveStatus: "idle" as const, offline: false, stalled: false, dirty: false };

describe("savePillState", () => {
  it.each([
    ["conflict beats everything", { ...base, saveStatus: "conflict" as const, offline: true, stalled: true, dirty: true }, "conflict"],
    ["offline beats a failed save", { ...base, saveStatus: "error" as const, offline: true, stalled: true }, "offline"],
    ["save failed beats not saving", { ...base, saveStatus: "error" as const, stalled: true }, "error"],
    ["not saving beats saving", { ...base, saveStatus: "saving" as const, stalled: true }, "stalled"],
    ["saving beats unsaved", { ...base, saveStatus: "saving" as const, dirty: true }, "saving"],
    ["unsaved", { ...base, dirty: true }, "unsaved"],
    ["saved", base, "saved"],
  ])("%s", (_name, input, expected) => {
    expect(savePillState(input)).toBe(expected);
  });
});
