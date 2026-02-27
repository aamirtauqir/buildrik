/**
 * Element Manager Module
 * @license BSD-3-Clause
 */

// Main facade export
export { ElementManager } from "../ElementManager";

// Sub-managers (for testing and advanced usage)
export { PageManager } from "./PageManager";
export { ElementCRUD } from "./ElementCRUD";
export { HTMLParser } from "./HTMLParser";

// Types
export type { ElementManagerContext } from "./types";
