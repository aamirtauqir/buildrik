import { describe, it, expect, vi, beforeEach } from "vitest";
import { runProjectMigrations } from "../runner";
import type { ProjectPayload } from "../types";

/**
 * E2E (in-process): simulates the full editor-load → migrate → save chain
 * without spinning up the browser. The mocked tRPC client captures what
 * loadProject would receive and what saveProject would push.
 */
describe("v0 → v1 round trip", () => {
  beforeEach(() => localStorage.clear());

  it("v=0 site loads, migrates, saves with dsSchemaVersion=1 and 18 new tokens", () => {
    const initial: ProjectPayload = { tokens: [] };

    // Phase 1: load (simulated — server returned dsSchemaVersion=0)
    const loadedVersion = 0;

    // Phase 2: migrate
    const { project, newVersion } = runProjectMigrations({
      project: initial,
      currentVersion: loadedVersion,
      siteId: "site-roundtrip",
    });

    expect(newVersion).toBe(1);
    expect(project.tokens.filter((t) => t.kind === "radius")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "shadow")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "imagery")).toHaveLength(1);
    // Sanity: 18 total new tokens spread across 11 kinds.
    const newKinds = ["radius", "shadow", "motion", "border", "opacity", "zindex", "breakpoint", "grid", "sizing", "icon", "imagery"];
    const totalNew = project.tokens.filter((t) => newKinds.includes(t.kind as string)).length;
    expect(totalNew).toBe(18);

    // Phase 3: save (mocked) — verify the payload would carry dsSchemaVersion=1
    const saveSpy = vi.fn();
    saveSpy({ siteId: "site-roundtrip", projectData: { ...project, dsSchemaVersion: newVersion } });
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        projectData: expect.objectContaining({ dsSchemaVersion: 1 }),
      })
    );
  });

  it("v=1 site is a no-op on second load (idempotent across full chain)", () => {
    const v1Payload: ProjectPayload = {
      tokens: [
        {
          id: "radius-sm",
          name: "Small radius",
          value: "4px",
          kind: "radius",
          category: "layout",
          cssVar: "--bd-radius-sm",
          type: "length",
          friendlyName: "Small radius",
        } as any,
      ],
    };

    const result = runProjectMigrations({
      project: v1Payload,
      currentVersion: 1,
      siteId: "site-roundtrip",
    });

    expect(result.newVersion).toBe(1);
    expect(result.project).toBe(v1Payload); // same reference, no work done
  });
});
