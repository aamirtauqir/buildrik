/**
 * The Time-Travel chord is printed on its own button, so it is a contract.
 *
 * `ctrl+shift+t` was bound TWICE: by `ui-open-templates` in the engine's
 * command registry, and by HistoryTab's own listener. The registry's
 * KeybindingManager listens on window in the CAPTURE phase, so it won — the
 * History panel was replaced by Templates, and the scrubber never opened. The
 * button meanwhile printed the chord in both its aria-label and its title.
 *
 * This is the same shape as the canvas-footer collisions (see
 * `canvas/__tests__/footerChordOwnership.test.ts`): two window listeners, one
 * chord, and `preventDefault()` cannot save the loser. The tie-break is the
 * same one used there and for ⌘1–⌘4 — the PRINTED chord wins, and the command
 * keeps its palette row without a shortcut. Templates already has its own
 * door (`T`), so nothing lost a way in.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const historySrc = readFileSync(join(HERE, "..", "HistoryTab.tsx"), "utf8");
const activitySrc = readFileSync(join(HERE, "..", "components", "ActivityView.tsx"), "utf8");
const commandsSrc = readFileSync(
  join(HERE, "..", "..", "..", "..", "..", "engine", "commands", "defaultCommands.ts"),
  "utf8",
);

/** Every `shortcut: "…"` the engine registry claims. */
const registryChords = [...commandsSrc.matchAll(/shortcut:\s*"([^"]+)"/g)].map((m) =>
  m[1].toLowerCase(),
);

describe("Time-Travel chord ownership", () => {
  it("is printed on the button that opens the scrubber", () => {
    // Guards the premise: if the label stops printing a chord, this whole
    // contract is moot and the test should be revisited, not silently pass.
    expect(activitySrc).toMatch(/aria-label="Open Time-Travel scrubber \(Ctrl\+Shift\+T\)"/);
    expect(activitySrc).toMatch(/title="Time-Travel \(Ctrl\+Shift\+T\)"/);
  });

  it("is handled by HistoryTab's own listener", () => {
    // The listener guards ctrlKey + shiftKey and matches the letter T.
    expect(historySrc).toMatch(/e\.ctrlKey\s*&&\s*e\.shiftKey\s*&&\s*\(e\.key === "T"/);
  });

  it("is NOT also claimed by a registry command", () => {
    // The regression: `ui-open-templates` held `ctrl+shift+t` and, running in
    // the capture phase, beat the listener above.
    expect(registryChords).not.toContain("ctrl+shift+t");
  });

  it("leaves ui-open-templates reachable without a shortcut", () => {
    // Dropping the chord must not delete the command — it still needs its
    // palette row, and `T` remains the panel's real door.
    expect(commandsSrc).toMatch(/id:\s*"ui-open-templates"/);
  });

  it("registry chords are unique among themselves", () => {
    // The same collision, one layer up: two commands sharing a chord makes
    // whichever registers last silently win.
    const dupes = registryChords.filter((c, i) => registryChords.indexOf(c) !== i);
    expect(dupes).toEqual([]);
  });
});
