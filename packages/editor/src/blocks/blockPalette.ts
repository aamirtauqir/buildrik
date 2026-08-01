/**
 * Default colours for block markup — the CUSTOMER's page, not editor chrome.
 *
 * These must be literal values. A published page defines no custom properties
 * at all: `--bk-*` is editor chrome and never leaves the editor, and the
 * site-builder `--buildrick-design-*` bundle is produced by CSSBundler, which
 * only the design-system panel's "export tokens" button calls — the publish
 * path never runs it. So any `var(--token)` in a block resolves inside the
 * editor canvas and resolves to NOTHING on the live site, where the whole
 * declaration is invalid at computed-value time and silently drops. Blocks
 * looked right in the editor and shipped unstyled.
 *
 * Values are the resolved `--bk-*` values the blocks previously pointed at, so
 * the published page now renders what the editor always showed. Keeping them
 * literal is the point: a block must not depend on a stylesheet it cannot see.
 *
 * Customer theming happens through the site-builder design system on top of
 * these defaults; it does not happen by blocks reaching into chrome tokens.
 *
 * @lint-hex-policy: block default colours — exported user-site content, not
 * editor chrome. Gate 16 governs chrome hex; this file is customer output and
 * is deliberately literal.
 *
 * @license BSD-3-Clause
 */

export const BLOCK_COLORS = {
  /** Brand accent (was --bk-accent). */
  accent: "#1A56DB",
  /** Text/icons on top of `accent` (was --bk-accent-on). */
  accentOn: "#FFFFFF",
  /** Tinted accent wash for highlighted rows/cards (was --bk-accent-subtle). */
  accentSubtle: "#E1EFFE",
  /** Card and panel surfaces (was --bk-bg-card / --bk-bg-panel). */
  surface: "#FFFFFF",
  /** Zebra-stripe / muted fill (was --bk-bg-subtle). */
  surfaceSubtle: "#F3F4F6",
  /** Hairline borders (was --bk-border). */
  border: "#E5E7EB",
  /** Heavier borders and switch tracks (was --bk-border-medium). */
  borderStrong: "#D1D5DB",
  /** Body copy (was --bk-ink-soft). */
  text: "#4B5563",
  /** Secondary/caption copy (was --bk-ink-muted). */
  textMuted: "#6B7280",
} as const;
