/**
 * DamageScanner — what earlier bugs left in a saved project, found once per
 * load (CEO D5, narrowed by D9; plan task E-T9).
 *
 * Three findings, by how sure a repair can be:
 *   repairs      — unambiguous, applied automatically after a version
 *                  snapshot: a size that is not a number ("NaNpx",
 *                  "Infinitypx", "undefinedpx") written by the old resize
 *                  path. The declaration is removed; the element falls back
 *                  to the value it would have had without it.
 *   candidates   — possibly damaged, never changed without the user: text
 *                  escaped one time too many by the old export round trip
 *                  ("Tom &amp;amp; Jerry", "&lt;strong&gt;"). A literal
 *                  "&amp;" can be intended — code samples — so it is only
 *                  offered (Fix / Keep as written).
 *   unverified   — what cannot be checked: a copy made before BK-06 kept its
 *                  base styles and lost its Tablet/Mobile and :hover rules.
 *                  Found as an element whose type, base styles and text match
 *                  another's exactly while only the other has such rules.
 *
 * Image relinking (D9's "exact-match images") is not here: placed images
 * carry no asset id, so a dead `blob:` src has no exact match to repair to.
 * The media library's own URL remap (Composer.repairLocalMediaUrls) covers the
 * case where a match does exist.
 *
 * Pure: reads ProjectData, writes nothing. `applyDamageRepairs` performs the
 * repairs through the Composer.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine/Composer";
import type { ElementData, ProjectData, StyleData } from "@shared/types";

/** A size value that is not a number, as the old resize path wrote it. */
const NON_FINITE = /(^|[\s(,])-?(NaN|Infinity|undefined)(px|%|r?em|v[wh]|pt)?(?=$|[\s),])/;

/* One level of escaping too many: an escaped entity, or an escaped inline tag. */
const ESCAPED_ENTITY = /&amp;(amp|lt|gt|quot|#39|apos|nbsp|#\d+|#x[0-9a-f]+);/gi;
const ESCAPED_TAG = /&lt;(\/?(?:strong|b|em|i|u|s|br|span|a|p|small|sup|sub|mark|code)\b[^<>]*?)&gt;/gi;
/* In plain-text content the damage is one level up: the entity itself. */
const TEXT_ENTITY = /&(amp|lt|gt|quot|#39|apos|nbsp);/gi;
const TEXT_DECODE: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

const ID_IN_SELECTOR = /data-buildrick-id="([^"]+)"/;

export interface NonFiniteRepair {
  kind: "non-finite-size";
  elementId: string;
  pageId: string;
  property: string;
  before: string;
  /** Base style on the element, or the stored rule it sits in. */
  where: { ruleId: string; selector: string; mediaQuery?: string } | null;
}

export interface EscapedTextCandidate {
  kind: "escaped-text";
  elementId: string;
  pageId: string;
  before: string;
  after: string;
}

export interface UnverifiedStyles {
  kind: "unverified-styles";
  elementId: string;
  pageId: string;
  /** The look-alike that still has the responsive / state rules. */
  matchId: string;
}

export interface DamageReport {
  repairs: NonFiniteRepair[];
  candidates: EscapedTextCandidate[];
  unverified: UnverifiedStyles[];
}

/** The content with one level of escaping taken off; unchanged if none. */
export function unescapeOnce(content: string, format: ElementData["contentFormat"]): string {
  if (format === "text") return content.replace(TEXT_ENTITY, (_m, e: string) => TEXT_DECODE[e.toLowerCase()] ?? _m);
  return content.replace(ESCAPED_ENTITY, "&$1;").replace(ESCAPED_TAG, "<$1>");
}

function looksEscaped(content: string, format: ElementData["contentFormat"]): boolean {
  return unescapeOnce(content, format) !== content;
}

function walk(node: ElementData, pageId: string, visit: (el: ElementData, pageId: string) => void): void {
  visit(node, pageId);
  node.children?.forEach((c) => walk(c, pageId, visit));
}

