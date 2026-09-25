/**
 * Element Profiles — per-element-type section order for the inspector.
 *
 * ONE ordered list per element type, because the panel is one scroll: the
 * Style / Element / Effects tab strip was removed from the UI and the three
 * separate orders it needed outlived it, concatenated at render time into an
 * order no board ever drew. The orders below are read off the profile boards
 * — 807:8342 (text), 807:8567 (button), 807:8412 (flex), 807:8475 (grid),
 * 807:8521 (media), 807:8614 (input), 32:2 (container fallback) — top to
 * bottom, including the collapsed tail.
 *
 * Section visibility is enforced by the registry's `shouldRender` predicates,
 * so a profile may list more than an element shows (flex sits in the
 * container profile but only renders once the container is a flex box).
 *
 * Element type strings come from the canonical `ElementType` union in
 * `shared/types/element.ts`. Container fallback catches any type not listed.
 *
 * @license BSD-3-Clause
 */

import type { SectionId } from "../sections/registry";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A profile is the order its element's sections appear in, top to bottom.
 * Which of them open on first sight is not encoded here — that is whichever
 * sections carry a value on the element (see `useInspectorSections`), which is
 * what every profile board's footer counts.
 */
export interface ElementProfile {
  /** Ordered section ids, board order. */
  order: SectionId[];
  /** Sections this profile hides on Beginner (behind "Show all") on top of
   *  the registry's ADVANCED tag — e.g. a container's numeric SIZE, whose
   *  Fill/Hug modes LAYOUT already carries (board 4428:141170). */
  advanced?: readonly SectionId[];
}

/** Hidden on Beginner for this profile: registry-ADVANCED or listed here. */
export function isAdvancedIn(profile: ElementProfile, id: SectionId, registryTier: string | undefined): boolean {
  return registryTier === "advanced" || Boolean(profile.advanced?.includes(id));
}

// ============================================================================
// PROFILES
// ============================================================================

/** Generic container fallback — plain divs, sections, and any type not
 *  registered below. Board 32:2: layout, spacing, typography, background,
 *  border, effects. `flex` / `grid` ride along for containers the user has
 *  turned into one; both hide until then. */
const CONTAINER_PROFILE: ElementProfile = {
  order: [
    "layout",
    "flex",
    "grid",
    "size",
    "spacing",
    "typography",
    "background",
    "border",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    "visibility",
    // Board 4428:141642: LINK sits between VISIBILITY and CONTENT. Rendered
    // only for LINKABLE_TYPES (section registry gate).
    "link",
    "content",
    "element-properties",
    "css-classes",
  ],
  advanced: ["size"],
};

/** Text-like elements — board 807:8342. Typography leads; the board draws no
 *  Layout or Corner radius row for text. */
const TEXT_PROFILE: ElementProfile = {
  order: [
    "typography",
    "spacing",
    "size",
    "background",
    "border",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    // Settings order, boards 6883:75643 / 76283: VISIBILITY → LINK → CONTENT.
    "visibility",
    "link",
    "content",
    "element-properties",
    "css-classes",
  ],
};

/** Explicit flex container — board 807:8412. Layout, then Flexbox. */
const FLEX_PROFILE: ElementProfile = {
  order: [
    "layout",
    "flex",
    "size",
    "spacing",
    "background",
    "border",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    "visibility",
    "content",
    "element-properties",
    "css-classes",
  ],
  advanced: ["size"],
};

/** Explicit grid container — board 807:8475. Columns is a grid underneath, so
 *  it reuses this profile. */
const GRID_PROFILE: ElementProfile = {
  order: [
    "layout",
    "grid",
    "size",
    "spacing",
    "background",
    "border",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    "visibility",
    "content",
    "element-properties",
    "css-classes",
  ],
  advanced: ["size"],
};

/** Image / video / icon / lottie / svg / audio / embeds — board 807:8521.
 *  Size leads. No Link: LinkSection's own gate is link/button/a/cta, so the
 *  entry never reached the column and only inflated the footer's denominator
 *  past the board's "of 12". */
const MEDIA_PROFILE: ElementProfile = {
  order: [
    "size",
    "spacing",
    "background",
    "border",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    "visibility",
    "content",
    "element-properties",
    "css-classes",
  ],
};

/** Button / link / CTA — board 807:8567. Typography and Background lead;
 *  Link sits low, after Animation. */
const BUTTON_PROFILE: ElementProfile = {
  order: [
    "typography",
    "background",
    "border",
    "spacing",
    "size",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "interactions",
    // Settings order, board 6883:76283: VISIBILITY → LINK → CONTENT.
    "visibility",
    "link",
    "content",
    "element-properties",
    "css-classes",
  ],
};

/** Input / textarea / select — board 807:8614. Typography then Border, and
 *  Element properties (name, placeholder, validation) is promoted above the
 *  behaviour sections. */
const INPUT_PROFILE: ElementProfile = {
  order: [
    "typography",
    "border",
    "spacing",
    "size",
    "background",
    "opacity",
    "shadow",
    "blur",
    "effects",
    "element-properties",
    "interactions",
    "visibility",
    "content",
    "css-classes",
  ],
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
  /* Boards 4428:141878 / 4428:142450: FIELDS / SLIDES lead the Settings tab. */
  form: { ...CONTAINER_PROFILE, order: ["form-fields", ...CONTAINER_PROFILE.order] },
  list: CONTAINER_PROFILE,
  table: CONTAINER_PROFILE,
  header: CONTAINER_PROFILE,
  footer: CONTAINER_PROFILE,
  nav: CONTAINER_PROFILE,
  navbar: CONTAINER_PROFILE,
  slider: { ...CONTAINER_PROFILE, order: ["slides", ...CONTAINER_PROFILE.order] },
  testimonials: CONTAINER_PROFILE,
  accordion: CONTAINER_PROFILE,
  custom: CONTAINER_PROFILE,
  spacer: CONTAINER_PROFILE,
  divider: CONTAINER_PROFILE,
  progress: CONTAINER_PROFILE,
  countdown: CONTAINER_PROFILE,
  "product-card": CONTAINER_PROFILE,
  "product-grid": CONTAINER_PROFILE,
  /* G3-079: a container whose CONTENT is its collection — COLLECTION takes
     the Static / From CMS row's place. */
  "collection-list": {
    ...CONTAINER_PROFILE,
    order: CONTAINER_PROFILE.order.map((id) => (id === "content" ? "collection" : id)),
  },
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
