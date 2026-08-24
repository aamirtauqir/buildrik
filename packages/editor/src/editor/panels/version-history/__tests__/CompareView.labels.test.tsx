/**
 * The Compare view is the fifth place the engine's event id reached a user.
 *
 * `versionDisplayName` is the SSOT that turns a stored `Auto: project:loaded`
 * into "Auto-save". The 2026-08-24 sweep fixed four callers that skipped it —
 * three aria-labels and the delete toast — and stopped there. Measured live on
 * 2026-08-25, expanding Compare on an auto-save printed, in plain sight:
 *
 *     Nothing changed since “Auto: project:loaded”.
 *
 * Three more raw uses sat beside it (the diptych's `alt`, its visible caption,
 * and the hover popover's label). Those three only render for a version that
 * HAS a visual snapshot, and today only named versions do — so they could not
 * leak yet. "Could not leak yet" is not a contract, so they route through the
 * SSOT too, and the guard below is written against the file rather than against
 * four string literals, so the next one is caught by construction.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareView } from "../CompareView";
import type { NamedVersion } from "@/shared/types/versions";

const autoSave: NamedVersion = {
  id: "v1",
  name: "Auto: project:loaded",
  snapshot: { pages: [] } as unknown as NamedVersion["snapshot"],
  createdAt: 1,
  isAutoCheckpoint: true,
  visualSnapshot: null,
};

function renderCompare(compareResult: Parameters<typeof CompareView>[0]["compareResult"]) {
  return render(
    <CompareView
      version={autoSave}
      compareResult={compareResult}
      currentVisualSnapshot={null}
      aiSummaryState={{ loading: false, result: null, error: null }}
      onGetAiSummary={() => {}}
      aiCooldownSeconds={0}
    />
  );
}

describe("Compare view never prints the engine's event id", () => {
  it("says Auto-save in the nothing-changed line, not Auto: project:loaded", () => {
    renderCompare({ summary: null, changes: [] } as never);
    expect(screen.getByText(/Nothing changed since “Auto-save”\./)).toBeTruthy();
    expect(screen.queryByText(/project:loaded/)).toBeNull();
  });

  /* The other branch of that same sentence — the clicked version IS the newest,
     so there is no diff to compute. It names no version, and must not start
     naming one. */
  it("keeps the newest-version wording when there is nothing later", () => {
    renderCompare(null);
    expect(screen.getByText(/newest version/)).toBeTruthy();
    expect(screen.queryByText(/project:loaded/)).toBeNull();
  });

  /* Written against the file, not against a list of strings: any NEW raw
     `version.name` in either file fails this, including one nobody thought to
     enumerate. */
  it.each([
    ["CompareView.tsx", "../CompareView.tsx"],
    ["VersionList.tsx", "../VersionList.tsx"],
  ])("%s has no bare version.name left", async (_label, rel) => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(__dirname, rel), "utf8");
    const withoutSsot = src.split("versionDisplayName(version)").join("");
    expect(withoutSsot).not.toContain("version.name");
  });
});
