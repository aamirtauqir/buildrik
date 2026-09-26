/**
 * Page-content issue detectors — the ONE source for "missing alt text" and
 * "broken link" facts (audit B-14 / B-15 / A02-9). The editor's Issues panel
 * (`useContentIssueScanner`) runs it over the live element tree and the
 * server's `runPrePublishChecks` runs it over the stored `pages.blocks`, so
 * Issues and Publish report the same facts from the same rules. It lives in
 * `packages/shared` because both sides import it; it takes a structural
 * element shape (`ContentElement`) rather than the editor's `ElementData`,
 * which the server cannot import.
 *
 * Built for the Issues boards (missing-features L2, 6158:52193 / 52437 /
 * 52681, 6883:…). The Issues panel used to list DS-lint
 * token warnings only — nothing looked at the actual page content, so a page
 * could ship with an unlabelled image or a link to nowhere and the panel
 * would say "No issues."
 *
 * Pure and side-effect-free: no React, no Composer, no Prisma — pages in,
 * findings out. The editor shell
 * (`AquibraStudio`, via `useContentIssueScanner`) calls this on demand and
 * wraps the call in try/catch — a detector that throws becomes the panel's
 * "Scan failed" state, not a crash that takes the whole panel down.
 *
 * @license BSD-3-Clause
 */
/** The element fields the detectors read. The editor's `ElementData` and the
 *  JSON stored in `pages.blocks` both satisfy it. */
export interface ContentElement {
  id: string;
  type: string;
  tagName?: string;
  content?: string;
  attributes?: Record<string, string>;
  data?: unknown;
  children?: ContentElement[];
}

export interface ContentPage {
  id: string;
  name: string;
  root: ContentElement | undefined;
}

export type ContentIssueSeverity = "error" | "warning";
export type ContentIssueKind = "missing-alt" | "broken-link";

