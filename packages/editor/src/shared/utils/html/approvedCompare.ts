/**
 * Approved-vs-current structural compare (review contract §3).
 *
 * The reviewer needs to see what changed between the round a client approved
 * and what the site says now. `diffHTML` in this folder is a deep positional
 * node diff — it never emits "move" and cascades every downstream node into
 * "change" the moment one strip is inserted, which is exactly the noise a
 * reviewer can't read. This comparator works one level up: it matches the
 * page's top-level STRIPS (the sections a client thinks in) by identity, so a
 * strip inserted at the top reads as one "added", not fifty "changed".
 *
 * Five change kinds, matching §3 — each carries a text label and a `detail`
 * string so the UI never encodes meaning with color alone (design codex #6):
 *   content — a matched strip's text changed
 *   style   — a matched strip's inline style / media attrs changed
 *   added   — a strip present now but not in the approved snapshot
 *   removed — a strip present in the approved snapshot but not now
 *   moved   — a strip that survived but changed order
 *
 * Strip identity is the element's first class token, which ExportEngine emits
 * as `<cssPrefix><elementId>` — stable across edits that don't delete the
 * element. Falls back to `<tag>#<index>` for markup without that class.
 *
 * @module utils/html/approvedCompare
 * @license BSD-3-Clause
 */

export type CompareChangeKind = "content" | "style" | "added" | "removed" | "moved";

export interface CompareChange {
  kind: CompareChangeKind;
  /** Page path the change lives on. */
  page: string;
  /** Strip identity within the page. */
  key: string;
  /** Human label for the strip (heading text or semantic tag name). */
  label: string;
  /** Plain-text description of the change — never color-only. */
  detail: string;
}

export interface ApprovedCompareResult {
  /** False when the round has no stored snapshot (older reviews) — a state, not an error. */
  hasApprovedSnapshot: boolean;
  changes: CompareChange[];
  counts: Record<CompareChangeKind, number>;
}

export interface ComparePage {
  path: string;
  html: string;
}

interface Strip {
  key: string;
  label: string;
  text: string;
  styleSig: string;
}

const SEMANTIC_LABEL: Record<string, string> = {
  section: "Section",
  header: "Header",
  footer: "Footer",
  nav: "Navigation",
  main: "Main",
  aside: "Aside",
  article: "Article",
};

function normalizeText(value: string | null): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function stripLabel(el: Element): string {
  const heading = el.querySelector("h1,h2,h3,h4,h5,h6");
  const headingText = normalizeText(heading?.textContent ?? "");
  const tag = el.tagName.toLowerCase();
  const base = SEMANTIC_LABEL[tag] ?? tag;
  if (headingText) {
    const clipped = headingText.length > 40 ? `${headingText.slice(0, 40)}…` : headingText;
    return `${base} — "${clipped}"`;
  }
  return base;
}

/** selector → normalized declaration body, harvested from the doc's <style> blocks. */
type CssRule = { selector: string; body: string };

function harvestCssRules(doc: Document): CssRule[] {
  const cssText = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");
  const rules: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssText)) !== null) {
    rules.push({ selector: m[1].trim(), body: normalizeText(m[2]) });
  }
  return rules;
}

/**
 * The strip's visual signature: inline style, the media/link attributes a
 * reviewer treats as "style" (a swapped image or recolored button), AND the
 * embedded-CSS rule bodies keyed on any class in the strip's subtree —
 * ExportEngine's default `cssStyle: "embedded"` writes element styles as
 * `.<cssPrefix><id> { … }` in a <style> block, not inline. Identity classes
 * are stable, so keying on them does not fire false positives.
 */
function styleSignature(el: Element, rules: CssRule[]): string {
  const parts = [`style:${normalizeText(el.getAttribute("style"))}`];
  for (const attr of ["src", "href", "alt", "aria-label"]) {
    const v = el.getAttribute(attr);
    if (v != null) parts.push(`${attr}:${v}`);
  }
  el.querySelectorAll("img,svg,[style]").forEach((child) => {
    const s = child.getAttribute("style");
    const src = child.getAttribute("src");
    if (s) parts.push(`d-style:${normalizeText(s)}`);
    if (src) parts.push(`d-src:${src}`);
  });
  const classes = new Set<string>();
  el.classList.forEach((c) => classes.add(c));
  el.querySelectorAll("[class]").forEach((n) => n.classList.forEach((c) => classes.add(c)));
  const matched = rules
    .filter((r) => [...classes].some((c) => r.selector.includes(`.${c}`)))
    .map((r) => `${r.selector}{${r.body}}`)
    .sort();
  return [...parts, ...matched].join("|");
}

