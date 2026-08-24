/**
 * Central block registry and insertion helpers
 * Imports block configs from category folders
 * @license BSD-3-Clause
 */
import type { Composer } from "../engine";
import type { Element as EngineElement } from "../engine/elements/Element";
import { getDefaultStyles, THEME } from "../shared/constants/defaultStyles";
import type { ElementType } from "../shared/types";
import { sanitizeHTML } from "../shared/utils/html";
import { canNestElement } from "../shared/utils/nesting";
import { EVENTS } from "../shared/constants";
import {
  containerBlockConfig,
  textBlockConfig,
  headingBlockConfig,
  paragraphBlockConfig,
  buttonBlockConfig,
  linkBlockConfig,
  listBlockConfig,
  dividerBlockConfig,
  rowBlockConfig,
  columnBlockConfig,
  spacerBlockConfig,
} from "./Basic";
import {
  cardBlockConfig,
  sliderBlockConfig,
  testimonialsBlockConfig,
  pricingBlockConfig,
  progressBlockConfig,
  countdownBlockConfig,
  accordionBlockConfig,
  socialIconsBlockConfig,
  contactFormBlockConfig,
  // GAP-FIX: Additional components from spec
  stackBlockConfig,
  switchBlockConfig,
  tabsBlockConfig,
  modalBlockConfig,
  tableBlockConfig,
} from "./Components";
import {
  productCardBlockConfig,
  productGridBlockConfig,
  productDetailBlockConfig,
  cartButtonBlockConfig,
} from "./Ecommerce";
import {
  formBlockConfig,
  inputBlockConfig,
  textareaBlockConfig,
  selectBlockConfig,
  checkboxBlockConfig,
  radioBlockConfig,
  fileInputBlockConfig,
  dateInputBlockConfig,
  timeInputBlockConfig,
  emailInputBlockConfig,
  passwordInputBlockConfig,
  numberInputBlockConfig,
  rangeInputBlockConfig,
  colorInputBlockConfig,
  labelBlockConfig,
  submitButtonBlockConfig,
} from "./Forms";
import {
  sectionBlockConfig,
  columns2BlockConfig,
  columns3BlockConfig,
  gridBlockConfig,
  flexBlockConfig,
} from "./Layout";
import {
  imageBlockConfig,
  videoBlockConfig,
  audioBlockConfig,
  svgBlockConfig,
  lottieBlockConfig,
  iconBlockConfig,
  galleryBlockConfig,
  videoEmbedBlockConfig,
  mapEmbedBlockConfig,
} from "./Media";
import {
  heroBlockConfig,
  featuresBlockConfig,
  footerBlockConfig,
  navbarBlockConfig,
  ctaBlockConfig,
} from "./Sections";
import type { BlockBuildConfig } from "./types";

// Re-export the shared type for consumers
export type { BlockBuildConfig };

// Alias for backward compatibility
export type BlockDefinition = BlockBuildConfig;

export const blockDefinitions: BlockDefinition[] = [
  // Basic blocks
  containerBlockConfig,
  textBlockConfig,
  headingBlockConfig,
  paragraphBlockConfig,
  buttonBlockConfig,
  linkBlockConfig,
  listBlockConfig,
  dividerBlockConfig,
  rowBlockConfig,
  columnBlockConfig,
  spacerBlockConfig,

  // Media blocks
  imageBlockConfig,
  videoBlockConfig,
  audioBlockConfig,
  svgBlockConfig,
  lottieBlockConfig,
  iconBlockConfig,
  galleryBlockConfig,
  videoEmbedBlockConfig,
  mapEmbedBlockConfig,

  // Layout blocks
  sectionBlockConfig,
  columns2BlockConfig,
  columns3BlockConfig,
  gridBlockConfig,
  flexBlockConfig,

  // Form blocks
  formBlockConfig,
  inputBlockConfig,
  textareaBlockConfig,
  selectBlockConfig,
  checkboxBlockConfig,
  radioBlockConfig,
  fileInputBlockConfig,
  dateInputBlockConfig,
  timeInputBlockConfig,
  emailInputBlockConfig,
  passwordInputBlockConfig,
  numberInputBlockConfig,
  rangeInputBlockConfig,
  colorInputBlockConfig,
  labelBlockConfig,
  submitButtonBlockConfig,

  // Section blocks
  heroBlockConfig,
  featuresBlockConfig,
  footerBlockConfig,
  navbarBlockConfig,
  ctaBlockConfig,

  // Component blocks
  cardBlockConfig,
  sliderBlockConfig,
  testimonialsBlockConfig,
  pricingBlockConfig,
  progressBlockConfig,
  countdownBlockConfig,
  accordionBlockConfig,
  socialIconsBlockConfig,
  contactFormBlockConfig,
  // GAP-FIX: Additional components from spec
  stackBlockConfig,
  switchBlockConfig,
  tabsBlockConfig,
  modalBlockConfig,
  tableBlockConfig,

  // Ecommerce blocks
  productCardBlockConfig,
  productGridBlockConfig,
  productDetailBlockConfig,
  cartButtonBlockConfig,
];

