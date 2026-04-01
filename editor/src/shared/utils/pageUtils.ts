/**
 * Page naming utilities — smart defaults for new pages.
 * @license BSD-3-Clause
 */

export interface PageLike {
  name: string;
}

/**
 * Returns a smart default name for a new page based on existing pages.
 * - 0 existing → "Home"
 * - 1 existing → "About"
 * - 2+ existing → "Page N" where N = count + 1
 */
export function getDefaultPageName(existingPages: PageLike[]): string {
  const count = existingPages.length;
  if (count === 0) return "Home";
  if (count === 1) return "About";
  return `Page ${count + 1}`;
}
