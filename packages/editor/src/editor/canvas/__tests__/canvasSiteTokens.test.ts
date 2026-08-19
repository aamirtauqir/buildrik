import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { contentStyles } from "../canvasStyles";

/**
 * The canvas painted customer content in the EDITOR's chrome tokens: the UI
 * font and ink inline on the mount div, and the UI font plus a 13px UI type
 * size on the page root and every container. Nearer than anything the site
 * could set, so the Brand panel's font slots moved a CSS variable and changed
 * nothing on screen — measured live, `--buildrick-design-font-heading` on
 * Georgia with the heading still in the UI font.
 *
 * `--bk-*` is chrome. It does not belong on the customer's page.
 */
const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(
  resolve(here, "../../../themes/design-system/site-content.css"),
  "utf8"
);
const canvasCss = readFileSync(resolve(here, "../Canvas.css"), "utf8");

describe("the canvas draws the site's tokens, not the editor's", () => {
  it("does not dress customer content in chrome tokens from inline styles", () => {
    // Inline beats every stylesheet, so a chrome token here is unanswerable
    // by the site. The site's own defaults come from site-content.css.
    expect(contentStyles.fontFamily).toBeUndefined();
    expect(contentStyles.color).toBeUndefined();
    expect(JSON.stringify(contentStyles)).not.toContain("--bk-");
  });

  it("keeps the site's defaults out of chrome CSS", () => {
    // Gate 3 bans --buildrick-design-* consumers under src/editor; these rules
    // belong to the site-builder DS, which is a different domain.
    expect(canvasCss).not.toContain("--buildrick-design-");
  });

  it("gives the page root and containers the site's type, not the UI's", () => {
    const rule = css.match(
      /\.buildrick-page-root,\s*\n\[data-buildrick-type="container"\] \{[^}]*\}/
    )?.[0];
    expect(rule).toBeTruthy();
    expect(rule).not.toContain("--bk-");
    expect(rule).toContain("var(--buildrick-design-font-body)");
    expect(rule).toContain("var(--buildrick-design-font-size-base)");
    expect(rule).toContain("var(--buildrick-design-color-text)");
  });

  it("binds the heading slot to what the editor actually mounts", () => {
    // Headings render as DIVs carrying data-buildrick-type, so a tag-only
    // selector reaches none of them.
    expect(css).toContain('.buildrick-canvas [data-buildrick-type="heading"]');
  });
});