/**
 * The Components-folder subset — Insert's COMPONENTS group renders these
 * inline (board 1069:4790) while BLOCKS carries the rest. Same registry,
 * one membership list: keep it in lockstep with the "Component blocks"
 * span of blockDefinitions above.
 */
export const componentBlockDefinitions: BlockDefinition[] = [
  cardBlockConfig,
  sliderBlockConfig,
  testimonialsBlockConfig,
  pricingBlockConfig,
  progressBlockConfig,
  countdownBlockConfig,
  accordionBlockConfig,
  socialIconsBlockConfig,
  contactFormBlockConfig,
  stackBlockConfig,
  switchBlockConfig,
  tabsBlockConfig,
  modalBlockConfig,
  tableBlockConfig,
];

export function getBlockDefinitions(): BlockDefinition[] {
  return blockDefinitions;
}

export function getBlockById(id: string): BlockDefinition | undefined {
  return blockDefinitions.find((b) => b.id === id);
}

/**
 * Regex pattern to detect HTML content.
 * Matches strings that start with an HTML tag (< followed by letter/number).
 * More reliable than checking for any angle bracket.
 */
const HTML_CONTENT_PATTERN = /^<[a-z]/i;

/**
 * Inserts a block into the canvas at the specified location.
 *
 * @param composer - The composer instance
 * @param block - The block definition to insert
 * @param parentId - The ID of the parent element to insert into
 * @param dropIndex - Optional index position within the parent
 * @returns The ID of the inserted element, or undefined if insertion failed
 */
export function insertBlock(
  composer: Composer,
  block: BlockDefinition,
  parentId: string,
  dropIndex?: number
): string | undefined {
  let inserted: string | undefined;
  try {
    // Validate parent element exists
    const parent = composer.elements.getElement(parentId);
    if (!parent) {
      return undefined;
    }

    // Validate nesting rules allow this block inside the parent
    const parentType = parent.getType() as ElementType;
    if (!canNestElement(block.elementType, parentType)) {
      return undefined;
    }

    /* One exit, because all four insert doors — the Insert panel click, a
       drag onto the canvas, the block picker and the studio handler — come
       through here, and only ONE of the three branches below announced
       anything: `createElement` emits ELEMENT_CREATED, while the `build` and
       HTML branches (which is what most catalog rows use) emitted nothing at
       all. Anything downstream that wants to know an element was inserted had
       no event to listen for. */
    inserted = insertOne(composer, block, parentId, dropIndex);
  } catch {
    return undefined;
  }

  /* Announced outside the try, where "the element is in the tree" is already
     decided — the catch above is for a failed insert, not for the telling. */
  if (inserted) {
    composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: inserted, blockId: block.id });
  }
  return inserted;
}

/** The three shapes a block can take. Split out so `insertBlock` has one exit. */
/**
 * Does the SITE paint this property, rather than the element?
 *
 * `siteFontCSS` emits three rules: `body{font-family,color}`,
 * `h1..h6{font-family}` and `code,pre,kbd,samp{font-family}`. An element style
 * is emitted INLINE and beats all of them, so seeding one of those properties
 * freezes a newly inserted block onto the shipped default — change the brand
 * font afterwards and it never reaches anything dropped from the catalog.
 *
 * `font-family` is therefore always the site's. `color` is NOT: the site paints
 * only the BODY text colour, so a default that merely restates it
 * (`THEME.textPrimary`) is the site's, while a default that names a different
 * colour is the element's own design. The first version of this carve-out
 * withheld `color` outright and broke exactly that distinction — the Basic
 * Button ships as `<button class="btn">` with no inline style, so it kept its
 * accent BACKGROUND and lost its white TEXT, and the Basic Link lost its accent
 * entirely. (Codex review, 2026-08-25, second pass.)
 */
