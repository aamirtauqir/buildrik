/**
 * elementDataToHTML / buildAttributeString — attribute safety.
 *
 * The serializer turns ElementData into the HTML string mounted on the canvas
 * via dangerouslySetInnerHTML. It must be safe by construction: never emit an
 * event-handler attribute name, a dangerous URL scheme, or a dangerous CSS
 * declaration — even when the ElementData bypassed the import-time sanitizer
 * (programmatic mutation, restored history, etc.). Editor structural attributes
 * (data-buildrick-*, class, valid style) must survive.
 */
import { describe, it, expect } from "vitest";
import { elementDataToHTML } from "../generation";
import type { ElementData } from "../../../types";

function el(partial: Partial<ElementData>): ElementData {
  return { id: "el1", type: "container", ...partial };
}

describe("elementDataToHTML — attribute safety", () => {
  it("drops on* event-handler attributes", () => {
    const out = elementDataToHTML(el({ tagName: "img", attributes: { src: "x", onerror: "alert(1)" } }));
    expect(out).toMatch(/src="x"/);
    expect(out).not.toMatch(/onerror/i);
  });

  it("drops boolean-style on* attributes (empty value)", () => {
    const out = elementDataToHTML(el({ tagName: "svg", attributes: { onload: "" } }));
    expect(out).not.toMatch(/onload/i);
  });

  it("drops javascript: URLs from href", () => {
    const out = elementDataToHTML(el({ tagName: "a", attributes: { href: "javascript:alert(1)" } }));
    expect(out).not.toMatch(/javascript:/i);
  });

  it("drops a style attribute carrying a CSS expression() payload", () => {
    const out = elementDataToHTML(el({ tagName: "div", attributes: { style: "width: expression(alert(1))" } }));
    expect(out).not.toMatch(/expression/i);
  });

  it("drops a data.styles declaration carrying expression()", () => {
    const out = elementDataToHTML(el({ tagName: "div", styles: { width: "expression(alert(1))" } }));
    expect(out).not.toMatch(/expression/i);
  });
});

describe("elementDataToHTML — preservation", () => {
  it("keeps safe attributes and URLs", () => {
    const out = elementDataToHTML(
      el({ tagName: "a", attributes: { href: "https://example.com", title: "hi", target: "_blank" } })
    );
    // escapeAttr entity-escapes '/' (harmless — the browser decodes it), so
    // assert the scheme + host survive rather than a literal slash match.
    expect(out).toMatch(/href="https:/);
    expect(out).toContain("example.com");
    expect(out).toMatch(/title="hi"/);
    expect(out).toMatch(/target="_blank"/);
  });

  it("keeps editor structural attributes (data-buildrick-*, class, style)", () => {
    const out = elementDataToHTML(el({ tagName: "div", classes: ["card"], styles: { color: "red" } }), {
      includeDataAttributes: true,
    });
    expect(out).toMatch(/data-buildrick-id="el1"/);
    expect(out).toMatch(/class="card"/);
    expect(out).toMatch(/red/);
  });
});
