import { describe, it, expect } from "vitest";
import { migration0003 } from "../0003-add-color-warning";
import type { ProjectPayload } from "../types";

const token = (id: string, extra: Record<string, unknown> = {}) => ({
  id, name: id, value: "#000000", category: "colors",
  cssVar: `--buildrick-design-${id}`, type: "color", ...extra,
}) as unknown as ProjectPayload["tokens"][number];

const projectWithout = (): ProjectPayload => ({
  tokens: [token("color-primary"), token("color-success"), token("color-error")],
});

describe("migration0003 · add the color-warning state token", () => {
  it("toVersion=3 fromVersion=2", () => {
    expect(migration0003.fromVersion).toBe(2);
    expect(migration0003.toVersion).toBe(3);
  });

  it("up(): adds color-warning to a project that predates it", () => {
    const result = migration0003.up(projectWithout());
    const w = result.tokens.find((t) => t.id === "color-warning");
    expect(w?.value).toBe("#8E4B10");
    expect(w?.darkValue).toBe("#FACA15");
    expect(w?.cssVar).toBe("--buildrick-design-color-warning");
    expect(w?.group).toBe("state");
  });

  it("up(): appends rather than inserting — existing row order is untouched", () => {
    const before = projectWithout();
    const result = migration0003.up(before);
    expect(result.tokens.slice(0, 3).map((t) => t.id))
      .toEqual(before.tokens.map((t) => t.id));
    expect(result.tokens[result.tokens.length - 1].id).toBe("color-warning");
  });

  /* The one that matters: a user who already made their own `color-warning`
     must not have its value replaced by ours. */
  it("up(): never overwrites an existing color-warning, whatever its value", () => {
    const customised: ProjectPayload = {
      tokens: [...projectWithout().tokens, token("color-warning", { value: "#FF0000", darkValue: "" })],
    };
    const result = migration0003.up(customised);
    const all = result.tokens.filter((t) => t.id === "color-warning");
    expect(all).toHaveLength(1);
    expect(all[0].value).toBe("#FF0000");
    expect(all[0].darkValue).toBe("");
  });

  it("up(): is idempotent — running it twice changes nothing the second time", () => {
    const once = migration0003.up(projectWithout());
    const twice = migration0003.up(once);
    expect(twice.tokens).toEqual(once.tokens);
  });

  it("up(): leaves every other key on the payload alone", () => {
    const withExtras = { ...projectWithout(), presets: [{ id: "p1" }], dsBound: true };
    const result = migration0003.up(withExtras as ProjectPayload);
    expect(result.presets).toEqual([{ id: "p1" }]);
    expect(result.dsBound).toBe(true);
  });

  it("validate(): passes after up()", () => {
    expect(() => migration0003.validate(migration0003.up(projectWithout()))).not.toThrow();
  });

  it("validate(): throws when the token is absent", () => {
    expect(() => migration0003.validate(projectWithout()))
      .toThrow(/color-warning is absent/);
  });

  it("validate(): throws when the token has no cssVar to bind to", () => {
    const broken: ProjectPayload = { tokens: [token("color-warning", { cssVar: "" })] };
    expect(() => migration0003.validate(broken)).toThrow(/no cssVar/);
  });
});
