import { describe, it, expect } from "vitest";
import before from "../__fixtures__/0001.before.json";
import after from "../__fixtures__/0001.after.json";
import { migration0001 } from "../0001-extend-token-kinds";
import type { ProjectPayload } from "../types";

describe("migration 0001 · extend token kinds (v0 → v1)", () => {
  it("metadata is correct", () => {
    expect(migration0001.fromVersion).toBe(0);
    expect(migration0001.toVersion).toBe(1);
    expect(migration0001.description).toMatch(/11 (token )?kinds?/i);
  });

  it("up(before) deep-equals after", () => {
    const result = migration0001.up(before as ProjectPayload);
    expect(result).toEqual(after);
  });

  it("is idempotent: up(after) deep-equals after", () => {
    const result = migration0001.up(after as ProjectPayload);
    expect(result).toEqual(after);
  });

  it("does not mutate the input project", () => {
    const input = JSON.parse(JSON.stringify(before)) as ProjectPayload;
    const snapshot = JSON.parse(JSON.stringify(input));
    migration0001.up(input);
    expect(input).toEqual(snapshot);
  });

  it("validate() passes on after-fixture", () => {
    expect(() => migration0001.validate(after as ProjectPayload)).not.toThrow();
  });

  it("validate() throws on a payload missing one of the 11 new kinds", () => {
    const broken = {
      tokens: (after as ProjectPayload).tokens.filter((t: any) => t.kind !== "radius"),
    };
    expect(() => migration0001.validate(broken)).toThrow(/radius/);
  });

  it("up() preserves user customisations to placeholder tokens", () => {
    const customised: ProjectPayload = {
      tokens: [
        ...(before as ProjectPayload).tokens,
        { id: "radius-sm", name: "Small radius", value: "6px", category: "layout", cssVar: "--bd-radius-sm", type: "length", kind: "radius", friendlyName: "Small radius" } as any,
      ],
    };
    const result = migration0001.up(customised);
    const radiusSm = result.tokens.find((t: any) => t.id === "radius-sm");
    expect(radiusSm?.value).toBe("6px"); // user value preserved, not overwritten by default
  });
});
