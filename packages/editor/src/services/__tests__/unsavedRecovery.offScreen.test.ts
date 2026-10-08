/**
 * L5-074 (data loss): after a reload, the kept copy of edits that never reached
 * the server is NOT what the screen shows — the screen is the server's copy.
 * A save of the screen (Retry, or the next autosave) used to clear the kept
 * copy as "now on the server", and a failed one overwrote it with the screen.
 * Either way the user's edits were gone. Until the copy is restored it is
 * kept: never cleared by a save of something else, never overwritten.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  clearUnsaved,
  discardUnsaved,
  keepUnsaved,
  markUnsavedOffScreen,
  readUnsaved,
  resumeKeepingUnsaved,
  takeOffScreenUnsaved,
} from "../unsavedRecovery";
import type { ProjectData } from "@shared/types";

const SITE = "site-l5074";
const mine = { pages: [{ id: "p", name: "mine" }] } as unknown as ProjectData;
const screen = { pages: [{ id: "p", name: "server" }] } as unknown as ProjectData;

afterEach(() => {
  takeOffScreenUnsaved(SITE);
  resumeKeepingUnsaved();
  clearUnsaved(SITE);
});

describe("a kept copy the screen does not show", () => {
  it("survives a save of the screen", () => {
    keepUnsaved(SITE, mine);
    markUnsavedOffScreen(SITE);
    clearUnsaved(SITE);
    expect(readUnsaved(SITE)?.project).toEqual(mine);
  });

  it("is not overwritten by a failed save of the screen", () => {
    keepUnsaved(SITE, mine);
    markUnsavedOffScreen(SITE);
    keepUnsaved(SITE, screen);
    expect(readUnsaved(SITE)?.project).toEqual(mine);
  });

  it("is handed over once, then follows the normal rules", () => {
    keepUnsaved(SITE, mine);
    markUnsavedOffScreen(SITE);
    expect(takeOffScreenUnsaved(SITE)?.project).toEqual(mine);
    expect(takeOffScreenUnsaved(SITE)).toBeNull();
    // Still kept until a save of it is confirmed…
    expect(readUnsaved(SITE)?.project).toEqual(mine);
    clearUnsaved(SITE);
    expect(readUnsaved(SITE)).toBeNull();
  });

  it("goes when the user discards it", () => {
    keepUnsaved(SITE, mine);
    markUnsavedOffScreen(SITE);
    discardUnsaved(SITE);
    expect(readUnsaved(SITE)).toBeNull();
  });
});