export interface ContentIssueFinding {
  id: string;
  type: ContentIssueSeverity;
  kind: ContentIssueKind;
  message: string;
  location: string;
  elementId: string;
  pageId: string;
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/** A bare path that is really a mistyped absolute URL: `http//x`, `www.x.com`. */
const SCHEME_TYPO = /^(?:(?:https?|ftp):?\/{1,2}|www\.)/i;
/** Resolution base for relative hrefs — only whether they parse matters. */
const RELATIVE_BASE = "https://site.invalid/";

/**
 * Whether an href is a well-formed URL reference. An absolute URL (it has a
 * scheme) must parse on its own. Anything else is a relative reference —
 * `/about`, `./x`, `?q`, `//cdn`, `about.html` — and is resolved against a
 * base, the way the browser resolves it against the page; `new URL(href)`
 * with no base rejects every one of them. A relative reference whose first
 * segment holds a `:` is invalid (RFC 3986 §4.2), and one that reads as a
 * scheme typo is flagged rather than silently resolved to a local path.
 */
function isWellFormedHref(href: string): boolean {
  const absolute = HAS_SCHEME.test(href);
  if (!absolute) {
    const firstSegment = href.split(/[/?#]/, 1)[0] ?? "";
    if (firstSegment.includes(":") || SCHEME_TYPO.test(href)) return false;
  }
  try {
    // No base for an absolute URL: `https:/` against an https base would
    // resolve as a relative reference and pass.
    new URL(href, absolute ? undefined : RELATIVE_BASE);
    return true;
  } catch {
    return false;
  }
}

function isImageElement(el: ContentElement): boolean {
  return el.type === "image" || el.tagName?.toLowerCase() === "img";
}

/** A readable label for the row's "location" column — the element's own text
 *  or its type/tag, since neither the raw id nor a truncated `src` reads as
 *  a place a person recognizes. */
function describeElement(el: ContentElement, pageName: string): string {
  const label = el.content?.trim().slice(0, 40) || el.tagName?.toUpperCase() || el.type;
  return `${pageName} › ${label}`;
}

/**
 * Missing alt text: no `alt` attribute at all. `alt=""` is the standard,
 * deliberate way to mark an image decorative (assistive tech skips it), so
 * it is never flagged — same rule `MediaSiteCard` already renders by. A
 * `data.decorative` flag, if a producer ever sets one instead of the
 * attribute, skips the same way before the attribute is even read.
 */
function checkImage(el: ContentElement, pageId: string, pageName: string): ContentIssueFinding | null {
  const decorative = (el.data as { decorative?: boolean } | undefined)?.decorative;
  if (decorative === true) return null;
  if (el.attributes?.alt !== undefined) return null;
  return {
    id: `content:alt:${el.id}`,
    type: "error",
    kind: "missing-alt",
    message: "Image is missing alt text",
    location: describeElement(el, pageName),
    elementId: el.id,
    pageId,
  };
}

/**
 * Link defects: no destination, a bare `#` stub, a dead internal page (the
 * `#page:<id>` format `LinkSection` writes), or a URL the browser itself
 * cannot resolve. Root-relative internal paths (`/about`) are valid.
 * `mailto:` / `tel:` / same-page anchors are left alone — this
 * checks reachability, not taste.
 */
function checkLink(
  el: ContentElement,
  pageId: string,
  pageName: string,
  pageIds: ReadonlySet<string>,
): ContentIssueFinding | null {
  const href = el.attributes?.href;
  if (href === undefined) return null;
  const trimmed = href.trim();
  const base = {
    kind: "broken-link" as const,
    elementId: el.id,
    pageId,
    location: describeElement(el, pageName),
  };

  if (trimmed === "") {
    return { ...base, id: `content:link-empty:${el.id}`, type: "error", message: "Link has no destination" };
  }
  if (trimmed === "#") {
    return {
      ...base,
      id: `content:link-hash:${el.id}`,
      type: "warning",
      message: 'Link points to "#" — no destination set',
    };
  }
  if (trimmed.startsWith("#page:")) {
    const targetId = trimmed.slice("#page:".length);
    if (!pageIds.has(targetId)) {
      return {
        ...base,
        id: `content:link-dead-page:${el.id}`,
        type: "error",
        message: "Link points to a page that no longer exists",
      };
    }
    return null;
  }
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("#")) return null;
  if (!isWellFormedHref(trimmed)) {
    return {
      ...base,
      id: `content:link-malformed:${el.id}`,
      type: "warning",
      message: "Link URL looks malformed",
    };
  }
  return null;
}

function walkPage(
  root: ContentElement | undefined,
  pageId: string,
  pageName: string,
  pageIds: ReadonlySet<string>,
  out: ContentIssueFinding[],
): void {
  if (!root) return;
  if (isImageElement(root)) {
    const issue = checkImage(root, pageId, pageName);
    if (issue) out.push(issue);
  }
  const linkIssue = checkLink(root, pageId, pageName, pageIds);
  if (linkIssue) out.push(linkIssue);
  // Stored JSON is not type-checked: a malformed `children` is skipped, not thrown on.
  if (Array.isArray(root.children)) root.children.forEach((child) => walkPage(child, pageId, pageName, pageIds, out));
}

/**
 * Scan every page for content issues. "This page" vs "Whole site" scoping is
 * the existing `issueAppliesToPage` filter in the Issues panel — every
 * finding here carries its own `pageId`, so it composes with that filter
 * without the panel needing to know detectors exist.
 */
export function detectContentIssues(
  pages: ContentPage[],
  /** Pages a `#page:` link may target, when that is more than the pages
   *  scanned (the server scans only the live ones). Defaults to `pages`. */
  existingPageIds: readonly string[] = pages.map((p) => p.id),
): ContentIssueFinding[] {
  const out: ContentIssueFinding[] = [];
  const pageIds = new Set(existingPageIds);
  for (const page of pages) {
    walkPage(page.root, page.id, page.name, pageIds, out);
  }
  return out;
}

/** A stored `pages.blocks` value as a detector root, or undefined when it is
 *  not an element (legacy `[]`, null). */
export function asContentRoot(blocks: unknown): ContentElement | undefined {
  if (typeof blocks !== "object" || blocks === null || Array.isArray(blocks)) return undefined;
  const id = (blocks as { id?: unknown }).id;
  return typeof id === "string" ? (blocks as ContentElement) : undefined;
}

/** Pre-publish check labels for the two detector kinds. The editor's Issues
 *  feed drops server rows with these labels — its own live scan already lists
 *  the same facts per element. */
export const CONTENT_CHECK_LABELS: Record<ContentIssueKind, string> = {
  "missing-alt": "Image alt text",
  "broken-link": "Links",
};
