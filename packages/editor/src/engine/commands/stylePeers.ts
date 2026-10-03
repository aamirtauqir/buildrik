/**
 * Style peers — "Apply style to all {H3 headings} on this page" (DD-6b,
 * boards 30, 31). The one-shot that replaced the Inspector's "All like this"
 * reach mode and its "Whole site" scope.
 *
 * `findStylePeers` — the elements on the ACTIVE page that are the same kind as
 * `source` (same type; for a heading, the same level), minus `source` itself.
 * Locked peers and peers inside a component instance are counted and left
 * out: a lock is a promise, and an instance's styles belong to its master.
 *
 * `applyStyleToPeers` — copies `source`'s typography, fill, border and effects
 * properties AT ONE breakpoint and ONE state onto each peer, merged key by key
 * (the P-10 paste rule). What the dialog's Keeps row promises is left alone:
 * layout, size, spacing and position, and never text, level, link, CMS
 * binding, attributes, classes or interactions (board 31).
 * One transaction, so one Undo restores every peer.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { getBreakpointQuery } from "../../shared/constants/breakpoints";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { PseudoStateId } from "../../shared/types";
import { writableElements } from "./commandOperations";

export interface StylePeers {
  peers: Element[];
  skippedLocked: number;
  skippedInInstance: number;
}

function inInstance(el: Element): boolean {
  for (let p: Element | null | undefined = el; p; p = p.getParent?.()) if (p.isComponentInstance?.()) return true;
  return false;
}

/** Same kind: same type, and for a heading the same level (tag). */
function sameKind(a: Element, b: Element): boolean {
  if (a.getType() !== b.getType()) return false;
  return a.getType() !== "heading" || a.getTagName() === b.getTagName();
}

export function findStylePeers(composer: Composer, source: Element): StylePeers {
  const page = composer.elements.getActivePage();
  const root = page ? composer.elements.getElement(page.root.id) : null;
  const out: StylePeers = { peers: [], skippedLocked: 0, skippedInInstance: 0 };
  if (!root) return out;
  for (const el of root.getDescendants()) {
    if (el.getId() === source.getId() || !sameKind(el, source)) continue;
    if (el.isLocked()) out.skippedLocked += 1;
    else if (inInstance(el)) out.skippedInInstance += 1;
    else out.peers.push(el);
  }
  return out;
}

export interface ApplyStyleOptions {
  breakpoint: BreakpointId;
  pseudo: PseudoStateId;
}

/* Board 31 "Copies: Typography, fill, border and effects". */
const COPIED_EXACT = new Set([
  "color", "line-height", "letter-spacing", "word-spacing", "white-space", "word-break", "vertical-align",
  "opacity", "box-shadow", "filter", "backdrop-filter", "cursor", "mix-blend-mode", "will-change",
]);
const COPIED_PREFIXES = ["font-", "text-", "background", "border", "outline", "transform", "transition"];

/** Is this CSS property one Apply-to-all copies? */
function isCopiedStyleProperty(prop: string): boolean {
  return COPIED_EXACT.has(prop) || COPIED_PREFIXES.some((p) => prop.startsWith(p));
}

const pickCopied = (styles: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(styles).filter(([k]) => isCopiedStyleProperty(k)));

const selectorFor = (id: string) => `[data-buildrik-id="${id}"]`;

/** The source's style map at this breakpoint + state, as authored. */
function styleAt(composer: Composer, source: Element, { breakpoint, pseudo }: ApplyStyleOptions): Record<string, string> {
  if (pseudo !== "normal") {
    const mq = breakpoint === "desktop" ? undefined : getBreakpointQuery(breakpoint) ?? undefined;
    return { ...(composer.styles.getRule(`${selectorFor(source.getId())}:${pseudo}`, mq)?.properties ?? {}) };
  }
  if (breakpoint !== "desktop") return { ...composer.styles.getBreakpointStyle(source.getId(), breakpoint) };
  return { ...source.getStyles() };
}

/** Returns how many peers were written (0 when there was nothing to copy). */
export function applyStyleToPeers(
  composer: Composer,
  source: Element,
  peers: readonly Element[],
  options: ApplyStyleOptions,
): number {
  const styles = pickCopied(styleAt(composer, source, options));
  if (Object.keys(styles).length === 0) return 0;
  const targets = writableElements(composer, peers);
  if (targets.length === 0) return 0;
  const { breakpoint, pseudo } = options;
  const mq = breakpoint === "desktop" ? undefined : getBreakpointQuery(breakpoint) ?? undefined;
  composer.beginTransaction("apply-style-to-peers");
  try {
    for (const peer of targets) {
      if (pseudo !== "normal") composer.styles.setRule(selectorFor(peer.getId()), styles, { pseudo: `:${pseudo}`, mediaQuery: mq });
      else if (breakpoint !== "desktop") composer.styles.setBreakpointStyle(peer.getId(), breakpoint, styles);
      else for (const [k, v] of Object.entries(styles)) peer.setStyle(k, v);
    }
  } finally {
    composer.endTransaction();
  }
  return targets.length;
}
