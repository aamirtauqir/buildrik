/**
 * ExportUtils tests — pure helpers for the export modal:
 * sanitizeHTMLForPreview, setupPreviewWindow, downloadFile.
 * (byte formatting now lives in the canonical shared number helper.)
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeHTMLForPreview,
  setupPreviewWindow,
  downloadFile,
} from "../ExportUtils";

describe("sanitizeHTMLForPreview", () => {
  it("wraps sanitized content in a full HTML document shell", () => {
    const out = sanitizeHTMLForPreview("<div>Hello</div>");
    expect(out).toBe(
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div>Hello</div></body></html>'
    );
  });

  it("removes script, iframe, object, embed, link, base and form elements", () => {
    const out = sanitizeHTMLForPreview(
      '<div>keep</div><script>alert(1)</script><iframe src="x"></iframe>' +
        '<object data="x"></object><embed src="x"><link rel="stylesheet" href="x">' +
        '<base href="x"><form action="x"><input></form>'
    );
    expect(out).toContain("<div>keep</div>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<object");
    expect(out).not.toContain("<embed");
    expect(out).not.toContain("<link");
    expect(out).not.toContain("<base");
    expect(out).not.toContain("<form");
  });

  it("strips on* event handler attributes but keeps the element", () => {
    const out = sanitizeHTMLForPreview('<div onclick="evil()" onmouseover="evil()">Hi</div>');
    expect(out).toContain(">Hi</div>");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onmouseover");
  });

  it("strips srcdoc attributes", () => {
    const out = sanitizeHTMLForPreview('<div srcdoc="<script>x</script>">Hi</div>');
    expect(out).not.toContain("srcdoc");
    expect(out).toContain(">Hi</div>");
  });

  it("strips src/href using javascript:, data: and vbscript: protocols", () => {
    const out = sanitizeHTMLForPreview(
      '<img src="javascript:alert(1)"><a href="data:text/html,x">a</a>' +
        '<a href="vbscript:msgbox">b</a>'
    );
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("data:");
    expect(out).not.toContain("vbscript:");
    // Elements themselves survive.
    expect(out).toContain("<img");
    expect(out).toContain(">a</a>");
  });

  it("strips forbidden protocols case-insensitively", () => {
    const out = sanitizeHTMLForPreview('<img SRC="JavaScript:alert(1)">');
    expect(out.toLowerCase()).not.toContain("javascript:");
  });

  it("keeps http/https src and href attributes", () => {
    const out = sanitizeHTMLForPreview(
      '<img src="https://example.com/a.png"><a href="http://example.com">x</a>'
    );
    expect(out).toContain('src="https://example.com/a.png"');
    expect(out).toContain('href="http://example.com"');
  });

  it("strips style attributes containing url( or expression (whitespace-collapsed)", () => {
    const out = sanitizeHTMLForPreview(
      '<div style="background:url(http://evil)">a</div>' +
        '<div style="width: e x p r e s s i o n (1)">b</div>'
    );
    expect(out).not.toContain("style=");
  });

  it("keeps safe style attributes", () => {
    const out = sanitizeHTMLForPreview('<div style="color:red">a</div>');
    expect(out).toContain('style="color:red"');
  });

  it("falls back to a placeholder document when parsing throws", () => {
    const realDOMParser = globalThis.DOMParser;
    vi.stubGlobal(
      "DOMParser",
      class {
        parseFromString(): never {
          throw new Error("boom");
        }
      }
    );
    try {
      expect(sanitizeHTMLForPreview("<div>x</div>")).toBe(
        "<!DOCTYPE html><html><body>Preview unavailable</body></html>"
      );
    } finally {
      vi.unstubAllGlobals();
      expect(globalThis.DOMParser).toBe(realDOMParser);
    }
  });
});

describe("setupPreviewWindow", () => {
  it("clears the target document and mounts a sandboxed srcdoc iframe", () => {
    const doc = document.implementation.createHTMLDocument("old title");
    doc.head.appendChild(doc.createElement("style"));
    doc.body.appendChild(doc.createElement("p"));
    const fakeWindow = { document: doc } as unknown as Window;

    setupPreviewWindow(fakeWindow, "<h1>Preview</h1>");

    // Pre-seeded head content is cleared (the title setter re-creates a
    // fresh <title> element afterwards — that is the only head child left).
    expect(doc.head.querySelector("style")).toBeNull();
    expect([...doc.head.children].map((el) => el.tagName)).toEqual(["TITLE"]);
    expect(doc.body.childNodes).toHaveLength(1);

    const iframe = doc.body.firstChild as HTMLIFrameElement;
    expect(iframe.tagName).toBe("IFRAME");
    // Pin the exact sandbox contract — no allow-scripts.
    expect(iframe.getAttribute("sandbox")).toBe(
      "allow-same-origin allow-forms allow-pointer-lock"
    );
    expect(iframe.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(iframe.srcdoc).toBe("<h1>Preview</h1>");
    expect(iframe.style.width).toBe("100%");
    expect(iframe.style.height).toBe("100vh");
    expect(doc.title).toBe("Buildrick Preview");
  });
});

describe("downloadFile", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const revokeObjectURL = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let clicked: Array<{ download: string; href: string; inBody: boolean }>;

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clicked = [];
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({
          download: this.download,
          href: this.href,
          inBody: document.body.contains(this),
        });
      });
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it("creates a typed blob URL, clicks a temp anchor and revokes the URL", () => {
    downloadFile("<html></html>", "index.html", "text/html");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (createObjectURL.mock.calls[0] as unknown[])[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/html");

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe("index.html");
    expect(clicked[0].href).toContain("blob:mock-url");
    // Anchor is attached to the body at click time…
    expect(clicked[0].inBody).toBe(true);
    // …and removed afterwards.
    expect(document.body.querySelector("a")).toBeNull();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  /* The preview's whole claim is "this is what a visitor sees". The rebuilt
     head carried nothing but a charset, so the page's own stylesheet was
     dropped and the preview showed unstyled HTML — while the published page
     shipped the CSS. */
  it("keeps the page's stylesheet", () => {
    const out = sanitizeHTMLForPreview(
      "<!DOCTYPE html><html><head><style>body{font-family:Inter, sans-serif}</style></head><body><h1>Hi</h1></body></html>",
    );
    expect(out).toContain("font-family:Inter, sans-serif");
    expect(out).toContain("<h1>Hi</h1>");
  });

  it("still refuses a sheet carrying the tokens it refuses in a style attribute", () => {
    const out = sanitizeHTMLForPreview(
      "<!DOCTYPE html><html><head><style>body{background:url(http://x/y.png)}</style></head><body>x</body></html>",
    );
    expect(out).not.toContain("url(");
  });
});