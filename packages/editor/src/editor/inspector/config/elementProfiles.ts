/**
 * Element Profiles — per-element-type section ordering for the contextual
 * inspector. Each profile declares which sections appear in each of the
 * three tabs (Style / Element / Effects), in what order. Section visibility
 * is enforced by the registry's `shouldRender` predicates, so profiles stay
 * declarative and don't need to know about flex-item / grid-item / text-like
 * context. First section in each tab's order is the visual "primary" tier.
 *
 * Element type strings below come from the canonical `ElementType` union in
 * `shared/types/element.ts` — verified 2026-04-12 during office-hours.
 * Container fallback catches any type not explicitly listed. Adding support
 * for a new element type is one entry in PROFILES, not a code change.
 *
 * Design reference:
 *   ~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260412-033637.md
 *
 * @license BSD-3-Clause
 */

import type { SectionId } from "../sections/registry";

// ============================================================================
// TYPES
// ============================================================================

/**
 * An element profile describes which sections a given element type sees in
 * each of the three inspector tabs and in what order. Sections are filtered
 * by their registry-level `shouldRender` predicates before rendering, so a
 * profile can list more sections than are actually visible for a given
 * element (e.g. flex is in the container profile but only renders when the
 * element is actually a flex container or item).
 */
export interface ElementProfile {
  /** Ordered section ids for the Style tab. First entry is visually primary. */
  style: { order: SectionId[] };
  /** Ordered section ids for the Element tab. */
  element: { order: SectionId[] };
  /** Ordered section ids for the Effects tab. */
  effects: { order: SectionId[] };
}

// ============================================================================
// PROFILES
// ============================================================================

/** Generic container fallback — used for plain divs, sections, and any
 *  element type not explicitly registered below. Starts with the quick-actions
 *  row so users can switch display modes in one click. */
const CONTAINER_PROFILE: ElementProfile = {
  style: {
    order: [
      "quick-actions",
      "size",
      "spacing",
      "flex",
      "typography",
      "background",
      "border",
      "corner-radius",
      "layout",
      "grid",
    ],
  },
  element: { order: ["css-classes", "element-properties", "all-css"] },
  effects: { order: ["effects", "animation", "visibility", "interactions"] },
};

/** Text-like elements — Typography is the first thing users want. */
const TEXT_PROFILE: ElementProfile = {
  style: {
    order: [
      "typography",
      "size",
      "spacing",
      "layout",
      "background",
      "border",
      "corner-radius",
    ],
  },
  element: { order: ["css-classes", "all-css"] },
  effects: { order: ["effects", "animation", "visibility", "interactions"] },
};

/** Explicit flex container — prioritizes Layout and Flex over everything
 *  else. Keeps quick-actions at the top so users can switch away from flex. */
const FLEX_PROFILE: ElementProfile = {
  style: {
    order: [
      "quick-actions",
      "layout",
      "flex",
      "size",
      "spacing",
      "background",
      "border",
      "corner-radius",
      "typography",
    ],
  },
  element: { order: ["css-classes", "all-css"] },
  effects: { order: ["effects", "animation", "visibility", "interactions"] },
};

/** Explicit grid container — same idea as flex but grid leads. Columns is
 *  semantically a grid under the hood, so it reuses this profile. */
const GRID_PROFILE: ElementProfile = {
  style: {
    order: [
      "quick-actions",
      "layout",
      "grid",
      "size",
      "spacing",
      "background",
      "border",
      "corner-radius",
      "typography",
    ],
  },
  element: { order: ["css-classes", "all-css"] },
  effects: { order: ["effects", "animation", "visibility", "interactions"] },
};

/** Image / video / icon / lottie / svg / audio / embeds — Size (with
 *  object-fit) and Element Properties (src, alt, etc.) matter first. */
const MEDIA_PROFILE: ElementProfile = {
  style: { order: ["size", "layout", "spacing", "border", "corner-radius", "background"] },
  element: { order: ["element-properties", "css-classes", "all-css"] },
  effects: { order: ["effects", "animation", "visibility", "interactions"] },
};

/** Button / link / CTA — Typography, Background, Border are the big wins;
 *  link settings live in the Element tab; interactions get promoted in
 *  Effects because buttons are the most common interaction target. */
const BUTTON_PROFILE: ElementProfile = {
  style: {
    order: [
      "typography",
      "background",
      "border",
      "corner-radius",
      "spacing",
      "size",
      "layout",
    ],
  },
  element: { order: ["link", "element-properties", "css-classes", "all-css"] },
  effects: { order: ["interactions", "effects", "animation", "visibility"] },
};

/** Input / textarea / select / form — Typography + Border come first for
 *  form aesthetics; element-properties (name, placeholder, validation)
 *  dominates the Element tab. */
const INPUT_PROFILE: ElementProfile = {
  style: {
    order: [
      "typography",
      "border",
      "corner-radius",
      "size",
      "spacing",
      "background",
      "layout",
    ],
  },
  element: { order: ["element-properties", "css-classes", "all-css"] },
  effects: { order: ["effects", "animation", "interactions", "visibility"] },
};

