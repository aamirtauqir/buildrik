/**
 * A version's row title and its action labels must say the same thing.
 *
 * Auto-checkpoints are stored as `Auto: ${eventId}`, and `versionDisplayName`
 * exists to keep that internal id off the screen — board 162:2 calls every
 * auto-save "Auto-save" and distinguishes them by time. The row title used it;
 * the Compare / Restore / Delete `aria-label`s did not, so a sighted user read
 * "Restore Auto-save" while a screen reader announced
 * `Restore "Auto: project:loaded"`. Measured live 2026-08-24: 16 such labels on
 * one panel.
 *
 * The delete toast leaked the same raw name to everyone, not just AT users.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { versionDisplayName } from "@/shared/utils/versionLabel";

describe("version labels never leak the engine's event id", () => {
  it.each(["Auto: project:loaded", "Auto: element:created", "Auto: version:restored"])(
    "an auto-checkpoint stored as %s displays as Auto-save",
    (stored) => {
      expect(versionDisplayName({ name: stored, isAutoCheckpoint: true })).toBe("Auto-save");
    }
  );

  it("leaves a name the user chose alone — including one starting with Auto:", () => {
    expect(versionDisplayName({ name: "before the rebrand", isAutoCheckpoint: false })).toBe("before the rebrand");
    expect(versionDisplayName({ name: "Auto: launch checklist", isAutoCheckpoint: false })).toBe("Auto: launch checklist");
  });

  /* The bug was not in this function — it was every caller that skipped it.
     These are the four that reach a user: three aria-labels and one toast. */
  it("every user-facing string in the panel routes through it", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(__dirname, "..", "..", "..", "..");
    const list = readFileSync(join(root, "editor/panels/version-history/VersionList.tsx"), "utf8");
    const panel = readFileSync(join(root, "editor/panels/VersionHistoryPanel.tsx"), "utf8");

    for (const action of ["Compare", "Restore", "Delete"]) {
      expect(list).toContain(`aria-label={\`${action} "\${versionDisplayName(version)}"\`}`);
      expect(list).not.toContain(`aria-label={\`${action} "\${version.name}"\`}`);
    }
    expect(panel).toContain("Deleted ${versionDisplayName(target)}");
    expect(panel).not.toContain("Deleted ${target.name}");
  });
});
