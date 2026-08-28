/**
 * The chrome type ramp — five roles, one source (design-debt arc 2026-08-28).
 *
 * Two independent audits counted 20 distinct font sizes in chrome against a
 * 7-step token scale, with the section caption hand-rolled ~25 times in six
 * sizes. These constants are the roles panels actually need; sizes and inks
 * ride the generated tokens so a Figma re-export moves everything at once.
 *
 * PanelHeader / SectionHeader / EmptyState / Modal already compose these
 * values internally — reach for a constant when hand-building a one-off
 * label, never for a new size.
 */

/** Panel title — 11px medium, wide-tracked, soft ink (PanelHeader's voice). */
export const TYPE_PANEL_TITLE_CLASS =
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] tw:font-medium tw:tracking-[0.08em] tw:text-[var(--bk-ink-soft)]";

/** Section caption — the small uppercase group label (SectionHeader's voice). */
export const TYPE_SECTION_CAPTION_CLASS =
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] tw:font-medium tw:tracking-[0.08em] tw:uppercase tw:text-[var(--bk-ink-muted)]";

/** Body — 13px regular ink; the default reading voice of a panel. */
export const TYPE_BODY_CLASS =
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]";

/** Label — 12px medium soft ink; control and field labels. */
export const TYPE_LABEL_CLASS =
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink-soft)]";

/** Hint — 11px muted; helper lines and quiet metadata. */
export const TYPE_HINT_CLASS =
  "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]";
