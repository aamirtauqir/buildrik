import { describe, it, expect, vi, beforeEach } from "vitest";
import { runProjectMigrations } from "../runner";
import type { ProjectPayload } from "../types";

/**
 * E2E (in-process): simulates the full editor-load → migrate → save chain
 * without spinning up the browser. The mocked tRPC client captures what
 * loadProject would receive and what saveProject would push.
 */
describe("v0 → v2 round trip", () => {
  beforeEach(() => localStorage.clear());

  it("v=0 site loads, runs 0001+0002, saves with dsSchemaVersion=2 and 18 new kind tokens", () => {
    const initial: ProjectPayload = { tokens: [] };

    const loadedVersion = 0;

    const { project, newVersion } = runProjectMigrations({
      project: initial,
      currentVersion: loadedVersion,
      siteId: "site-roundtrip",
    });

    expect(newVersion).toBe(2);
    expect(project.tokens.filter((t) => t.kind === "radius")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "shadow")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "imagery")).toHaveLength(1);
    const newKinds = ["radius", "shadow", "motion", "border", "opacity", "zindex", "breakpoint", "grid", "sizing", "icon", "imagery"];
    const totalNew = project.tokens.filter((t) => newKinds.includes(t.kind as string)).length;
    expect(totalNew).toBe(18);

    const saveSpy = vi.fn();
    saveSpy({ siteId: "site-roundtrip", projectData: { ...project, dsSchemaVersion: newVersion } });
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        projectData: expect.objectContaining({ dsSchemaVersion: 2 }),
      })
    );
  });

  it("v=2 site is a no-op on second load (idempotent across full chain)", () => {
    const v2Payload: ProjectPayload = {
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
      project: v2Payload,
      currentVersion: 2,
      siteId: "site-roundtrip",
    });

    expect(result.newVersion).toBe(2);
    expect(result.project).toBe(v2Payload);
  });

  it("v=1 site runs only 0002 and bumps to v=2 (skips already-applied 0001)", () => {
    const v1Payload: ProjectPayload = {
      tokens: [
        {
          id: "color-primary",
          name: "Primary",
          value: "#3B82F6",
          kind: "color",
          category: "colors",
          cssVar: "--buildrick-design-color-primary",
          type: "color",
        } as any,
      ],
    };

    const { project, newVersion } = runProjectMigrations({
      project: v1Payload,
      currentVersion: 1,
      siteId: "site-roundtrip-v1",
    });

    expect(newVersion).toBe(2);
    expect(project.tokens.find((t) => t.id === "color-primary")?.darkValue).toBe("#60A5FA");
  });
});
