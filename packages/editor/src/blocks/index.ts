/**
 * blocks/ — Drag-and-drop block definitions and registry
 * Integration: L2 — blockRegistry is SSOT for all block configs
 *
 * @license BSD-3-Clause
 */

// Basic Blocks
export {
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

// Form Blocks
export {
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

// Layout Blocks
export {
  sectionBlockConfig,
  columns2BlockConfig,
  columns3BlockConfig,
  gridBlockConfig,
  flexBlockConfig,
} from "./Layout";

// Media Blocks
export {
  imageBlockConfig,
  videoBlockConfig,
  audioBlockConfig,
  svgBlockConfig,
  lottieBlockConfig,
  iconBlockConfig,
  galleryBlockConfig,
} from "./Media";

// Section Blocks
export {
  heroBlockConfig,
  featuresBlockConfig,
  footerBlockConfig,
  navbarBlockConfig,
  ctaBlockConfig,
} from "./Sections";

// Component Blocks
export {
  cardBlockConfig,
  sliderBlockConfig,
  testimonialsBlockConfig,
  pricingBlockConfig,
  progressBlockConfig,
  countdownBlockConfig,
  contactFormBlockConfig,
} from "./Components";

// Block Registry (SSOT)
export { blockDefinitions, getBlockById, getBlockDefinitions, insertBlock } from "./blockRegistry";
