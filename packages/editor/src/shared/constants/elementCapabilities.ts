/**
 * Element capabilities — what each element type IS, for the Inspector (v4,
 * build plan §1.1). One row per `ElementType`; TypeScript refuses a union
 * member without one, the way `ELEMENT_RULES` (shared/utils/nesting/rules.ts)
 * does, so a new type cannot silently fall back to "Container".
 *
 * Presence of an Inspector section is read off this table, never off a
 * per-type list of sections: the section order is fixed per tab
 * (`editor/inspector/config/sectionOrder.ts`) and a section shows when the
 * type has the capability it edits.
 *
 * Also the ONE list of linkable and CMS-bindable types (R-2) — the canvas menu's
 * "Bind to CMS field…" row and the Link section both read it.
 *
 * @license BSD-3-Clause
 */

import type { ElementType } from "../types/element";

/** Which defining block heads the Style tab (board 1's "Heading" block).
 *  `product` is reserved for the ecommerce arc (Q7) and has no body yet. */
export type TypeBlockId =
  | "heading"
  | "text"
  | "link"
  | "label"
  | "button"
  | "input"
  | "choice"
  | "image"
  | "video"
  | "audio"
  | "svg"
  | "video-embed"
  | "map-embed"
  | "lottie"
  | "countdown"
  | "progress"
  | "accordion"
  | "flex"
  | "grid"
  | "product";

/** Behaviour-tab sections only some types carry (boards 19, 20). */
export type BehaviourSectionId = "form-fields" | "form-settings" | "slides" | "slider-settings" | "collection";

export interface ElementCapabilities {
  /** The type block, or null when the type has no defining settings (containers). */
  typeBlock: TypeBlockId | null;
  /** Layout section (display, position) — containers (board 17). */
  layout: boolean;
  /** "open": Typography section; "inside": the closed "Text inside" section
   *  (board 17; owner answer 1 extends it to button, input and checkbox);
   *  "none": neither. */
  typography: "open" | "inside" | "none";
  /** Link section (boards 6, 7, 18). */
  link: boolean;
  /** CMS binding section and the canvas "Bind to CMS field…" row (R-2). */
  cmsBindable: boolean;
  /** Extra Behaviour sections, in the tab's fixed order. */
  behaviourSections: readonly BehaviourSectionId[];
  /** A child that only exists inside its parent's structure (R-4): minimal
   *  panel — no Link, no CMS. */
  isStructuralChild: boolean;
}

const NONE: readonly BehaviourSectionId[] = [];

const container = (over: Partial<ElementCapabilities> = {}): ElementCapabilities => ({
  typeBlock: null,
  layout: true,
  typography: "inside",
  link: false,
  cmsBindable: false,
  behaviourSections: NONE,
  isStructuralChild: false,
  ...over,
});

const text = (typeBlock: TypeBlockId, over: Partial<ElementCapabilities> = {}): ElementCapabilities => ({
  typeBlock,
  layout: false,
  typography: "open",
  link: false,
  cmsBindable: true,
  behaviourSections: NONE,
  isStructuralChild: false,
  ...over,
});

const media = (typeBlock: TypeBlockId | null, over: Partial<ElementCapabilities> = {}): ElementCapabilities => ({
  typeBlock,
  layout: false,
  typography: "none",
  link: false,
  cmsBindable: false,
  behaviourSections: NONE,
  isStructuralChild: false,
  ...over,
});

const field = (typeBlock: TypeBlockId): ElementCapabilities => ({
  typeBlock,
  layout: false,
  typography: "inside",
  link: false,
  cmsBindable: false,
  behaviourSections: NONE,
  isStructuralChild: false,
});

export const ELEMENT_CAPABILITIES: Record<ElementType, ElementCapabilities> = {
  // Text (boards 1, 4, 7)
  heading: text("heading"),
  text: text("text"),
  paragraph: text("text"),
  label: text("label", { cmsBindable: false }),
  link: text("link", { link: true }),

  // Button (boards 5, 6) — Text inside, closed (owner answer 1)
  button: text("button", { typography: "inside", link: true }),

  // Form fields (boards 14, 15) — Text inside, closed (owner answer 1)
  input: field("input"),
  textarea: field("input"),
  select: field("input"),
  checkbox: field("choice"),
  radio: field("choice"),
  switch: field("choice"),
  upload: field("input"),

  // Media (boards 8, 9, 10)
  image: media("image", { cmsBindable: true }),
  video: media("video"),
  audio: media("audio"),
  svg: media("svg"),
  icon: media("svg"),
  lottie: media("lottie"),
  "video-embed": media("video-embed"),
  "map-embed": media("map-embed"),
  spacer: media(null),
  divider: media(null),

  // Widgets (boards 11, 12, 13) — they carry text, so Text inside stays
  // reachable (closed) rather than dropping the capability.
  countdown: media("countdown", { typography: "inside" }),
  progress: media("progress", { typography: "inside" }),
  accordion: container({ typeBlock: "accordion" }),

  // Layout primitives (board 16) — the type block carries the layout.
  flex: container({ typeBlock: "flex", layout: false }),
  stack: container({ typeBlock: "flex", layout: false }),
  grid: container({ typeBlock: "grid", layout: false }),
  columns: container({ typeBlock: "grid", layout: false }),

  // Containers (boards 17, 18)
  container: container({ link: true }),
  section: container({ link: true }),
  card: container({ link: true }),
  cta: container({ link: true }),
  hero: container(),
  features: container(),
  header: container(),
  footer: container(),
  nav: container(),
  navbar: container(),
  pricing: container(),
  social: container(),
  testimonials: container(),
  tabs: container(),
  list: container(),
  table: container(),
  gallery: container(),
  custom: container(),
  "list-item": container({ isStructuralChild: true }),

  // Behaviour-led containers (boards 19, 20)
  form: container({ behaviourSections: ["form-fields", "form-settings"] }),
  slider: container({ behaviourSections: ["slides", "slider-settings"] }),
  "collection-list": container({ behaviourSections: ["collection"] }),

  // Ecommerce (Q7 — deferred; containers until their arc)
  "product-card": container(),
  "product-grid": container(),
  "product-detail": container(),
};

/** A stored type the union does not know (old data) reads as a container. */
const FALLBACK = container();

export function capabilitiesFor(type: string): ElementCapabilities {
  return (ELEMENT_CAPABILITIES as Record<string, ElementCapabilities | undefined>)[type] ?? FALLBACK;
}

const typesWhere = (pred: (c: ElementCapabilities) => boolean): ReadonlySet<string> =>
  new Set(
    (Object.keys(ELEMENT_CAPABILITIES) as ElementType[]).filter(
      (t) => pred(ELEMENT_CAPABILITIES[t]) && !ELEMENT_CAPABILITIES[t].isStructuralChild,
    ),
  );

/** Types the Link section edits (boards 6, 7, 18). */
export const LINKABLE_TYPES: ReadonlySet<string> = typesWhere((c) => c.link);

/** Types the CMS can feed a field into (boards 2, 24; never 18). */
export const BINDABLE_TYPES: ReadonlySet<string> = typesWhere((c) => c.cmsBindable);
