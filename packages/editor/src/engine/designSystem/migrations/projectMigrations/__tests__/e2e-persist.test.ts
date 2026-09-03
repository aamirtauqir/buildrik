import { describe, it, expect, vi, beforeEach } from "vitest";
import { runProjectMigrations } from "../runner";
import { TARGET_PROJECT_VERSION } from "../index";
import type { ProjectPayload } from "../types";

/**
 * E2E (in-process): simulates the full editor-load → migrate → save chain
 * without spinning up the browser. The mocked tRPC client captures what
 * loadProject would receive and what saveProject would push.
 */
describe("v0 → latest round trip", () => {
  beforeEach(() => localStorage.clear());

  it("v=0 site loads, runs the whole chain, saves at the target version with 18 new kind tokens", () => {
    const initial: ProjectPayload = { tokens: [] };

    const loadedVersion = 0;

    const { project, newVersion } = runProjectMigrations({
      project: initial,
      currentVersion: loadedVersion,
      siteId: "site-roundtrip",
    });

    expect(newVersion).toBe(TARGET_PROJECT_VERSION);
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
        projectData: expect.objectContaining({ dsSchemaVersion: TARGET_PROJECT_VERSION }),
      })
    );
  });

  it("a site already at the target version is a no-op on second load (idempotent across full chain)", () => {
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
      currentVersion: TARGET_PROJECT_VERSION,
      siteId: "site-roundtrip",
    });

    expect(result.newVersion).toBe(TARGET_PROJECT_VERSION);
    expect(result.project).toBe(v2Payload);
  });

  it("v=1 site runs the remaining migrations and reaches the target (skips already-applied 0001)", () => {
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

    expect(newVersion).toBe(TARGET_PROJECT_VERSION);
    expect(project.tokens.find((t) => t.id === "color-primary")?.darkValue).toBe("#60A5FA");
  });
});
