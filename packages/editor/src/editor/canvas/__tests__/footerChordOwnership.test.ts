// @vitest-environment jsdom
/**
 * Chords the canvas footer binds must not also belong to a registry command.
 *
 * Both listeners sit on window; the registry's runs in the capture phase and
 * `preventDefault()` does not stop the footer's from running too. Measured in
 * the running app: ⌘' toggled the Grid overlay AND flipped `snapToGrid` — a
 * resize setting the user never asked to change and cannot see change. ⌘= took
 * the zoom to 110 rather than the next preset the flyout itself lists, so the
 * chord printed beside the + button did something the + button does not.
 *
 * The footer's chords are the ones the boards PRINT, on the overlay bar and
 * the zoom flyout. That is the tie-break already used for ⌘1–⌘4 in
 * defaultCommands: the printed chord wins and the command keeps its palette
 * row. This test holds that line for the rest of them.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KeybindingManager } from "@/engine/commands";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";

const HERE = dirname(fileURLToPath(import.meta.url));
const footerSrc = readFileSync(join(HERE, "..", "CanvasFooterToolbar.tsx"), "utf8");

/* The handler lowercases into `key` and guards on meta/ctrl once, at the top,
   so every `key === "x"` below that guard is a ⌘-chord. Shift is per-branch —
   X-Ray is ⌘⇧X, not ⌘X, and reading it as ⌘X makes `cut` look like a
   collision. */
const footerChords = footerSrc
  .split("\n")
  .flatMap((line) => {
    const shift = /e\.shiftKey/.test(line) && !/!e\.shiftKey/.test(line);
    return [...line.matchAll(/\bkey === "([^"]{1,3})"/g)].map((m) => ({ key: m[1], shift }));
  });

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("canvas footer chord ownership", () => {
  const keys = new KeybindingManager();
  beforeAll(() => {
    createTestComposer().commands.getAll().forEach((c) => keys.indexCommand(c));
  });

  it("reads the footer's chords out of the source", () => {
    /* If this ever comes back empty the test below passes for the wrong
       reason — the regex stopped matching, not the collisions stopped. */
    expect(footerChords.length).toBeGreaterThan(4);
    expect(footerChords.map((c) => c.key)).toContain("'");
  });

  it("shares no chord with a registry command", () => {
    const shared = footerChords
      .map((k) => ({ chord: keys.normalizeShortcut(`ctrl+${k.shift ? "shift+" : ""}${k.key}`) }))
      .map((x) => ({ ...x, commandId: keys.findCommandId(x.chord) }))
      .filter((x) => x.commandId);
    expect(shared).toEqual([]);
  });
});
