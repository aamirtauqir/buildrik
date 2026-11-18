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
  compareKeptToServer,
  peekOffScreenUnsaved,
  discardUnsaved,
  keepUnsaved,
  markUnsavedOffScreen,
  onOffScreenSettled,
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
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    clearUnsaved(SITE);
    expect(readUnsaved(SITE)?.project).toEqual(mine);
  });

  it("is not overwritten by a failed save of the screen", () => {
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    keepUnsaved(SITE, screen, null);
    expect(readUnsaved(SITE)?.project).toEqual(mine);
  });

  it("is handed over once, then follows the normal rules", () => {
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    expect(takeOffScreenUnsaved(SITE)?.project).toEqual(mine);
    expect(takeOffScreenUnsaved(SITE)).toBeNull();
    // Still kept until a save of it is confirmed…
    expect(readUnsaved(SITE)?.project).toEqual(mine);
    clearUnsaved(SITE);
    expect(readUnsaved(SITE)).toBeNull();
  });

  it("goes when the user discards it", () => {
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    discardUnsaved(SITE);
    expect(readUnsaved(SITE)).toBeNull();
  });
});

/* EDT-018: the "Restore my edits" prompt is about the off-screen copy. Once
   that copy is handed over (Restore, or a Retry that restores it first) or
   thrown away, the prompt has nothing left to offer — its owner hears so. */
describe("the off-screen offer settling", () => {
  it("is announced once when the copy is handed over", () => {
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    let heard = 0;
    onOffScreenSettled(SITE, () => (heard += 1));
    takeOffScreenUnsaved(SITE);
    takeOffScreenUnsaved(SITE);
    expect(heard).toBe(1);
  });

  it("is announced when the copy is discarded", () => {
    keepUnsaved(SITE, mine, null);
    markUnsavedOffScreen(SITE);
    let heard = 0;
    onOffScreenSettled(SITE, () => (heard += 1));
    discardUnsaved(SITE);
    expect(heard).toBe(1);
  });

  it("is not announced for another site, or after unsubscribing", () => {
    markUnsavedOffScreen(SITE);
    markUnsavedOffScreen("other-site");
    let heard = 0;
    const stop = onOffScreenSettled(SITE, () => (heard += 1));
    takeOffScreenUnsaved("other-site");
    expect(heard).toBe(0);
    stop();
    takeOffScreenUnsaved(SITE);
    expect(heard).toBe(0);
  });
});

/* R1: whether restoring the kept edits would replace someone's later save is
   decided by the token the edits were made on, never by when they were made. */
describe("compareKeptToServer", () => {
  const T = "2026-10-15T10:00:00.000Z";
  it.each([
    ["the loaded token is the edits' base", { base: T }, T, "unchanged"],
    ["the same instant in another ISO spelling", { base: T }, "2026-10-15T10:00:00Z", "unchanged"],
    ["the server saved since", { base: T }, "2026-10-15T10:05:00.000Z", "server-newer"],
    ["an older record without a base", {}, T, "unknown"],
    ["no loaded token", { base: T }, null, "unknown"],
  ])("%s", (_case, extra, loaded, expected) => {
    expect(compareKeptToServer({ project: mine, at: "2026-10-15T11:00:00.000Z", ...extra }, loaded)).toBe(expected);
  });
});

describe("peekOffScreenUnsaved", () => {
  it("shows the waiting copy without handing it over", () => {
    keepUnsaved(SITE, mine, null);
    expect(peekOffScreenUnsaved(SITE)).toBeNull();
    markUnsavedOffScreen(SITE);
    expect(peekOffScreenUnsaved(SITE)?.project).toEqual(mine);
    expect(takeOffScreenUnsaved(SITE)?.project).toEqual(mine);
    expect(peekOffScreenUnsaved(SITE)).toBeNull();
    clearUnsaved(SITE);
  });
});
