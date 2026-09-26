import { z } from "zod";

/**
 * What a stored element tree may render as — the one list the server write
 * boundary (`lib/sanitize-blocks.ts`) and the editor (`Element.getTagName`,
 * `sanitizeElementTreeContent`, `buildAttributeString`) both apply.
 *
 * A tree's `tagName` and attribute names are emitted raw into markup
 * (`<${tag}${attrs}>`), so a stored `tagName: "img src=x onerror=alert(1) x"`
 * or an attribute named `x onerror=… y` injected a handler into the canvas,
 * which renders on the app origin (audit A19-1). Both sides used to trust
 * those strings; the server did not look at `tagName` at all and kept
 * `srcdoc`. One list here, so the two sides cannot drift apart.
 *
 * An unknown or malformed tag becomes "div" (content kept), never dropped.
 */

/** Lower-case. SVG names are camelCase in markup; compare case-insensitively. */
export const ALLOWED_ELEMENT_TAGS: ReadonlySet<string> = new Set([
  "a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo",
  "blockquote", "br", "button", "caption", "cite", "code", "col", "colgroup",
  "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt",
  "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hgroup", "hr", "i", "img", "input", "ins", "kbd",
  "label", "legend", "li", "main", "mark", "menu", "meter", "nav", "ol",
  "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp",
  "rt", "ruby", "s", "samp", "search", "section", "select", "small", "source",
  "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "textarea",
  "tfoot", "th", "thead", "time", "tr", "track", "u", "ul", "var", "video", "wbr",
  // SVG: the top-level <svg> and the shape/paint children icons are made of.
  "svg", "circle", "ellipse", "line", "path", "polygon", "polyline", "rect", "g",
  "defs", "use", "symbol", "text", "tspan", "title", "desc", "lineargradient",
  "radialgradient", "stop", "mask", "clippath", "filter", "fegaussianblur",
  "feoffset", "femerge", "femergenode",
]);

const TAG_SHAPE = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/** A well-formed tag on the allowlist (case-insensitive). */
export function isAllowedElementTag(tag: unknown): tag is string {
  return typeof tag === "string" && TAG_SHAPE.test(tag) && ALLOWED_ELEMENT_TAGS.has(tag.toLowerCase());
}

/** The stored tag if allowed, else "div" — the content stays, the tag goes. */
export function toAllowedElementTag(tag: unknown): string {
  return isAllowedElementTag(tag) ? tag : "div";
}

/** An attribute name that cannot break out of `name="value"` markup. */
const ATTR_NAME_SHAPE = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/;
export function isValidAttributeName(name: string): boolean {
  return ATTR_NAME_SHAPE.test(name);
}

/** Never kept, whatever the value: `srcdoc` is a whole same-origin document. */
export const FORBIDDEN_ATTRIBUTES: ReadonlySet<string> = new Set(["srcdoc"]);

/** Attributes whose value is fetched or navigated to (lower-case). */
export const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  "href", "src", "srcset", "action", "formaction", "poster", "xlink:href",
]);

/**
 * A URL a browser would run or render as a document: javascript:, vbscript:,
 * or a data: URL that is not an image. The scheme is read as a browser reads
 * it — every C0 control and space removed ("java\tscript:" and
 * "\x01javascript:" both run) — so a regex anchored on the raw string cannot
 * be slipped past. The one check the server sanitizer and the editor share.
 */
export function isDangerousUrl(value: string): boolean {
  const compact = value.replace(/[\x00-\x20]/g, "").toLowerCase();
  if (compact.startsWith("javascript:") || compact.startsWith("vbscript:")) return true;
  return compact.startsWith("data:") && !compact.startsWith("data:image/");
}

/** A style key as stored: kebab or camelCase, vendor-prefixed, or a custom property. */
const CSS_PROPERTY_SHAPE = /^(?:--[a-zA-Z0-9_-]+|-?[a-zA-Z][a-zA-Z0-9-]*)$/;
/**
 * `<` could close the surrounding `</style>`; `{` and `}` open or end a rule.
 * The same characters `siteTokensCSS` strips from a token value.
 */
const CSS_BREAKOUT = /[<{}]/;
/** A template token placeholder (`{{token.color.primary}}`), resolved before
 *  publish; balanced and name-only, so it cannot leave the rule. */
