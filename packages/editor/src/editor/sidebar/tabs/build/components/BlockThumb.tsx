/**
 * BlockThumb — the thumbnail on a BLOCKS card (board 4428:140817).
 *
 * The section blocks ship no preview image, and a card with a blank grey box
 * where the picture should be is what G2-110 recorded ("50 blank-thumb
 * cards"). Until a real render exists, each card draws a wireframe of the
 * section's shape — the hero's headline and button, the feature columns, the
 * navbar's bar — in chrome tokens, so the grid reads as a catalogue rather
 * than a row of placeholders. A block that DOES carry a `preview` still shows
 * it (GroupSection); this is the fallback, keyed by block id, with a generic
 * band for ids it does not know.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

const INK = "var(--bk-gray-300)";
const ACCENT = "var(--bk-accent)";
const FILL = "var(--bk-gray-100)";

/* One 136×80 viewBox, four to six rectangles each. */
const SHAPES: Record<string, React.ReactElement> = {
  hero: (
    <>
      <rect x="28" y="20" width="80" height="8" rx="2" fill={INK} />
      <rect x="40" y="34" width="56" height="4" rx="2" fill={INK} opacity="0.6" />
      <rect x="54" y="48" width="28" height="10" rx="3" fill={ACCENT} />
    </>
  ),
  features: (
    <>
      <rect x="12" y="16" width="34" height="48" rx="3" fill={FILL} stroke={INK} />
      <rect x="51" y="16" width="34" height="48" rx="3" fill={FILL} stroke={INK} />
      <rect x="90" y="16" width="34" height="48" rx="3" fill={FILL} stroke={INK} />
      <rect x="18" y="24" width="10" height="10" rx="5" fill={ACCENT} />
      <rect x="57" y="24" width="10" height="10" rx="5" fill={ACCENT} />
      <rect x="96" y="24" width="10" height="10" rx="5" fill={ACCENT} />
    </>
  ),
  navbar: (
    <>
      <rect x="8" y="8" width="120" height="16" rx="3" fill={FILL} stroke={INK} />
      <rect x="14" y="13" width="20" height="6" rx="2" fill={ACCENT} />
      <rect x="82" y="14" width="10" height="4" rx="2" fill={INK} />
      <rect x="96" y="14" width="10" height="4" rx="2" fill={INK} />
      <rect x="110" y="14" width="10" height="4" rx="2" fill={INK} />
    </>
  ),
  footer: (
    <>
      <rect x="8" y="48" width="120" height="24" rx="3" fill={FILL} stroke={INK} />
      <rect x="16" y="56" width="24" height="4" rx="2" fill={INK} />
      <rect x="52" y="56" width="18" height="4" rx="2" fill={INK} />
      <rect x="80" y="56" width="18" height="4" rx="2" fill={INK} />
      <rect x="16" y="64" width="40" height="3" rx="1.5" fill={INK} opacity="0.6" />
    </>
  ),
  cta: (
    <>
      <rect x="8" y="20" width="120" height="40" rx="4" fill={FILL} stroke={INK} />
      <rect x="24" y="32" width="52" height="6" rx="2" fill={INK} />
      <rect x="24" y="42" width="36" height="4" rx="2" fill={INK} opacity="0.6" />
      <rect x="92" y="33" width="26" height="12" rx="3" fill={ACCENT} />
    </>
  ),
};

const GENERIC = (
  <>
    <rect x="8" y="12" width="120" height="56" rx="4" fill={FILL} stroke={INK} />
    <rect x="20" y="28" width="60" height="6" rx="2" fill={INK} />
    <rect x="20" y="40" width="40" height="4" rx="2" fill={INK} opacity="0.6" />
  </>
);

export function BlockThumb({ blockId, className }: { blockId: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 136 80"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-testid={`insert-block-thumb-${blockId}`}
      data-shape={SHAPES[blockId] ? blockId : "generic"}
    >
      {SHAPES[blockId] ?? GENERIC}
    </svg>
  );
}
