/**
 * Canvas-only guard for resource URLs in user-authored CSS.
 *
 * The editor canvas is not an iframe: Global CSS and the project's style rules
 * are `<style>` elements in the dashboard document, next to the signed-in
 * user's chrome. CSS that brings its own selectors can make the browser fetch
 * a URL per matching element — `input[value^="a"] { background: url(https://x/a) }`
 * — which leaks attribute values to whoever owns the host, and the dashboard
 * CSP allows `img-src https:` because image elements legitimately point
 * anywhere. So on the canvas, every reference to a host outside
 * `CANVAS_CSS_ASSET_HOSTS` (and outside the page's own origin, `data:` and
 * `blob:`) becomes `data:,`, which loads nothing.
 *
 * Covered: `url()` in any property or `@font-face`, `@import "…"`, and the
 * string arguments of `image-set()`, `-webkit-image-set()`, `image()`,
 * `cross-fade()` and `src()`. A CSS escape can spell any of those
 * (`\75 rl(`), so the result is decoded and checked again; anything still
 * reaching a foreign host there drops the whole stylesheet (fail closed).
 *
 * The published site is untouched — this runs only where CSS enters the
 * canvas (Canvas.tsx's Global CSS, StyleEngine's canvas sheet).
 *
 * @license BSD-3-Clause
 */

import { CANVAS_CSS_ASSET_HOSTS } from "@/shared/constants/media";

const BLOCKED_URL = "data:,";
const FALLBACK_ORIGIN = "https://canvas.invalid";

/** A quoted CSS string, double or single, with escapes. */
const STRING = String.raw`"(?:[^"\\\n]|\\[\s\S])*"|'(?:[^'\\\n]|\\[\s\S])*'`;
/** `url(` + a quoted string. Only the string is checked, so a modifier or a
 *  comment between it and `)` changes nothing. */
const URL_QUOTED = new RegExp(String.raw`(url\(\s*)(${STRING})`, "gi");
/** `url(` + an unquoted URL (the CSS url-token form). */
const URL_UNQUOTED = new RegExp(String.raw`(url\(\s*)((?:[^)\\\s"']|\\[\s\S])+)(\s*\))`, "gi");
/** `@import "…"` — the `@import url(…)` form is a url() and handled there. */
const IMPORT_STRING = new RegExp(String.raw`(@import\s*)(${STRING})`, "gi");
/** Functions whose bare string arguments are fetched as images. */
const STRING_URL_FUNCTIONS = /(?:-webkit-)?(?:image-set|cross-fade)\(|image\(|(?<![\w-])src\(/gi;
const ANY_STRING = new RegExp(STRING, "g");

/** CSS escapes decoded the way the tokenizer reads them (CSS Syntax §4.3.7). */
function decodeCssEscapes(text: string): string {
  return text.replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n\f]?|\r\n|([\s\S]))/g, (whole, hex: string | undefined, char: string | undefined) => {
    if (hex) {
      const code = parseInt(hex, 16);
      const valid = code !== 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
      return String.fromCodePoint(valid ? code : 0xfffd);
    }
    // An escaped newline is a line continuation inside a string.
    return char === undefined || char === "\n" || char === "\f" || whole === "\\\r\n" ? "" : char;
  });
}

function unquote(token: string): string {
  const first = token[0];
  return first === '"' || first === "'" ? token.slice(1, -1) : token;
}

function hostAllowed(hostname: string): boolean {
  return CANVAS_CSS_ASSET_HOSTS.some((host) =>
    host.startsWith("*.") ? hostname.endsWith(host.slice(1)) : hostname === host
  );
}

/**
 * Whether a URL written in canvas CSS may load: same-origin (relative paths
 * included), `data:`, `blob:`, or https on an allowlisted host. `raw` is the
 * value as written — escapes are decoded first, as the browser does.
 */
export function isCanvasCssUrlAllowed(raw: string, origin: string = FALLBACK_ORIGIN): boolean {
  const value = decodeCssEscapes(raw).trim();
  if (value === "") return true;
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return false;
  }
  if (url.protocol === "data:" || url.protocol === "blob:") return true;
  if (url.origin === new URL(origin).origin) return true;
  return url.protocol === "https:" && hostAllowed(url.hostname);
}

/** The index just past the `)` that closes the call opened before `start`. */
function closingParen(css: string, start: number): number {
  let depth = 1;
  for (let i = start; i < css.length; i++) {
    const ch = css[i];
    if (ch === "\\") {
      i++;
    } else if (ch === '"' || ch === "'") {
      ANY_STRING.lastIndex = i;
      const match = ANY_STRING.exec(css);
      if (match && match.index === i) i += match[0].length - 1;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")" && --depth === 0) {
      return i + 1;
    }
  }
  return css.length;
}

function rewrite(css: string, origin: string): string {
  const blockString = (token: string): string =>
    isCanvasCssUrlAllowed(unquote(token), origin) ? token : `"${BLOCKED_URL}"`;

  let out = css
    .replace(URL_QUOTED, (_m, open: string, token: string) => open + blockString(token))
    .replace(URL_UNQUOTED, (m, open: string, value: string, close: string) =>
      isCanvasCssUrlAllowed(value, origin) ? m : `${open}${BLOCKED_URL}${close}`
    )
    .replace(IMPORT_STRING, (_m, open: string, token: string) => open + blockString(token));

  // String arguments of image-set() & co. Rebuilt left to right so offsets hold.
  let result = "";
  let cursor = 0;
  for (const match of out.matchAll(STRING_URL_FUNCTIONS)) {
    const start = (match.index ?? 0) + match[0].length;
    if (start < cursor) continue;
    const end = closingParen(out, start);
    result += out.slice(cursor, start) + out.slice(start, end).replace(ANY_STRING, blockString);
    cursor = end;
  }
  out = result + out.slice(cursor);
  return out;
}

/**
 * `css` with every resource reference the canvas may not load replaced by
 * `data:,` — or `""` when a reference only shows up once escapes are decoded,
 * which ordinary CSS never needs. `origin` is the document the CSS runs in.
 */
export function blockForeignCssUrls(
  css: string,
  origin: string = globalThis.location?.origin ?? FALLBACK_ORIGIN
): string {
  if (!css) return css;
  const safeOrigin = origin && origin !== "null" ? origin : FALLBACK_ORIGIN;
  const out = rewrite(css, safeOrigin);
  const decoded = decodeCssEscapes(out.replace(/\/\*[\s\S]*?\*\//g, ""));
  return rewrite(decoded, safeOrigin) === decoded ? out : "";
}