const CSS_TOKEN_PLACEHOLDER = /\{\{[a-zA-Z0-9._-]+\}\}/g;
const CSS_DANGEROUS = [/expression\s*\(/i, /-moz-binding/i, /behavior\s*:/i, /javascript:/i, /vbscript:/i];
const CSS_URL = /url\(\s*(['"]?)([\s\S]*?)\1\s*\)/gi;

/**
 * One style declaration that is safe to write into a stylesheet — a published
 * page's `<style>`, where a value reading `red}</style><script>…` would leave
 * the rule, then the element. The one check the export writers, the server
 * write boundary and the editor's load sanitizer share.
 */
export function isSafeCssDeclaration(property: string, value: unknown): boolean {
  if (typeof value !== "string" || !CSS_PROPERTY_SHAPE.test(property)) return false;
  if (["behavior", "-moz-binding"].includes(property.toLowerCase())) return false;
  if (CSS_BREAKOUT.test(value.replace(CSS_TOKEN_PLACEHOLDER, ""))) return false;
  if (CSS_DANGEROUS.some((pattern) => pattern.test(value))) return false;
  for (const match of value.matchAll(CSS_URL)) {
    if (isDangerousUrl(match[2] ?? "")) return false;
  }
  return true;
}

/**
 * An element id as the editor mints it (`el-<time>-<random>`), or any other
 * plain word. It is written into selectors (`.buildrick-<id>`,
 * `[data-buildrick-id="<id>"]`) and class attributes, so nothing else is kept.
 */
const ELEMENT_ID_SHAPE = /^[A-Za-z0-9_-]+$/;
export function isSafeElementId(id: unknown): id is string {
  return typeof id === "string" && ELEMENT_ID_SHAPE.test(id);
}

const CSS_IDENT = "-?[A-Za-z_][A-Za-z0-9_-]*";
const CSS_PSEUDO_CLASSES = [
  "hover", "focus", "focus-visible", "focus-within", "active", "visited", "link",
  "disabled", "enabled", "checked", "required", "optional", "valid", "invalid",
  "placeholder-shown", "empty", "target", "root", "first-child", "last-child",
  "only-child", "first-of-type", "last-of-type", "only-of-type",
];
const CSS_PSEUDO_ELEMENTS = [
  "before", "after", "placeholder", "selection", "marker", "first-line", "first-letter",
];
const CSS_NTH = "nth-child|nth-last-child|nth-of-type|nth-last-of-type";
const CSS_SIMPLE =
  `(?:\\.${CSS_IDENT}|#${CSS_IDENT}` +
  // [attr] or [attr=word] / [attr="word"] — the quoted form is how
  // `[data-buildrick-id="<id>"]` is written, and a word cannot close it.
  `|\\[${CSS_IDENT}(?:[~|^$*]?=(?:${CSS_IDENT}|"[A-Za-z0-9_-]*"))?\\]` +
  `|:(?:${CSS_PSEUDO_CLASSES.join("|")})` +
  `|:(?:${CSS_NTH})\\(\\s*(?:odd|even|[+-]?\\d*n?(?:\\s*[+-]\\s*\\d+)?)\\s*\\)` +
  `|::?(?:${CSS_PSEUDO_ELEMENTS.join("|")}))`;
const CSS_COMPOUND = `(?:(?:\\*|${CSS_IDENT})${CSS_SIMPLE}*|${CSS_SIMPLE}+)`;
const CSS_COMPLEX = `${CSS_COMPOUND}(?:(?:\\s*[>+~]\\s*|\\s+)${CSS_COMPOUND})*`;
const CSS_SELECTOR_SHAPE = new RegExp(`^\\s*${CSS_COMPLEX}(?:\\s*,\\s*${CSS_COMPLEX})*\\s*$`);
const MAX_SELECTOR_LENGTH = 1000;

/**
 * A selector in one of the shapes the product writes — type, `.class`, `#id`,
 * `[data-buildrick-id="<id>"]`, allowlisted pseudo-classes/elements, joined by
 * descendant/child/sibling combinators or commas. Project-level rules are
 * written raw ahead of `{` in a published stylesheet (and a single-file
 * export's `<style>`), so a stored selector `a{}</style><script>…` ran script;
 * anything outside this grammar — braces, `;`, `@`, `\`, `<`, a quote outside
 * that attribute form — is refused.
 */
export function isSafeCssSelector(selector: unknown): selector is string {
  return (
    typeof selector === "string" &&
    selector.length <= MAX_SELECTOR_LENGTH &&
    CSS_SELECTOR_SHAPE.test(selector)
  );
}

const MEDIA_FEATURE = "\\(\\s*(?:min|max)-(?:width|height)\\s*:\\s*\\d+px\\s*\\)";
const MEDIA_QUERY_SHAPE = new RegExp(`^${MEDIA_FEATURE}(?:\\s+and\\s+${MEDIA_FEATURE})*$`);

/** A media query of the breakpoint shape: `(max-width: 767px)`, ANDed. */
export function isSafeMediaQuery(query: unknown): query is string {
  return typeof query === "string" && MEDIA_QUERY_SHAPE.test(query);
}

/**
 * A stored style rule's selector and media query, both writable. No media
 * query (absent, null or "" — StyleEngine reads all three as base) is fine.
 */
export function isSafeStyleRuleTarget(selector: unknown, mediaQuery: unknown): boolean {
  if (!isSafeCssSelector(selector)) return false;
  return mediaQuery == null || mediaQuery === "" || isSafeMediaQuery(mediaQuery);
}

/**
 * CSS about to be placed inside a `<style>` element: the only thing that ends
 * it is `</style`, so that is written `<\/style` — the same CSS (`\/` is an
 * escaped `/`), but no longer markup. The last check on every CSS-in-HTML
 * writer, including the site's own Global CSS, which stays CSS.
 */
export function escapeStyleText(css: string): string {
  return css.replace(/<\/(style)/gi, "<\\/$1");
}

const TARGET_REL = ["noopener", "noreferrer"];

const TARGET_ATTR = /\starget\s*=/i;

/**
 * Give every element in sanitized markup that opens a browsing context
 * (`target`) rel="noopener noreferrer", merged into any rel it already has, so
 * the opened page gets no `window.opener` handle back to the app. Both sides'
 * sanitizers keep `target`, and both finish through this.
 *
 * `parse` is the caller's DOMPurify with RETURN_DOM_FRAGMENT. Markup with no
 * target is returned untouched: re-serialising it would rewrite text ("&" →
 * "&amp;") in every stored node for nothing.
 */
export function withSafeTargets(clean: string, parse: (html: string) => DocumentFragment): string {
  if (!TARGET_ATTR.test(clean)) return clean;
  const fragment = parse(clean);
  fragment.querySelectorAll("[target]").forEach((el) => {
    const rel = new Set((el.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean));
    for (const token of TARGET_REL) rel.add(token);
    el.setAttribute("rel", [...rel].join(" "));
  });
  const holder = fragment.ownerDocument.createElement("div");
  holder.append(fragment);
  return holder.innerHTML;
}

/**
 * The URLs a `srcset` value names ("a.jpg 1x, b.jpg 200w" → ["a.jpg", "b.jpg"]).
 * Only a trailing width/density descriptor is cut, not everything after the
 * first space: whitespace inside "java\tscript:" must not split the URL off.
 */
export function srcsetUrls(value: string): string[] {
  return value
    .split(",")
    .map((candidate) => candidate.trim().replace(/\s+\d+(?:\.\d+)?[wxh]$/i, ""))
    .filter((url) => url.length > 0);
}

/**
 * True only for a parseable, absolute `http:`/`https:` URL — not a relative
 * path, not `#anchor`, not `mailto:`/`tel:`. A form's after-submit redirect
 * ends up in `NextResponse.redirect(url)` — a relative value there either
 * throws ("Invalid URL") or resolves against the wrong host, and a bare
 * `#section` or `mailto:` is meaningless as a page destination. A different
 * (stricter, additive) rule from `isDangerousUrl` above, which correctly
 * allows relative/`#`/`mailto:`/`tel:` for an `href` — composed with it
 * below rather than replacing it, so this file stays the one place either
 * check can change.
 */
export function isAbsoluteHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** After-submit redirect: absolute http(s) only, on top of the shared dangerous-scheme guard above. */
export const absoluteRedirectUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || (isAbsoluteHttpUrl(v) && !isDangerousUrl(v)), {
    message: "Redirect URL must be a full address starting with https:// (or http://)",
  });
