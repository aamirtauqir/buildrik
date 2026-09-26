/**
 * Server-side sanitizer for stored element trees (Page.blocks, component
 * masters, version snapshots) and user-template markup.
 *
 * Defense-in-depth at the write boundary: the editor already sanitizes on
 * import/serialize, but a direct API write (or a pre-fix client) could persist
 * hostile blocks. This walks the stored tree and removes what turns into XSS
 * when blocks are rendered to HTML:
 *   - `tagName` not on the shared allowlist (or malformed, e.g.
 *     "img src=x onerror=… x") → "div", content kept
 *   - element rich-text `content` → sanitized with DOMPurify (isomorphic)
 *   - `styles` / `breakpointStyles` → declarations that could leave the
 *     published <style> (`isSafeCssDeclaration`)
 *   - `attributes` → malformed names, `srcdoc`, on* event handlers, and
 *     javascript:/vbscript:/non-image data: URL values are dropped
 *     (`isDangerousUrl`, shared with the editor)
 *   - `id` → a fresh one when it is not a plain word (`isSafeElementId`): it
 *     is written into selectors and class attributes
 * and, for project-level style rules (`sanitizeProjectStyles`), a rule whose
 * selector or media query could leave the stylesheet is dropped.
 *
 * The tag/attribute rules are `@buildrik/shared/schemas/element-markup`, the
 * same list the editor applies, so the two sides cannot drift.
 *
 * Mutates in place (the caller writes the tree straight to the DB, so cloning
 * would only add cost) and returns the same reference. Input is untrusted JSON
 * of unknown shape — every access is guarded.
 *
 * Import this file directly from server code only — it pulls in jsdom via
 * isomorphic-dompurify and must never reach the client bundle.
 */
import { randomUUID } from "node:crypto";
import DOMPurify, { type UponSanitizeElementHook, type UponSanitizeAttributeHook } from "isomorphic-dompurify";
import {
  FORBIDDEN_ATTRIBUTES,
  cssValueHasDangerousUrl,
  URL_ATTRIBUTES,
  isAllowedElementTag,
  isDangerousUrl,
  isSafeCssDeclaration,
  isSafeElementId,
  isSafeStyleRuleTarget,
  isValidAttributeName,
  withSafeTargets,
  srcsetCandidates,
  srcsetUrls,
} from "@buildrik/shared/schemas/element-markup";

/** Why a node was changed — reported to `onChange` for the dry-run count. */
export type SanitizeReason =
  | "tag"
  | "content"
  | "attr-name"
  | "attr-forbidden"
  | "attr-event-handler"
  | "attr-url"
  | "override"
  | "style"
  | "style-rule"
  | "id";

export type OnSanitizeChange = (reason: SanitizeReason, detail: string) => void;

/**
 * As the editor's sanitizeHTML: DOMPurify drops `target` by default, which
 * stripped "open in new tab" from every stored rich-text link. It is kept, and
 * every link that has it gets rel="noopener noreferrer".
 */
function purify(html: string): string {
  const config = { ADD_ATTR: ["target"] };
  return withSafeTargets(String(DOMPurify.sanitize(html, config)), (clean) =>
    DOMPurify.sanitize(clean, { ...config, RETURN_DOM_FRAGMENT: true })
  );
}

const EVENT_HANDLER_ATTR = /^on/i;
function unsafeAttributeReason(name: string, value: string): SanitizeReason | null {
  if (!isValidAttributeName(name)) return "attr-name";
  const lower = name.toLowerCase();
  if (FORBIDDEN_ATTRIBUTES.has(lower)) return "attr-forbidden";
  if (EVENT_HANDLER_ATTR.test(name)) return "attr-event-handler";
  if (URL_ATTRIBUTES.has(lower)) {
    const urls = lower === "srcset" ? srcsetUrls(value) : [value];
    if (urls.some(isDangerousUrl)) return "attr-url";
  }
  return null;
}