// ============================================================================
// PROFILE MAP
// ============================================================================

/**
 * Element type → profile mapping. Every key here is a valid `ElementType`
 * string from the engine's canonical union. Element types not in this map
 * fall back to `CONTAINER_PROFILE` via `getProfileFor`.
 *
 * Verified against `shared/types/element.ts` and `shared/utils/nesting/rules.ts`.
 */
const PROFILES: Record<string, ElementProfile> = {
  // Text-like
  text: TEXT_PROFILE,
  heading: TEXT_PROFILE,
  paragraph: TEXT_PROFILE,

  // Explicit flex/grid containers
  flex: FLEX_PROFILE,
  grid: GRID_PROFILE,
  columns: GRID_PROFILE,

  // Media
  image: MEDIA_PROFILE,
  video: MEDIA_PROFILE,
  audio: MEDIA_PROFILE,
  svg: MEDIA_PROFILE,
  lottie: MEDIA_PROFILE,
  icon: MEDIA_PROFILE,
  gallery: MEDIA_PROFILE,
  "video-embed": MEDIA_PROFILE,
  "map-embed": MEDIA_PROFILE,

  // Interactive / link-carrying
  button: BUTTON_PROFILE,
  link: BUTTON_PROFILE,
  cta: BUTTON_PROFILE,

  // Form fields
  input: INPUT_PROFILE,
  textarea: INPUT_PROFILE,
  select: INPUT_PROFILE,

  // Generic containers — everything else falls through to CONTAINER_PROFILE
  // via the getProfileFor fallback, but we list a few common ones explicitly
  // so adding element-specific overrides later is just a one-line change.
  container: CONTAINER_PROFILE,
  section: CONTAINER_PROFILE,
  card: CONTAINER_PROFILE,
  pricing: CONTAINER_PROFILE,
  social: CONTAINER_PROFILE,
  hero: CONTAINER_PROFILE,
  features: CONTAINER_PROFILE,
  form: CONTAINER_PROFILE,
  list: CONTAINER_PROFILE,
  table: CONTAINER_PROFILE,
  header: CONTAINER_PROFILE,
  footer: CONTAINER_PROFILE,
  nav: CONTAINER_PROFILE,
  navbar: CONTAINER_PROFILE,
  slider: CONTAINER_PROFILE,
  testimonials: CONTAINER_PROFILE,
  accordion: CONTAINER_PROFILE,
  custom: CONTAINER_PROFILE,
  spacer: CONTAINER_PROFILE,
  divider: CONTAINER_PROFILE,
  progress: CONTAINER_PROFILE,
  countdown: CONTAINER_PROFILE,
  "product-card": CONTAINER_PROFILE,
  "product-grid": CONTAINER_PROFILE,
  "product-detail": CONTAINER_PROFILE,
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Set of unknown element types we've already warned about. Module-level so
 * the warning fires once per type per session, not once per render. Also
 * exposed via `getUnknownElementTypes()` so tests and future telemetry can
 * read the counter without reinventing a telemetry pipeline.
 */
const unknownElementTypes = new Set<string>();

/**
 * Look up the element profile for a given element type. Unknown types fall
 * back to the container profile — a sensible default that shows everything
 * visible for a generic container without crashing on new element types.
 *
 * When fallback fires for a previously-unseen type, warns once per type via
 * `console.warn` AND records it in `unknownElementTypes`. This catches the
 * silent-failure mode where the engine ships a new element type but the
 * inspector profile map isn't updated — the warning fires the next time
 * someone selects that element type in any environment with dev tools open,
 * and the counter is queryable by any future telemetry hook.
 */
export function getProfileFor(elementType: string): ElementProfile {
  const key = elementType.toLowerCase();
  const profile = PROFILES[key];
  if (profile) return profile;

  if (!unknownElementTypes.has(key)) {
    unknownElementTypes.add(key);
    // eslint-disable-next-line no-console
    console.warn(
      `[inspector] Unknown element type "${elementType}" — falling back to container profile. ` +
        `Add an explicit profile in config/elementProfiles.ts to customize the section order.`
    );
  }
  return CONTAINER_PROFILE;
}

/**
 * Returns the set of element types that have triggered the fallback since
 * the module loaded. Intended for tests and future telemetry hooks — any
 * monitoring code can poll this periodically to surface missing profiles.
 */
export function getUnknownElementTypes(): ReadonlySet<string> {
  return unknownElementTypes;
}

/**
 * Every element type key in the profile map. Exposed for tests and for
 * `migrateLegacyState` in `useInspectorSections`, which seeds per-element
 * collapse state across every known type.
 */
export const ALL_PROFILE_ELEMENT_TYPES = Object.keys(PROFILES);

/**
 * Raw access to the full profile map — used by the integrity test to verify
 * every profile references real section ids.
 */
export const PROFILE_MAP: Readonly<Record<string, ElementProfile>> = PROFILES;
