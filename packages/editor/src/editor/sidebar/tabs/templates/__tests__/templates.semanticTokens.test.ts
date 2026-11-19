// @vitest-environment jsdom
/**
 * L4-024 (owner 2026-10-10): templates inserted literal colours, so after
 * applying one every Brand token read "unused" and a Brand edit restyled
 * nothing the template put on the page. The built-in templates are authored
 * on the semantic Brand tokens, and what a template inserts stays connected:
 * a `{{token.…}}` placeholder (a saved template's) resolves to the token's
 * own `var()`, not a copy of today's value. Content already on a page is not
 * touched.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { SITE_TEMPLATES } from "../templatesData";
import { resolveTokens } from "../utils/resolveTemplateTokens";
import { snapshotVars } from "../utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";

const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
const SEMANTIC = /var\(--buildrick-design-color-(background|surface-muted|text|text-subtle|muted|primary|accent|on-primary|border)\)/;

describe("built-in templates are authored on semantic Brand tokens (L4-024)", () => {
  it.each(SITE_TEMPLATES.map((t) => [t.name, t.html]))("%s carries no literal colour", (_name, html) => {
    const literals = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]).filter((s) => LITERAL.test(s));
    expect(literals).toEqual([]);
    expect(html).toMatch(SEMANTIC);
    expect(html).not.toContain("{{token.");
  });
});

describe("a template's placeholders stay connected when applied", () => {
  it("resolves {{token.color.primary}} to the token's var(), not its value", () => {
    const snapshot = snapshotVars(DEFAULT_TOKENS);
    const out = resolveTokens('<a style="color:{{token.color.primary}}">x</a>', snapshot);
    expect(out).toContain("color:var(--buildrick-design-color-primary)");
  });

  it("a placeholder for a token with no CSS variable still resolves to its value", () => {
    const tokens = [{ ...DEFAULT_TOKENS.find((t) => t.id === "color-primary")!, cssVar: "" }];
    const snapshot = snapshotVars(tokens);
    expect(resolveTokens('<a style="color:{{token.color.primary}}">x</a>', snapshot)).not.toContain("{{token");
  });
});
