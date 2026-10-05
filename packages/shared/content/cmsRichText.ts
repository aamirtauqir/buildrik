/**
 * The ONE sanitizer for a CMS rich text value (PD-1), run by the editor (the
 * record field on input, every canvas/list/export sink on output), by the
 * server (every entry upsert, draft or published, and every record page at
 * output time) — identical code on both sides.
 *
 * Two stages, both parser-based:
 *  1. DOMPurify parses the value and drops what is not allow-listed. The
 *     caller passes its DOMPurify instance: the browser's, or
 *     isomorphic-dompurify (DOMPurify over jsdom) on the server — the same
 *     library, so the parse is the same algorithm (the HTML spec's).
 *  2. This module walks the parsed fragment and WRITES the output itself: only
 *     allow-listed elements, text fully escaped, `href` only on `a` and only
 *     http(s) / mailto / relative. Nothing DOMPurify kept reaches the output
 *     by its own serialization, so a parser differential (mutation XSS) has
 *     no markup to smuggle: the output is a fixed, minimal grammar that every
 *     HTML parser reads the same way.
 *
 * The output is also inert inside an attribute value: `href` is written
 * unquoted with every quote, `=`, `<`, `>`, backtick and space
 * percent-encoded, and text escapes both quotes — so a record page that
 * substitutes it where an attribute was (a mis-bound token) cannot close
 * that attribute.
 *
 * @license BSD-3-Clause
 */

/** The structural and inline formatting a rich text value may carry. */
export const CMS_RICHTEXT_TAGS = ["p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code"] as const;

/** What the browser's editing commands produce for bold / italic, written as
 *  the allow-listed equivalent. */
const RENAMED: Readonly<Record<string, string>> = { b: "strong", i: "em" };

const ALLOWED = new Set<string>(CMS_RICHTEXT_TAGS);
const VOID = new Set(["br"]);

/** Never kept, content included. */
const FORBIDDEN_TAGS = ["svg", "math", "template", "noscript", "iframe", "object", "embed", "style", "script", "xmp", "noembed", "noframes", "plaintext", "textarea", "title", "frameset", "frame", "form", "input", "button", "select", "option", "img", "video", "audio", "source", "picture", "link", "meta", "base"];

/** The DOMPurify configuration of stage 1. */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [...CMS_RICHTEXT_TAGS, ...Object.keys(RENAMED)],
  ALLOWED_ATTR: ["href"],
  FORBID_TAGS: FORBIDDEN_TAGS,
  FORBID_ATTR: ["style", "srcset", "formaction", "action", "xlink:href", "src"],
  FORBID_CONTENTS: FORBIDDEN_TAGS,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  RETURN_DOM_FRAGMENT: true,
} as const;

/** The DOMPurify surface stage 1 uses. */
export interface CmsPurify {
  sanitize(dirty: string, config: Record<string, unknown>): unknown;
}

/** The DOM surface stage 2 reads (browser DOM or jsdom). */
interface NodeLike {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
  childNodes: ArrayLike<NodeLike>;
  getAttribute?(name: string): string | null;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * May a rich text link go to `raw`? Only http:, https:, mailto: or a
 * relative URL. Read the way a browser reads it: the value is already
 * entity-decoded (it comes from the parsed DOM), every control character and
 * whitespace is removed — "jav\tascript:" and "\x01javascript:" both run —
 * and the scheme is case-folded.
 */
export function isSafeCmsRichTextHref(raw: string): boolean {
  const compact = Array.from(raw)
    .filter((c) => {
      const n = c.codePointAt(0) ?? 0;
      const space = n <= 0x20 || (n >= 0x7f && n <= 0xa0) || n === 0x1680 || (n >= 0x2000 && n <= 0x200b);
      return !(space || n === 0x2028 || n === 0x2029 || n === 0x202f || n === 0x205f || n === 0x3000 || n === 0xfeff);
    })
    .join("")
    .toLowerCase();
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(compact);
  if (!scheme) return true; // relative, or protocol-relative (http/https)
  return scheme[1] === "http" || scheme[1] === "https" || scheme[1] === "mailto";
}

/** An href written unquoted, inert in any attribute or text context. */
function writeHref(href: string): string {
  return href.trim().replace(/&/g, "&amp;").replace(/[\s"'<>=`]/g, (c) => encodeURIComponent(c));
}

function write(node: NodeLike): string {
  if (node.nodeType === TEXT_NODE) return escapeText(node.nodeValue ?? "");
  if (node.nodeType !== ELEMENT_NODE) return "";
  const raw = node.nodeName.toLowerCase();
  const tag = RENAMED[raw] ?? raw;
  const inner = Array.from(node.childNodes, write).join("");
  if (!ALLOWED.has(tag)) return inner;
  if (VOID.has(tag)) return `<${tag}>`;
  let attrs = "";
  if (tag === "a") {
    const href = node.getAttribute?.("href");
    const written = href && isSafeCmsRichTextHref(href) ? writeHref(href) : "";
    if (written) attrs = ` href=${written}`;
  }
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

/**
 * `html` cut to the rich text allow-list, written in the canonical grammar
 * above. Idempotent: sanitizing the output again returns it unchanged.
 */
export function sanitizeCmsRichText(purify: CmsPurify, html: string): string {
  if (!html) return "";
  const fragment = purify.sanitize(String(html), { ...PURIFY_CONFIG }) as NodeLike | null;
  if (!fragment) return "";
  return Array.from(fragment.childNodes, write).join("");
}
