/**
 * Central block registry and insertion helpers
 * Imports block configs from category folders
 * @license BSD-3-Clause
 */
import type { Composer } from "../engine";
import type { ElementType } from "../shared/types";
import { sanitizeHTML } from "../shared/utils/html";
import { canNestElement } from "../shared/utils/nesting";
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

    // If block has a build function, use it (returns element ID for auto-selection)
    if (block.build) {
      const builtElementId = block.build(composer, parentId, dropIndex);
      return builtElementId;
    }

    // If content is HTML, sanitize and insert it
    if (typeof block.content === "string" && HTML_CONTENT_PATTERN.test(block.content)) {
      // Defense-in-depth: sanitize HTML to remove dangerous attributes (onclick, etc.)
      const safeContent = sanitizeHTML(block.content);
      const insertedElements = composer.elements.insertHTMLToElement(
        parentId,
        safeContent,
        dropIndex
      );
      // Return first inserted element's ID if available
      if (Array.isArray(insertedElements) && insertedElements.length > 0) {
        return insertedElements[0]?.getId?.() ?? undefined;
      }
      return undefined;
    }

    // Default: create element from type and add to parent
    const element = composer.elements.createElement(block.elementType, {
      content: typeof block.content === "string" ? block.content : undefined,
    });

    composer.elements.addElement(element, parentId, dropIndex);
    return element.getId();
  } catch {
    return undefined;
  }
}
