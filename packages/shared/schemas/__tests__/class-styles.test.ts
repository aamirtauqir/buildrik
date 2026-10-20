import { describe, it, expect } from "vitest";
import { normalizeClassName } from "../class-styles";
import { isSafeCssSelector } from "../element-markup";

describe("normalizeClassName (CLASS-FIRST-SPEC §4.3)", () => {
  it.each([
    ["Card", "card"],
    ["  Hero Title  ", "hero-title"],
    ["a+b", "a-b"],
    ["--x__y--", "x__y"],
    ["Price  $ Tag!!", "price-tag"],
    ["é-card", "card"],
    [".card", "card"],
  ])("%j → %j", (raw, name) => {
    expect(normalizeClassName(raw)).toEqual({ name, error: null });
  });

  it.each([
    ["", "", "empty"],
    ["$$$", "", "empty"],
    ["2col", "2col", "start"],
    ["_x", "_x", "start"],
    ["a".repeat(65), "a".repeat(65), "too-long"],
    ["buildrick-el1", "buildrick-el1", "reserved"],
    ["BD-row", "bd-row", "reserved"],
    ["w-nav", "w-nav", "reserved"],
  ])("%j is refused (%j, %s)", (raw, name, error) => {
    expect(normalizeClassName(raw)).toEqual({ name, error });
  });

  it("is case-insensitive: Card and card are one class", () => {
    expect(normalizeClassName("Card").name).toBe(normalizeClassName("card").name);
  });

  it("every accepted name is a safe class selector", () => {
    const samples = ["a", "card", "is-dark", "x_1", "a".repeat(64), "Hero  Banner", "q-9_z"];
    for (const raw of samples) {
      const { name, error } = normalizeClassName(raw);
      expect(error).toBeNull();
      expect(isSafeCssSelector(`.${name}`)).toBe(true);
    }
  });
});
