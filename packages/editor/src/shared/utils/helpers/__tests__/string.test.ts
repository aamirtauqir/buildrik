/**
 * String helper tests — pins case conversion, slug, truncation, padding,
 * HTML stripping, templating, and regex-escape behavior.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  capitalize,
  titleCase,
  camelCase,
  snakeCase,
  kebabCase,
  camelToKebab,
  kebabToCamel,
  slugify,
  truncate,
  truncateMiddle,
  pad,
  stripHtml,
  wordCount,
  template,
  escapeRegExp,
  randomString,
} from "../string";

describe("case conversion", () => {
  it("capitalize upper-cases only the first letter", () => {
    expect(capitalize("hello world")).toBe("Hello world");
    expect(capitalize("")).toBe("");
    expect(capitalize("h")).toBe("H");
  });

  it("titleCase upper-cases each word boundary", () => {
    expect(titleCase("hello world")).toBe("Hello World");
    expect(titleCase("foo-bar baz")).toBe("Foo-Bar Baz");
  });

  it("camelCase handles dashes, underscores, and spaces", () => {
    expect(camelCase("foo-bar")).toBe("fooBar");
    expect(camelCase("foo_bar_baz")).toBe("fooBarBaz");
    expect(camelCase("foo bar")).toBe("fooBar");
    expect(camelCase("FooBar")).toBe("fooBar");
  });

  it("camelCase drops trailing separators", () => {
    expect(camelCase("foo-")).toBe("foo");
  });

  it("snakeCase converts camelCase, dashes, and spaces", () => {
    expect(snakeCase("fooBar")).toBe("foo_bar");
    expect(snakeCase("foo-bar baz")).toBe("foo_bar_baz");
    expect(snakeCase("FooBar")).toBe("foo_bar"); // inner oo→B boundary still splits
  });

  it("kebabCase converts camelCase, underscores, and spaces", () => {
    expect(kebabCase("fooBar")).toBe("foo-bar");
    expect(kebabCase("foo_bar baz")).toBe("foo-bar-baz");
  });

  it("camelToKebab handles letter and digit boundaries", () => {
    expect(camelToKebab("fooBar")).toBe("foo-bar");
    expect(camelToKebab("grid2Col")).toBe("grid2-col");
  });

  it("kebabToCamel round-trips camelToKebab", () => {
    expect(kebabToCamel("foo-bar")).toBe("fooBar");
    expect(kebabToCamel(camelToKebab("borderTopWidth"))).toBe("borderTopWidth");
  });
});

describe("slugify", () => {
  it("lowercases, trims, strips punctuation, collapses separators", () => {
    expect(slugify("  Hello,  World!  ")).toBe("hello-world");
    expect(slugify("foo_bar--baz")).toBe("foo-bar-baz");
  });

  it("strips non-word characters (incl. accents) and edge dashes", () => {
    expect(slugify("Héllo")).toBe("hllo");
    expect(slugify("--edge--")).toBe("edge");
  });
});

describe("truncate / truncateMiddle", () => {
  it("returns string unchanged when within length", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncateMiddle("short", 10)).toBe("short");
  });

  it("truncate keeps total length and appends suffix", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
    expect(truncate("hello world", 8)).toHaveLength(8);
    expect(truncate("hello world", 7, "…")).toBe("hello …");
  });

  it("truncateMiddle keeps front-heavy split around separator", () => {
    expect(truncateMiddle("abcdefghij", 7)).toBe("ab...ij");
    expect(truncateMiddle("abcdefghij", 7)).toHaveLength(7);
  });
});

describe("pad", () => {
  it("returns string unchanged when already long enough", () => {
    expect(pad("abcdef", 4)).toBe("abcdef");
  });

  it("pads end by default", () => {
    expect(pad("ab", 5)).toBe("ab   ");
    expect(pad("ab", 5, "*")).toBe("ab***");
  });

  it("pads start and both (right-heavy when odd)", () => {
    expect(pad("ab", 5, "*", "start")).toBe("***ab");
    expect(pad("ab", 5, "*", "both")).toBe("*ab**");
  });
});

describe("stripHtml / wordCount", () => {
  it("stripHtml removes tags but keeps text", () => {
    expect(stripHtml("<b>bold</b> and <i>italic</i>")).toBe("bold and italic");
    expect(stripHtml("no tags")).toBe("no tags");
  });

  it("wordCount counts whitespace-separated words", () => {
    expect(wordCount("  foo   bar\nbaz ")).toBe(3);
    expect(wordCount("")).toBe(0);
    expect(wordCount("   ")).toBe(0);
  });
});

describe("template", () => {
  it("substitutes {{key}} placeholders", () => {
    expect(template("Hi {{name}}!", { name: "Aamir" })).toBe("Hi Aamir!");
    expect(template("{{ a }} + {{b}}", { a: 1, b: 2 })).toBe("1 + 2");
  });

  it("resolves nested dot paths via get()", () => {
    expect(template("{{user.name}}", { user: { name: "X" } })).toBe("X");
  });

  it("renders empty string for missing keys", () => {
    expect(template("Hi {{missing}}!", {})).toBe("Hi !");
  });

  it("supports custom prefix/suffix delimiters", () => {
    expect(template("Hi <%name%>", { name: "Y" }, { prefix: "<%", suffix: "%>" })).toBe("Hi Y");
  });
});

describe("escapeRegExp", () => {
  it("escapes all regex metacharacters", () => {
    const special = ".*+?^${}()|[]\\";
    const escaped = escapeRegExp(special);
    expect(new RegExp(`^${escaped}$`).test(special)).toBe(true);
  });
});

describe("randomString", () => {
  it("produces requested length from the given alphabet", () => {
    const s = randomString(16);
    expect(s).toHaveLength(16);
    expect(s).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("uses a custom alphabet when provided", () => {
    expect(randomString(8, "a")).toBe("aaaaaaaa");
  });
});