/** Drop unsafe entries from an attribute map in place. */
function sanitizeAttributeMap(attrs: unknown, onChange?: OnSanitizeChange): void {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return;
  const map = attrs as Record<string, unknown>;
  for (const key of Object.keys(map)) {
    const raw = map[key];
    const reason = unsafeAttributeReason(key, typeof raw === "string" ? raw : "");
    if (reason) {
      onChange?.(reason, key);
      delete map[key];
    }
  }
}

/**
 * A component instance's stored overrides (`data.componentInstance.overrides`,
 * `#/<elementPath>/<type>/<property>` ops) are written into the cloned master
 * on every sync, so they get the same rules: content sanitized, an unsafe
 * attribute override (or one with a non-string value) removed.
 */
function sanitizeInstanceOverrides(data: unknown, onChange?: OnSanitizeChange): void {
  const instance = asRecord(asRecord(data)?.componentInstance);
  if (!instance || instance.overrides === undefined) return;
  // An entry that is not an op (or a list that is not a list) threw in every
  // editor reader, so it is removed rather than skipped.
  if (!Array.isArray(instance.overrides)) {
    onChange?.("override", "overrides is not a list");
    instance.overrides = [];
    return;
  }
  const overrides: unknown[] = instance.overrides;
  for (let i = overrides.length - 1; i >= 0; i--) {
    const op = asRecord(overrides[i]);
    if (!op || typeof op.path !== "string") {
      onChange?.("override", "not an op");
      overrides.splice(i, 1);
      continue;
    }
    const parts = op.path.split("/");
    const property = parts[parts.length - 1] ?? "";
    const type = parts[parts.length - 2];
    if (type === "content") {
      if (typeof op.value !== "string") {
        onChange?.("override", op.path);
        overrides.splice(i, 1);
        continue;
      }
      const clean = purify(op.value);
      if (clean !== op.value) onChange?.("override", op.path);
      op.value = clean;
    } else if (type === "attribute") {
      if (typeof op.value !== "string" || unsafeAttributeReason(property, op.value)) {
        onChange?.("override", op.path);
        overrides.splice(i, 1);
      }
    }
  }
}

/** Drop declarations that could leave a published page's <style> (in place). */
function sanitizeStyleMap(styles: unknown, onChange?: OnSanitizeChange): void {
  const map = asRecord(styles);
  if (!map) return;
  for (const key of Object.keys(map)) {
    if (!isSafeCssDeclaration(key, map[key])) {
      onChange?.("style", `${key}: ${String(map[key]).slice(0, 60)}`);
      delete map[key];
    }
  }
}

const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;

function sanitizeNode(node: Record<string, unknown>, onChange?: OnSanitizeChange): void {
  // Regenerated, not dropped: the node and its content stay. A rule or binding
  // naming the old id could not have been a safe selector anyway.
  if (node.id !== undefined && !isSafeElementId(node.id)) {
    onChange?.("id", String(node.id).slice(0, 60));
    node.id = `el-${randomUUID()}`;
  }

  if (node.tagName != null && node.tagName !== "" && !isAllowedElementTag(node.tagName)) {
    onChange?.("tag", String(node.tagName));
    node.tagName = "div";
  }

  if (typeof node.content === "string" && node.content.length > 0) {
    const clean = purify(node.content);
    if (onChange && clean !== node.content) onChange("content", node.content.slice(0, 80));
    node.content = clean;
  }

  sanitizeAttributeMap(node.attributes, onChange);
  sanitizeInstanceOverrides(node.data, onChange);
  sanitizeStyleMap(node.styles, onChange);
  const breakpoints = asRecord(node.breakpointStyles);
  if (breakpoints) for (const bp of BREAKPOINTS) sanitizeStyleMap(breakpoints[bp], onChange);

  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === "object") sanitizeNode(child as Record<string, unknown>, onChange);
    }
  }
}

/**
 * Sanitize a blocks tree (single root node or an array of nodes) in place.
 * Non-object input is returned untouched.
 */
