/**
 * "Quick preview" is the one surface whose whole job is "this is what a
 * visitor sees", and it showed the page without its fonts.
 *
 * Two layers, both by construction: `Composer.exportHTML` built its own head
 * with no font links, and `sanitizeHTMLForPreview` REBUILDS the head from the
 * elements it collects — so anything not collected is gone whatever the
 * element filter allows. The same shape once dropped every <style>; the
 * comment about that fix is still in the file.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { sanitizeHTMLForPreview } from "../ExportUtils";

const withHead = (head: string) =>
  `<!DOCTYPE html><html><head>${head}</head><body><p>hi</p></body></html>`;

describe("preview keeps the site's fonts and nothing else external", () => {
  it("carries the Google Fonts stylesheet through", () => {
    const out = sanitizeHTMLForPreview(
      withHead('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora&display=swap">')
    );
    expect(out).toContain("fonts.googleapis.com/css2?family=Lora");
  });

  it("still drops a stylesheet from anywhere else", () => {
    const out = sanitizeHTMLForPreview(
      withHead('<link rel="stylesheet" href="https://evil.example.com/x.css">')
    );
    expect(out).not.toContain("evil.example.com");
  });

  it("drops a non-stylesheet link even on the allowed host", () => {
    const out = sanitizeHTMLForPreview(
      withHead('<link rel="import" href="https://fonts.googleapis.com/anything">')
    );
    expect(out).not.toContain("fonts.googleapis.com/anything");
  });

  it("cannot be talked into closing the tag it is written into", () => {
    const out = sanitizeHTMLForPreview(
      withHead('<link rel="stylesheet" href=\'https://fonts.googleapis.com/a"><script>x()</script>\'>')
    );
    expect(out).not.toContain("<script");
  });

  it("still removes scripts, iframes and forms", () => {
    const out = sanitizeHTMLForPreview(
      '<!DOCTYPE html><html><body><script>x()</script><iframe></iframe><form></form><p>hi</p></body></html>'
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<form");
    expect(out).toContain("hi");
  });

  it("keeps the page's own <style>, which this rebuild once dropped", () => {
    const out = sanitizeHTMLForPreview(withHead("<style>.a{color:red}</style>"));
    expect(out).toContain(".a{color:red}");
  });
});

/* Clone 3721:43423 (Fonts round trip): an ADDED site font is declared in the
   document's own `<style>` as `@font-face { src: url("https://…woff2") }`.
   The sheet filter drops any `<style>` carrying `url(` — so the whole
   stylesheet went with it and the preview lost every rule (seen live
   2026-09-14, Quick preview with Inter Var on a heading). A face whose every
   url is https is the site's own font; anything else in a face is still out. */
describe("preview keeps the site's own @font-face", () => {
  const face = '@font-face{font-family:"Inter Var";src:url("https://cdn.example/inter-var.woff2") format("woff2");font-display:swap}';

  it("keeps an https @font-face and the rest of the sheet it sits in", () => {
    const out = sanitizeHTMLForPreview(withHead(`<style>${face}h1{color:red}</style>`));
    expect(out).toContain('src:url("https://cdn.example/inter-var.woff2")');
    expect(out).toContain("h1{color:red}");
  });

  it("drops a face pointing anywhere but https, and keeps the sheet around it", () => {
    const bad = '@font-face{font-family:"X";src:url("javascript:alert(1)")}';
    const out = sanitizeHTMLForPreview(withHead(`<style>${bad}h1{color:red}</style>`));
    expect(out).not.toContain("javascript:");
    expect(out).toContain("h1{color:red}");
  });

  it("still drops a url() outside a @font-face", () => {
    const out = sanitizeHTMLForPreview(withHead('<style>h1{background:url("https://x/y.png")}</style>'));
    expect(out).not.toContain("y.png");
  });
});
