/**
 * html/encoding — escapeAttr / escapeHTML / unescapeHTML round-trips.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { escapeAttr, escapeHTML, unescapeHTML } from "../encoding";

describe("escapeHTML", () => {
  it("escapes only the content-critical trio &<>", () => {
    expect(escapeHTML("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });

  it("leaves quotes and slashes untouched (not content-dangerous)", () => {
    expect(escapeHTML(`"'/\``)).toBe(`"'/\``);
  });

  it("returns empty for empty input", () => {
    expect(escapeHTML("")).toBe("");
  });
});

describe("escapeAttr", () => {
  it("escapes the full attribute-danger set including quotes, backtick, slash", () => {
    expect(escapeAttr(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeAttr("`")).toBe("&#96;");
    expect(escapeAttr("/")).toBe("&#47;");
  });

  it("escapes each occurrence, not just the first", () => {
    expect(escapeAttr("&&")).toBe("&amp;&amp;");
  });
});

describe("unescapeHTML", () => {
  it("decodes named entities", () => {
    expect(unescapeHTML("a &amp; b &lt; c &gt; d")).toBe("a & b < c > d");
    expect(unescapeHTML("&quot;q&quot; &#39;a&#39;")).toBe(`"q" 'a'`);
  });

  it("decodes typographic named entities", () => {
    expect(unescapeHTML("&mdash;&ndash;&hellip;")).toBe("—–…");
    expect(unescapeHTML("&nbsp;")).toBe(" ");
    expect(unescapeHTML("&copy;&reg;&trade;")).toBe("©®™");
  });

  it("decodes decimal numeric entities", () => {
    expect(unescapeHTML("&#65;&#66;")).toBe("AB");
  });

  it("decodes hex numeric entities", () => {
    expect(unescapeHTML("&#x41;&#x42;")).toBe("AB");
  });

  it("handles a mix of named + numeric entities", () => {
    expect(unescapeHTML("&lt;b&gt;hi&#33;&#x21;")).toBe("<b>hi!!");
  });

  it("is a rough inverse of escapeHTML for the & < > trio", () => {
    const raw = "1 < 2 && 3 > 2";
    expect(unescapeHTML(escapeHTML(raw))).toBe(raw);
  });
});
