// @vitest-environment jsdom
/**
 * ExportHelpers — pure HTML/CSS string utilities used by the export path.
 * jsdom needed only for the download* DOM helpers.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RESET_CSS, camelToKebab, escapeHTML, stylesToString, stylesToCSS, minifyCSS, downloadHTML, downloadCSS } from "../ExportHelpers";
import { getDefaultTagName } from "../../../shared/utils/html";
import { THEME } from "../../../shared/constants/defaultStyles";

describe("RESET_CSS", () => {
  it("ships the core reset rules", () => {
    expect(RESET_CSS).toContain("box-sizing:border-box");
    expect(RESET_CSS).toContain("*{margin:0;padding:0}");
    expect(RESET_CSS).toContain("img,picture,video,canvas,svg{display:block;max-width:100%}");
  });

  /* Elements parsed out of a template's raw HTML carry no font of their own,
     and the export links no stylesheet that would give them one — so without a
     base rule a site designed in Inter went live in Times New Roman. It looked
     right on the canvas only because the editor's own chrome font was
     cascading into it. The family is the one every created element already
     carries, so the page and its elements cannot disagree. */
  it("gives the published page the same base font every created element carries", () => {
    expect(RESET_CSS).toContain(`font-family:${THEME.fontFamily}`);
    // …and the last resort is a sans, not the browser's serif default. (Note
    // the boundary: "sans-serif" ends in "serif" — the first version of this
    // assertion failed on its own stack.)
    expect(THEME.fontFamily).toMatch(/(^|,\s*)sans-serif$/);
  });
});

describe("getDefaultTagName", () => {
  it("maps element types to semantic HTML tags", () => {
    expect(getDefaultTagName("heading")).toBe("h2");
    expect(getDefaultTagName("paragraph")).toBe("p");
    expect(getDefaultTagName("text")).toBe("span");
    expect(getDefaultTagName("link")).toBe("a");
    expect(getDefaultTagName("image")).toBe("img");
    expect(getDefaultTagName("list")).toBe("ul");
    expect(getDefaultTagName("list-item")).toBe("li");
    expect(getDefaultTagName("section")).toBe("section");
    expect(getDefaultTagName("button")).toBe("button");
  });

  it("falls back to div for unknown types", () => {
    expect(getDefaultTagName("container")).toBe("div");
    expect(getDefaultTagName("lottie")).toBe("div");
    expect(getDefaultTagName("")).toBe("div");
  });
});

describe("camelToKebab", () => {
  it("converts camelCase style keys", () => {
    expect(camelToKebab("backgroundColor")).toBe("background-color");
    expect(camelToKebab("borderTopLeftRadius")).toBe("border-top-left-radius");
    expect(camelToKebab("zIndex")).toBe("z-index");
  });

  it("leaves already-kebab and single-word keys alone", () => {
    expect(camelToKebab("color")).toBe("color");
    expect(camelToKebab("font-size")).toBe("font-size");
  });

  it("CURRENT BEHAVIOR: drops the digit->uppercase boundary (diverges from shared util)", () => {
    // This local copy uses /([a-z])([A-Z])/ while the shared util at
    // src/shared/utils/helpers/string.ts uses /([a-z0-9])([A-Z])/. A digit
    // followed by an uppercase letter therefore gets NO hyphen here:
    // shared camelToKebab("size2Xl") === "size2-xl", this one flattens it.
    // Asserting current behavior; semantic duplication between the two
    // utils is a known divergence, not fixed in a tests-only pass.
    expect(camelToKebab("size2Xl")).toBe("size2xl");
    expect(camelToKebab("translate3D")).toBe("translate3d");
  });
});

describe("escapeHTML", () => {
  it("escapes all five special characters", () => {
    expect(escapeHTML("&")).toBe("&amp;");
    expect(escapeHTML("<")).toBe("&lt;");
    expect(escapeHTML(">")).toBe("&gt;");
    expect(escapeHTML('"')).toBe("&quot;");
    expect(escapeHTML("'")).toBe("&#39;");
  });

  it("escapes a combined payload without double-escaping (& first)", () => {
    expect(escapeHTML(`<a href="x" onclick='y'>&copy;</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;copy;&lt;/a&gt;"
    );
    // Pre-escaped entities are re-escaped (input is treated as raw text).
    expect(escapeHTML("&lt;")).toBe("&amp;lt;");
  });

  it("passes through plain text and empty string", () => {
    expect(escapeHTML("hello world")).toBe("hello world");
    expect(escapeHTML("")).toBe("");
  });
});

describe("stylesToString", () => {
  it("joins kebab-cased declarations with semicolons (inline style format)", () => {
    expect(stylesToString({ backgroundColor: "red", fontSize: "12px" })).toBe(
      "background-color:red;font-size:12px"
    );
  });

  it("returns '' for an empty styles object", () => {
    expect(stylesToString({})).toBe("");
  });
});

describe("stylesToCSS", () => {
  it("emits indented multi-line declarations when not minified", () => {
    expect(stylesToCSS({ backgroundColor: "red", fontSize: "12px" }, false)).toBe(
      "  background-color: red;\n  font-size: 12px;\n"
    );
  });

  it("emits compact declarations when minified (keeps the key-value space)", () => {
    expect(stylesToCSS({ backgroundColor: "red", fontSize: "12px" }, true)).toBe(
      "background-color: red;font-size: 12px;"
    );
  });
});

describe("minifyCSS", () => {
  it("strips comments, collapses whitespace, and tightens punctuation", () => {
    const css = `
      /* header styles */
      .header {
        color : red ;
        margin : 0 auto ;
      }
    `;
    expect(minifyCSS(css)).toBe(".header{color:red;margin:0 auto;}");
  });

  it("strips multi-line comments", () => {
    expect(minifyCSS("/* a\n b\n c */.x{top:0}")).toBe(".x{top:0}");
  });

  it("tightens around commas in selectors", () => {
    expect(minifyCSS("h1 , h2 { font-weight : 700 ; }")).toBe("h1,h2{font-weight:700;}");
  });
});

describe("download helpers (DOM side effects)", () => {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:mock-url");
  const revokeObjectURL = vi.fn();
  let clicks: Array<{ href: string; download: string }>;
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let capturedBlobs: Blob[];

  beforeEach(() => {
    clicks = [];
    capturedBlobs = [];
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    createObjectURL.mockImplementation((blob: Blob) => {
      capturedBlobs.push(blob);
      return "blob:mock-url";
    });
    // jsdom has no URL.createObjectURL — install mocks.
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicks.push({ href: this.href, download: this.download });
      });
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it("downloadHTML creates a text/html blob, clicks a temp anchor, and revokes the URL", () => {
    downloadHTML("<h1>Hi</h1>");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(capturedBlobs[0].type).toBe("text/html");
    expect(clicks).toEqual([{ href: "blob:mock-url", download: "export.html" }]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    // Anchor is cleaned up from the document.
    expect(document.querySelector("a")).toBeNull();
  });

  it("downloadCSS defaults to styles.css with text/css type and honors a custom filename", () => {
    downloadCSS("body{margin:0}");
    expect(capturedBlobs[0].type).toBe("text/css");
    expect(clicks[0].download).toBe("styles.css");

    downloadCSS("body{margin:0}", "theme.css");
    expect(clicks[1].download).toBe("theme.css");
  });
});