export function sanitizeBlocks<T>(blocks: T, onChange?: OnSanitizeChange): T {
  if (Array.isArray(blocks)) {
    for (const node of blocks) {
      if (node && typeof node === "object") sanitizeNode(node as Record<string, unknown>, onChange);
    }
  } else if (blocks && typeof blocks === "object") {
    sanitizeNode(blocks as Record<string, unknown>, onChange);
  }
  return blocks;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/**
 * A component master (engine ComponentDefinition): its `masterTree`, and the
 * `attributeOverrides` each variant lays onto that tree's elements.
 */
export function sanitizeComponentPayload<T>(payload: T, onChange?: OnSanitizeChange): T {
  const def = asRecord(payload);
  if (!def) return payload;
  sanitizeBlocks(def.masterTree, onChange);
  if (Array.isArray(def.variants)) {
    for (const variant of def.variants) sanitizeAttributeMap(asRecord(variant)?.attributeOverrides, onChange);
  }
  return payload;
}

/**
 * Project-level style rules (Site.projectStyles, a snapshot's `styles`):
 * StyleEngine rules `{ id, selector, properties, mediaQuery? }`, written as
 * `${selector} {` inside `@media ${mediaQuery}` into the published stylesheet.
 * A rule whose selector or media query is outside the shared grammar is
 * removed; a kept rule's declarations get the element-style rule. Entries with
 * no selector at all (legacy design-token rows) are not style rules and are
 * left as they are — the editor skips them on load. In place.
 */
export function sanitizeProjectStyles<T>(styles: T, onChange?: OnSanitizeChange): T {
  if (!Array.isArray(styles)) return styles;
  const rules: unknown[] = styles;
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = asRecord(rules[i]);
    if (!rule || (rule.selector === undefined && rule.mediaQuery === undefined)) continue;
    if (!isSafeStyleRuleTarget(rule.selector, rule.mediaQuery)) {
      onChange?.("style-rule", `${String(rule.selector).slice(0, 60)} @ ${String(rule.mediaQuery ?? "")}`);
      rules.splice(i, 1);
      continue;
    }
    sanitizeStyleMap(rule.properties, onChange);
  }
  return styles;
}

/** A version (engine NamedVersion): every page root and style rule in its project snapshot. */
export function sanitizeVersionPayload<T>(payload: T, onChange?: OnSanitizeChange): T {
  const snapshot = asRecord(asRecord(payload)?.snapshot);
  const pages = snapshot?.pages;
  if (Array.isArray(pages)) {
    for (const page of pages) sanitizeBlocks(asRecord(page)?.root, onChange);
  }
  if (snapshot) sanitizeProjectStyles(snapshot.styles, onChange);
  return payload;
}

/** A saved user template's exported page markup. */
export function sanitizeTemplateHtml(html: string): string {
  return purify(html);
}

// ── Generated-page HTML sanitizer (controller review round 2) ──────────────
//
// A regex "is this substitution inside a URL attribute" detector (round 1's
// fix) is bypassable: unquoted attributes, a later `srcset` candidate,
// `style="background:url(...)"`, and case all need real HTML parsing to
// resolve correctly (verified live — each of those four shapes got through).
// This runs the WHOLE generated page through DOMPurify (a real parser, so
// quoting/case/whitespace stop being the caller's problem) instead of
// pattern-matching context. `isDangerousUrl` and `srcsetUrls` are the same
// helpers `unsafeAttributeReason` above uses for the blocks tree (SSOT,
// `@buildrik/shared/schemas/element-markup`) — this function only adds what
// that one doesn't need: a whole-DOCUMENT pass (not a JSON attribute map), a
// force-allow-everything hook set (a template's markup is already trusted —
// this exists only to catch a dangerous URL a SUBSTITUTION introduced, not to
// re-litigate which tags a page may contain, the way the tag/attribute
// allowlist does for untrusted stored trees), and keeping a SAFE srcset
// candidate instead of dropping the whole attribute the way
// `unsafeAttributeReason` does (round 2's own test asserts the safe candidate
// survives).

/** Each `srcset` candidate is `<url> [descriptor]`; a dangerous URL can sit
 *  in any candidate, not just the first. The safe candidates are kept. */
function sanitizeSrcsetValue(value: string): string {
  return srcsetCandidates(value)
    .filter((candidate) => !srcsetUrls(candidate).some(isDangerousUrl))
    .join(", ");
}