export function scanDamage(project: ProjectData): DamageReport {
  const repairs: NonFiniteRepair[] = [];
  const candidates: EscapedTextCandidate[] = [];
  const unverified: UnverifiedStyles[] = [];

  const pageOf = new Map<string, string>();
  const elements: ElementData[] = [];
  for (const page of project.pages ?? []) {
    if (!page.root) continue;
    walk(page.root, page.id, (el, pageId) => {
      pageOf.set(el.id, pageId);
      elements.push(el);
      for (const [property, value] of Object.entries(el.styles ?? {})) {
        if (typeof value === "string" && NON_FINITE.test(value)) {
          repairs.push({ kind: "non-finite-size", elementId: el.id, pageId, property, before: value, where: null });
        }
      }
      if (el.content && looksEscaped(el.content, el.contentFormat)) {
        candidates.push({
          kind: "escaped-text",
          elementId: el.id,
          pageId,
          before: el.content,
          after: unescapeOnce(el.content, el.contentFormat),
        });
      }
    });
  }

  /* Stored rules: non-finite values, and which elements own a responsive or
     state rule at all. */
  const hasRules = new Set<string>();
  for (const rule of (project.styles ?? []) as StyleData[]) {
    const id = ID_IN_SELECTOR.exec(rule.selector)?.[1];
    if (!id || !pageOf.has(id)) continue;
    if (rule.mediaQuery || rule.pseudo || /:[a-z-]+$/i.test(rule.selector)) hasRules.add(id);
    for (const [property, value] of Object.entries(rule.properties ?? {})) {
      if (typeof value === "string" && NON_FINITE.test(value)) {
        repairs.push({
          kind: "non-finite-size",
          elementId: id,
          pageId: pageOf.get(id)!,
          property,
          before: value,
          where: { ruleId: rule.id, selector: rule.selector, mediaQuery: rule.mediaQuery },
        });
      }
    }
  }

  /* Look-alikes: same type, base styles and text. A group where some members
     have responsive/state rules and some do not is where a copy lost them. */
  const groups = new Map<string, ElementData[]>();
  for (const el of elements) {
    const styles = el.styles ?? {};
    if (Object.keys(styles).length === 0) continue;
    const key = JSON.stringify([el.type, el.tagName ?? "", el.content ?? "", Object.entries(styles).sort()]);
    const group = groups.get(key);
    if (group) group.push(el);
    else groups.set(key, [el]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const source = group.find((el) => hasRules.has(el.id));
    if (!source) continue;
    for (const el of group) {
      if (!hasRules.has(el.id)) {
        unverified.push({ kind: "unverified-styles", elementId: el.id, pageId: pageOf.get(el.id)!, matchId: source.id });
      }
    }
  }

  return { repairs, candidates, unverified };
}

/**
 * Perform the automatic repairs. Each is re-checked against the live document
 * first — a value that changed since the scan is the user's, and is left.
 * Returns how many were applied. The caller owns the transaction (one Undo)
 * and the version snapshot before it.
 */
export function applyDamageRepairs(composer: Composer, repairs: readonly NonFiniteRepair[]): number {
  let applied = 0;
  for (const r of repairs) {
    if (!r.where) {
      const el = composer.elements.getElement(r.elementId);
      if (el && el.getStyles()[r.property] === r.before) {
        el.removeStyle(r.property);
        applied++;
      }
      continue;
    }
    const rule = composer.styles.getRule(r.where.selector, r.where.mediaQuery);
    if (!rule || rule.properties[r.property] !== r.before) continue;
    const rest = { ...rule.properties };
    delete rest[r.property];
    composer.styles.setRule(r.where.selector, rest, { mediaQuery: r.where.mediaQuery, replace: true });
    applied++;
  }
  return applied;
}

/** The user's Fix on an escaped-text candidate; false when the text changed since. */
export function applyEscapedTextFix(composer: Composer, c: EscapedTextCandidate): boolean {
  const el = composer.elements.getElement(c.elementId);
  if (!el || el.getContent() !== c.before) return false;
  el.setContent(c.after);
  return true;
}
