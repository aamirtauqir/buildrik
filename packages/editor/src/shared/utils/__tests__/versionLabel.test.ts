/**
 * Board 162:2 calls every auto-save "Auto-save".
 *
 * They are STORED as `Auto: ${eventName}` — the engine's own event id — so the
 * Saves list printed rows reading "Auto: project:loaded", seven identical ones
 * on a session with seven opens. That is an internal identifier shown to a
 * customer, and it is also useless for telling two auto-saves apart, which the
 * board does with time and change count instead.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { versionDisplayName } from "../versionLabel";

describe("versionDisplayName", () => {
  it("calls an auto-checkpoint what the board calls it", () => {
    expect(versionDisplayName("Auto: project:loaded")).toBe("Auto-save");
    expect(versionDisplayName("Auto: element:added")).toBe("Auto-save");
  });

  it("leaves a name the user chose exactly as they typed it", () => {
    expect(versionDisplayName("Before the rebrand")).toBe("Before the rebrand");
    // Including one that merely starts with the word.
    expect(versionDisplayName("Automatic backup notes")).toBe("Automatic backup notes");
  });

  it("does not swallow a name that only mentions Auto later", () => {
    expect(versionDisplayName("Draft — Auto: kept")).toBe("Draft — Auto: kept");
  });
});