// `<script>`/`<style>` content is raw text a browser never parses as HTML —
// but DOMPurify's underlying parser can still misparse a `<`-containing JS/CSS
// string INSIDE one (e.g. `var s = "<b>";`) and drop the whole element. Their
// content is never CMS-influenced (the substitution step that runs before
// this already excludes script/style spans), so there's nothing to sanitize
// inside them — swap each span for a `<style>` placeholder (valid in both
// <head> and <body>, so it can't be foster-parented to the wrong place the
// way a bare text placeholder would be) before sanitizing, then restore the
// original span verbatim afterward.
const SCRIPT_STYLE_SPAN_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const SPAN_PLACEHOLDER = (i: number) => `<style>/*BD_DYNPAGE_SPAN_${i}*/</style>`;
const SPAN_PLACEHOLDER_RE = /<style>\/\*BD_DYNPAGE_SPAN_(\d+)\*\/<\/style>/g;

/**
 * Sanitize a fully-substituted CMS dynamic-page HTML document. Every
 * tag/attribute NAME is force-allowed (the template's own markup is already
 * trusted — sanitized at the S-1 write boundary when it was saved — this
 * pass exists only to catch a dangerous URL a template substitution
 * introduced, never to re-litigate which tags a page may contain); `on*`
 * event-handler attributes are the one exception, left to DOMPurify's
 * default stripping. A URL-bearing attribute (`URL_ATTRIBUTES` — href/src/
 * action/formaction/poster/xlink:href), each `srcset` candidate, and a
 * `style` value containing a dangerous `url()` are checked with
 * `isDangerousUrl` and blanked if unsafe. DOCTYPE is preserved manually —
 * DOMPurify's WHOLE_DOCUMENT mode drops it.
 */
export function sanitizeGeneratedPageHtml(html: string): string {
  const spans: string[] = [];
  const withPlaceholders = html.replace(SCRIPT_STYLE_SPAN_RE, (match) => {
    const token = SPAN_PLACEHOLDER(spans.length);
    spans.push(match);
    return token;
  });

  const doctypeMatch = withPlaceholders.match(/^\s*<!DOCTYPE[^>]*>/i);
  const doctype = doctypeMatch ? doctypeMatch[0] : "";
  const body = doctypeMatch ? withPlaceholders.slice(doctypeMatch[0].length) : withPlaceholders;

  const elementHook: UponSanitizeElementHook = (_currentNode, data) => {
    data.allowedTags[data.tagName] = true;
  };
  const attributeHook: UponSanitizeAttributeHook = (_currentNode, data) => {
    const name = data.attrName.toLowerCase();
    if (EVENT_HANDLER_ATTR.test(name)) return; // defense-in-depth: keep DOMPurify's default strip
    data.allowedAttributes[name] = true;
    if (name === "srcset") {
      data.attrValue = sanitizeSrcsetValue(data.attrValue);
    } else if (name === "style") {
      // The whole value is dropped rather than one url() cut out of it: this
      // is a raw attribute string, and rewriting it declaration by declaration
      // would reformat values that were never unsafe.
      if (cssValueHasDangerousUrl(data.attrValue)) data.attrValue = "";
    } else if (URL_ATTRIBUTES.has(name) && isDangerousUrl(data.attrValue)) {
      data.attrValue = "";
    }
  };

  DOMPurify.addHook("uponSanitizeElement", elementHook);
  DOMPurify.addHook("uponSanitizeAttribute", attributeHook);
  let sanitized: string;
  try {
    sanitized = String(DOMPurify.sanitize(body, { WHOLE_DOCUMENT: true }));
  } finally {
    DOMPurify.removeHook("uponSanitizeElement");
    DOMPurify.removeHook("uponSanitizeAttribute");
  }

  const restored = (doctype ? `${doctype}${sanitized}` : sanitized).replace(SPAN_PLACEHOLDER_RE, (_m, i: string) => {
    const span = spans[Number(i)];
    return span ?? "";
  });
  return restored;
}