function isSiteOwned(prop: string, value: string): boolean {
  if (prop === "font-family") return true;
  return prop === "color" && value === THEME.textPrimary;
}

/**
 * The shorthand that would already have set each longhand we seed.
 *
 * Inline styles are parsed as written: `style="padding:8px"` becomes the single
 * key `padding`, so a plain `getStyle("padding-left")` reads undefined and the
 * seeding below would add a token `padding-left` AFTER it. Later key wins, so
 * the block's authored padding silently lost its sides — measurable on
 * SubmitButton, CartButton and six Forms inputs, all of which ship a `padding`
 * shorthand. Only the pairs that really do cascade are listed: `border` does
 * not set `border-radius`, so that pair is deliberately absent.
 */
const SHORTHAND_FOR: Record<string, string> = {
  "padding-top": "padding",
  "padding-right": "padding",
  "padding-bottom": "padding",
  "padding-left": "padding",
  "margin-top": "margin",
  "margin-right": "margin",
  "margin-bottom": "margin",
  "margin-left": "margin",
  "border-width": "border",
  "border-style": "border",
  "border-color": "border",
  "background-color": "background",
  "background-image": "background",
  "font-size": "font",
  "font-weight": "font",
  "font-style": "font",
  "line-height": "font",
};

/**
 * Fill in the block type's default styles on the element the catalog just
 * built, without touching anything it already carries.
 *
 * Only the inserted ROOT, and typed from the BLOCK's declared `elementType`
 * rather than from the parsed tag. Walking descendants and re-deriving their
 * type went wrong immediately: `getElementTypeFromTag` falls back to
 * "container" for anything it does not map — `li` among them — so a List block's
 * items would have been seeded with container defaults they should never have.
 */
function applyTypeDefaults(el: EngineElement, elementType: string): void {
  /* Every call is optional. This runs against whatever `insertHTMLToElement`
     returned, and the caller's try/catch turns any throw here into "the block
     did not insert", which is a far worse failure than a missing default. */
  const defaults = getDefaultStyles(elementType, el.getData?.()?.tagName);
  for (const [prop, value] of Object.entries(defaults)) {
    if (isSiteOwned(prop, value)) continue;
    if (el.getStyle?.(prop)) continue;
    const shorthand = SHORTHAND_FOR[prop];
    if (shorthand && el.getStyle?.(shorthand)) continue;
    el.setStyle?.(prop, value);
  }
}

function insertOne(
  composer: Composer,
  block: BlockDefinition,
  parentId: string,
  dropIndex?: number
): string | undefined {
  // A build function owns its own construction and returns the new id.
  if (block.build) return block.build(composer, parentId, dropIndex) ?? undefined;

  // HTML content: sanitized at this boundary before it reaches the tree.
  if (typeof block.content === "string" && HTML_CONTENT_PATTERN.test(block.content)) {
    const inserted = composer.elements.insertHTMLToElement(
      parentId,
      sanitizeHTML(block.content),
      dropIndex
    );
    /* Seed the type's default styles onto what the catalog just built.
       Most catalog blocks take THIS branch — the Heading block's content is
       `<h2>Heading</h2>` — and parsed HTML carries no style attribute, so the
       element arrived with no styles at all: the canvas rendered a dropped
       Heading at 16px, body text with a heading's label, while the inspector
       confidently read 36 because it is the one place that consults
       `getDefaultStyles`.

       Applied HERE and not in `domElementToElementData`, which parses every
       paste and every imported site as well. Element styles render inline, so
       seeding defaults during an import would out-specify the source's own
       classes and forcibly restyle somebody's existing pages. A catalog block
       has no such source to respect.

       Anything the block's own HTML specified wins — this only fills gaps. */
    if (Array.isArray(inserted)) {
      for (const el of inserted) applyTypeDefaults(el, block.elementType);
    }
    return Array.isArray(inserted) && inserted.length > 0
      ? (inserted[0]?.getId?.() ?? undefined)
      : undefined;
  }

  // Default: create from the element type and add it to the parent.
  const element = composer.elements.createElement(block.elementType, {
    content: typeof block.content === "string" ? block.content : undefined,
  });
  composer.elements.addElement(element, parentId, dropIndex);
  return element.getId();
}
