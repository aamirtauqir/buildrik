/**
 * Default colours for block markup — the CUSTOMER's page, not editor chrome.
 *
 * A colour with a site-builder token of exactly the same value binds to it
 * (Brand Part 1b, spec §3): `var(--buildrick-design-<id>)`, no fallback. Those
 * vars are defined on every surface a page reaches — canvas, single-file and
 * ZIP export, publish — by the one token emitter (`emitTokenCss`), and every
 * seed var also sits in its `LEGACY_SEED` backstop, so the binding resolves
 * even on a site that never saved the token. A brand change then reaches every
 * inserted block. (Before 1a the publish path emitted no token CSS, which is
 * why this file used to be all literals.)
 *
 * The rest stay literal: no token holds their value, and the owner chose to
 * keep them raw rather than snap them to the nearest one (OQ-2, 2026-10-08).
 * `--bk-*` is editor chrome and never belongs in a block.
 *
 * @lint-hex-policy: block default colours — exported user-site content, not
 * editor chrome. Gate 16 governs chrome hex; this file is customer output.
 *
 * @license BSD-3-Clause
 */

export const BLOCK_COLORS = {
  /** Brand accent (was --bk-accent). */
  accent: "var(--buildrick-design-color-primary)",
  /** Text/icons on top of `accent` (was --bk-accent-on). */
  accentOn: "var(--buildrick-design-color-on-primary)",
  /** Tinted accent wash for highlighted rows/cards (was --bk-accent-subtle). */
  accentSubtle: "#E1EFFE",
  /** Card and panel surfaces (was --bk-bg-card / --bk-bg-panel). */
  surface: "var(--buildrick-design-color-surface-raised)",
  /** Zebra-stripe / muted fill (was --bk-bg-subtle). */
  surfaceSubtle: "var(--buildrick-design-color-surface-muted)",
  /** Hairline borders (was --bk-border). */
  border: "var(--buildrick-design-color-border-subtle)",
  /** Heavier borders and switch tracks (was --bk-border-medium). */
  borderStrong: "#D1D5DB",
  /** Body copy (was --bk-ink-soft). */
  text: "#4B5563",
  /** Secondary/caption copy (was --bk-ink-muted). */
  textMuted: "var(--buildrick-design-color-text-subtle)",
} as const;
