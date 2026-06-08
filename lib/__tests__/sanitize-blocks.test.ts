/**
 * sanitize-blocks — server-side defense-in-depth for the Page.blocks element
 * tree. The editor sanitizes on import/serialize, but a direct API write could
 * still persist hostile blocks. This strips dangerous markup at the write
 * boundary so the stored tree is clean at rest.
 */
import { describe, it, expect } from "vitest";
import { sanitizeBlocks } from "../sanitize-blocks";

describe("sanitizeBlocks", () => {
  it("strips on* event-handler attribute keys", () => {
    const blocks = {
      id: "r",
      type: "image",
      tagName: "img",
      attributes: { src: "x", onerror: "alert(1)", onclick: "y" },
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("onerror");
    expect(blocks.attributes).not.toHaveProperty("onclick");
    expect(blocks.attributes.src).toBe("x");
  });

  it("strips javascript: URLs from URL attributes", () => {
    const blocks = { id: "r", type: "link", tagName: "a", attributes: { href: "javascript:alert(1)" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("href");
  });

  it("sanitizes content HTML (removes onerror, keeps text)", () => {
    const blocks = { id: "r", type: "text", tagName: "p", content: '<img src=x onerror="alert(1)">PWNED' };
    sanitizeBlocks(blocks);
    expect(blocks.content).not.toMatch(/onerror/i);
    expect(blocks.content).toContain("PWNED");
  });

  it("recurses into children", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      children: [{ id: "c", type: "text", tagName: "p", content: '<b onmouseover="x">hi</b>' }],
    };
    sanitizeBlocks(blocks);
    expect(blocks.children[0].content).not.toMatch(/onmouseover/i);
  });

  it("handles array roots and non-object input without throwing", () => {
    expect(() => sanitizeBlocks(null)).not.toThrow();
    expect(() => sanitizeBlocks("str")).not.toThrow();
    expect(() => sanitizeBlocks(undefined)).not.toThrow();
    const arr = [{ id: "a", type: "text", tagName: "p", attributes: { onclick: "x", title: "ok" } }];
    sanitizeBlocks(arr);
    expect(arr[0].attributes).not.toHaveProperty("onclick");
    expect(arr[0].attributes.title).toBe("ok");
  });

  it("keeps safe content, URLs, and editor attributes", () => {
    const blocks = {
      id: "r",
      type: "link",
      tagName: "a",
      attributes: { href: "https://example.com", "data-buildrick-id": "el1", style: "color: red" },
      content: "<b>Hi</b>",
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes.href).toBe("https://example.com");
    expect(blocks.attributes["data-buildrick-id"]).toBe("el1");
    expect(blocks.content).toContain("<b>Hi</b>");
  });
});
