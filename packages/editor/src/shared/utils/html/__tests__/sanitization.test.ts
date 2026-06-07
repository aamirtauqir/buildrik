/**
 * sanitizeHTML — security + editor-preservation contract.
 *
 * XSS invariants: dangerous markup never survives the sanitizer.
 * Preservation invariants: the editor's canvas depends on data-buildrick-*,
 * class, and style attributes for selection/overlays, and stock blocks depend
 * on form/SVG attributes surviving the round-trip — the sanitizer must keep them.
 */
import { describe, it, expect } from "vitest";
import { sanitizeHTML } from "../sanitization";

describe("sanitizeHTML — XSS invariants", () => {
  it("strips on* event-handler attributes", () => {
    const out = sanitizeHTML('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
  });

  it("removes <script> elements", () => {
    const out = sanitizeHTML("<div>hi<script>alert(1)</script></div>");
    expect(out).not.toMatch(/<script/i);
  });

  it("strips javascript: URLs from anchor href", () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("strips javascript: from svg xlink:href", () => {
    const out = sanitizeHTML('<svg><use xlink:href="javascript:alert(1)"></use></svg>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("blocks data:text/html URLs", () => {
    const out = sanitizeHTML('<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>');
    expect(out).not.toMatch(/data:text\/html/i);
  });

  it("strips non-media data: URLs from anchor href", () => {
    const out = sanitizeHTML('<a href="data:text/plain;base64,SGk=">x</a>');
    expect(out).not.toMatch(/data:/i);
  });
});

describe("sanitizeHTML — editor preservation invariants", () => {
  it("preserves data-buildrick-id, class, and style (canvas selection depends on these)", () => {
    const out = sanitizeHTML('<div data-buildrick-id="el1" class="x" style="color: red">hi</div>');
    expect(out).toMatch(/data-buildrick-id="el1"/);
    expect(out).toMatch(/class="x"/);
    expect(out).toMatch(/red/);
  });

  it("preserves form control attributes (stock blocks round-trip)", () => {
    const out = sanitizeHTML('<input type="text" placeholder="Name" name="full">');
    expect(out).toMatch(/type="text"/);
    expect(out).toMatch(/placeholder="Name"/);
  });

  it("preserves svg path geometry", () => {
    const out = sanitizeHTML('<svg viewBox="0 0 10 10"><path d="M0 0L10 10" fill="red"></path></svg>');
    expect(out).toMatch(/d="M0 0L10 10"/);
  });

  it("preserves data:image/png on img src", () => {
    const out = sanitizeHTML('<img src="data:image/png;base64,iVBORw0KGgo=">');
    expect(out).toMatch(/data:image\/png/);
  });
});
