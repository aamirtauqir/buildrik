import { describe, it, expect } from "vitest";
import { migration0002 } from "../0002-seed-dark-color-values";
import type { ProjectPayload } from "../types";
import before from "../__fixtures__/0002.before.json";
import after from "../__fixtures__/0002.after.json";

describe("migration0002 · seed darkValue on default color tokens", () => {
  it("toVersion=2 fromVersion=1", () => {
    expect(migration0002.fromVersion).toBe(1);
    expect(migration0002.toVersion).toBe(2);
  });

  it("up(): seeds darkValue on known default color tokens", () => {
    const result = migration0002.up(before as ProjectPayload);
    const primary = result.tokens.find((t) => t.id === "color-primary");
    expect(primary?.darkValue).toBe("#60A5FA");
    const text = result.tokens.find((t) => t.id === "color-text");
    expect(text?.darkValue).toBe("#E2E8F0");
  });

  it("up(): leaves user-added color tokens untouched (no default mapping)", () => {
    const result = migration0002.up(before as ProjectPayload);
    const custom = result.tokens.find((t) => t.id === "color-custom-user");
    expect(custom?.darkValue).toBeUndefined();
  });

  it("up(): preserves user-set darkValue (idempotent + non-destructive)", () => {
    const customised: ProjectPayload = {
      tokens: [
        ...(before as ProjectPayload).tokens,
        {
          id: "color-primary", name: "Primary", value: "#3B82F6",
          category: "colors", cssVar: "--bd-color-primary", type: "color",
          kind: "color", darkValue: "#999999",
        } as any,
      ],
    };
    const result = migration0002.up(customised);
    // Last entry was the customised one — find by id reads first match. Look up
    // by index to get the one we appended.
    const last = result.tokens[result.tokens.length - 1];
    expect(last.darkValue).toBe("#999999");
  });

  it("up(): preserves explicit darkValue=\"\" (treated as user choice, NOT missing)", () => {
    const customised: ProjectPayload = {
      tokens: [
        {
          id: "color-primary", name: "Primary", value: "#3B82F6",
          category: "colors", cssVar: "--bd-color-primary", type: "color",
          kind: "color", darkValue: "",
        } as any,
      ],
    };
    const result = migration0002.up(customised);
    expect(result.tokens[0].darkValue).toBe("");
  });

  it("up(): is idempotent — running twice yields same payload", () => {
    const once = migration0002.up(before as ProjectPayload);
    const twice = migration0002.up(once);
    expect(twice).toEqual(once);
  });

  it("up(): does NOT mutate input", () => {
    const input = JSON.parse(JSON.stringify(before)) as ProjectPayload;
    const snapshot = JSON.parse(JSON.stringify(input));
    migration0002.up(input);
    expect(input).toEqual(snapshot);
  });

  it("up() output matches after-fixture", () => {
    const result = migration0002.up(before as ProjectPayload);
    expect(result).toEqual(after);
  });

  it("validate(): passes on after-fixture", () => {
    expect(() => migration0002.validate(after as ProjectPayload)).not.toThrow();
  });

  it("validate(): throws when a known default id is present but darkValue still missing", () => {
    const broken: ProjectPayload = {
      tokens: [
        {
          id: "color-primary", name: "Primary", value: "#3B82F6",
          category: "colors", cssVar: "--bd-color-primary", type: "color",
          kind: "color",
          // no darkValue
        } as any,
      ],
    };
    expect(() => migration0002.validate(broken)).toThrow(/color-primary/);
  });

  it("validate(): silent when known default id absent (project never had that token)", () => {
    const sparse: ProjectPayload = {
      tokens: [
        {
          id: "color-custom-user", name: "Custom", value: "#abc",
          category: "colors", cssVar: "--bd-color-custom-user", type: "color",
          kind: "color",
        } as any,
      ],
    };
    expect(() => migration0002.validate(sparse)).not.toThrow();
  });
});
