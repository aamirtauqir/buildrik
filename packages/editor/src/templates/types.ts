/**
 * templates/ — shared template data types.
 * Extracted from TemplateLibrary.tsx when the library modal was retired
 * (2026-07-25 P1 rail convergence — templates dissolved into the New-Page
 * flow + Insert panel per the Figma design).
 *
 * @license BSD-3-Clause
 */

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  html: string;
  css?: string;
  description?: string;
  tags?: string[];
}