function extractStrips(html: string): Strip[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rules = harvestCssRules(doc);
  // The exported body wraps everything in the page-root container; its children
  // are the strips. If there's no single wrapper, the body's children are.
  const body = doc.body;
  const onlyChild =
    body.children.length === 1 && body.firstElementChild?.children.length
      ? body.firstElementChild
      : body;
  const kids = Array.from(onlyChild.children);
  return kids.map((el, i) => ({
    key: el.classList[0] || `${el.tagName.toLowerCase()}#${i}`,
    label: stripLabel(el),
    text: normalizeText(el.textContent),
    styleSig: styleSignature(el, rules),
  }));
}

/**
 * Indices of the longest strictly-increasing subsequence of `seq`. Strips whose
 * position is NOT in this set are the minimal set that "moved".
 */
function lisIndexSet(seq: number[]): Set<number> {
  const n = seq.length;
  if (n === 0) return new Set();
  const tails: number[] = []; // tails[k] = index into seq of the smallest tail of an increasing subseq of length k+1
  const prev: number[] = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (seq[tails[mid]] < seq[i]) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    if (lo === tails.length) tails.push(i);
    else tails[lo] = i;
  }
  const set = new Set<number>();
  let k = tails[tails.length - 1];
  while (k >= 0) {
    set.add(k);
    k = prev[k];
  }
  return set;
}

function diffPageStrips(page: string, approved: Strip[], current: Strip[]): CompareChange[] {
  const changes: CompareChange[] = [];
  const currentByKey = new Map(current.map((s) => [s.key, s]));
  const approvedByKey = new Map(approved.map((s) => [s.key, s]));

  for (const s of approved) {
    if (!currentByKey.has(s.key)) {
      changes.push({ kind: "removed", page, key: s.key, label: s.label, detail: "Removed since approval" });
    }
  }
  for (const s of current) {
    if (!approvedByKey.has(s.key)) {
      changes.push({ kind: "added", page, key: s.key, label: s.label, detail: "Added since approval" });
    }
  }

  // Common strips, in approved order, mapped to their position in current order.
  const currentPos = new Map(current.map((s, i) => [s.key, i]));
  const commonApproved = approved.filter((s) => currentByKey.has(s.key));
  const seq = commonApproved.map((s) => currentPos.get(s.key) as number);
  const stable = lisIndexSet(seq);

  commonApproved.forEach((s, i) => {
    const c = currentByKey.get(s.key) as Strip;
    if (!stable.has(i)) {
      changes.push({ kind: "moved", page, key: s.key, label: s.label, detail: "Reordered since approval" });
    }
    if (s.text !== c.text) {
      changes.push({ kind: "content", page, key: s.key, label: c.label, detail: "Text changed" });
    }
    if (s.styleSig !== c.styleSig) {
      changes.push({ kind: "style", page, key: s.key, label: c.label, detail: "Style changed" });
    }
  });

  return changes;
}

export function compareApprovedToCurrent(
  approved: ComparePage[] | null | undefined,
  current: ComparePage[],
): ApprovedCompareResult {
  const counts: Record<CompareChangeKind, number> = {
    content: 0,
    style: 0,
    added: 0,
    removed: 0,
    moved: 0,
  };

  if (approved == null) {
    return { hasApprovedSnapshot: false, changes: [], counts };
  }

  const approvedByPath = new Map(approved.map((p) => [p.path, p]));
  const currentByPath = new Map(current.map((p) => [p.path, p]));
  const paths = new Set<string>([...approvedByPath.keys(), ...currentByPath.keys()]);

  const changes: CompareChange[] = [];
  for (const path of paths) {
    const a = approvedByPath.get(path);
    const c = currentByPath.get(path);
    if (a && !c) {
      changes.push({ kind: "removed", page: path, key: path, label: `Page ${path}`, detail: "Page removed since approval" });
    } else if (!a && c) {
      changes.push({ kind: "added", page: path, key: path, label: `Page ${path}`, detail: "Page added since approval" });
    } else if (a && c) {
      changes.push(...diffPageStrips(path, extractStrips(a.html), extractStrips(c.html)));
    }
  }

  for (const ch of changes) counts[ch.kind]++;

  return { hasApprovedSnapshot: true, changes, counts };
}
