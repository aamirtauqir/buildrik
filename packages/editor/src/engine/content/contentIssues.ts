/**
 * Page-content issue detectors (missing-features L2 "Issues", boards
 * 6158:52193 / 52437 / 52681, 6883:…). The Issues panel used to list DS-lint
 * token warnings only — nothing looked at the actual page content, so a page
 * could ship with an unlabelled image or a link to nowhere and the panel
 * would say "No issues."
 *
 * Pure and side-effect-free per the engine contract (`engine/AGENTS.md`): no
 * React, no Composer, `PageData[]` in and findings out. The editor shell
 * (`AquibraStudio`, via `useContentIssueScanner`) calls this on demand and
 * wraps the call in try/catch — a detector that throws becomes the panel's
 * "Scan failed" state, not a crash that takes the whole panel down.
 *
 * @license BSD-3-Clause
 */
import type { ElementData, PageData } from "../../shared/types";
import { isUrl } from "../../shared/utils/helpers/validation";

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

function isImageElement(el: ElementData): boolean {
  return el.type === "image" || el.tagName?.toLowerCase() === "img";
}

/** A readable label for the row's "location" column — the element's own text
 *  or its type/tag, since neither the raw id nor a truncated `src` reads as
 *  a place a person recognizes. */
function describeElement(el: ElementData, pageName: string): string {
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
function checkImage(el: ElementData, pageId: string, pageName: string): ContentIssueFinding | null {
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

function pageExists(pages: PageData[], pageId: string): boolean {
  return pages.some((p) => p.id === pageId);
}

/**
 * Link defects: no destination, a bare `#` stub, a dead internal page (the
 * `#page:<id>` format `LinkSection` writes), or a URL the browser itself
 * cannot parse. `mailto:` / `tel:` / same-page anchors are left alone — this
 * checks reachability, not taste.
 */
function checkLink(
  el: ElementData,
  pageId: string,
  pageName: string,
  pages: PageData[],
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
    if (!pageExists(pages, targetId)) {
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
  if (!isUrl(trimmed)) {
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
  root: ElementData | undefined,
  pageId: string,
  pageName: string,
  pages: PageData[],
  out: ContentIssueFinding[],
): void {
  if (!root) return;
  if (isImageElement(root)) {
    const issue = checkImage(root, pageId, pageName);
    if (issue) out.push(issue);
  }
  const linkIssue = checkLink(root, pageId, pageName, pages);
  if (linkIssue) out.push(linkIssue);
  root.children?.forEach((child) => walkPage(child, pageId, pageName, pages, out));
}

/**
 * Scan every page for content issues. "This page" vs "Whole site" scoping is
 * the existing `issueAppliesToPage` filter in the Issues panel — every
 * finding here carries its own `pageId`, so it composes with that filter
 * without the panel needing to know detectors exist.
 */
export function detectContentIssues(pages: PageData[]): ContentIssueFinding[] {
  const out: ContentIssueFinding[] = [];
  for (const page of pages) {
    walkPage(page.root, page.id, page.name, pages, out);
  }
  return out;
}
