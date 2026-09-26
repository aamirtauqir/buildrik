import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gap walk 93 #3 (no-return): "Hide inspector" was written to localStorage,
 * so after a reload the inspector stayed hidden with no visible way back —
 * the footer toggle has no home on the board (G2-037) and the only doors left
 * were ⌘K "Toggle inspector" and ⌘J. No board draws a "Show inspector"
 * control, so none is invented: the hidden state lasts the session only, and
 * the hide itself answers with a toast whose "Show" action is the way back.
 */
const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../StudioPanels.tsx"),
  "utf8"
);

describe("StudioPanels — Hide inspector has a way back", () => {
  it("does not persist the hidden state across reloads", () => {
    expect(src).not.toContain("buildrik-inspector-shown");
    expect(src).toContain("React.useState<boolean>(true)");
  });

  it("hiding raises a toast whose action shows the inspector again", () => {
    expect(src).toMatch(
      /if \(!next\)\s*addToast\(\{\s*description: "Inspector hidden",\s*action: \{ label: "Show", onClick: \(\) => setInspectorShown\(true\) \}/
    );
  });
});
