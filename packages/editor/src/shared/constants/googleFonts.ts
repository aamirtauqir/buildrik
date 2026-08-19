/**
 * The Google families the editor offers, and the ONLY ones the export may name
 * in a stylesheet link.
 *
 * This list used to live inside `services/GoogleFontsService`, which injects
 * <link> elements into the EDITOR. The export could not reach it — `engine/`
 * may import `shared/` only — so a customer picked Poppins from the picker,
 * saw Poppins in the editor, published, and got the generic sans: the exported
 * page named the family and loaded nothing. One catalogue, two consumers.
 *
 * @license BSD-3-Clause
 */

export type GoogleFontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "handwriting"
  | "monospace";

export interface GoogleFontEntry {
  family: string;
  variants: string[];
  category: GoogleFontCategory;
}

export const GOOGLE_FONT_CATALOGUE: GoogleFontEntry[] = [
  { family: "Inter", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Roboto", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Open Sans", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Lato", variants: ["400", "700"], category: "sans-serif" },
  { family: "Montserrat", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Poppins", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Source Sans Pro", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Nunito", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Raleway", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Ubuntu", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Playfair Display", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "Merriweather", variants: ["400", "700"], category: "serif" },
  { family: "Lora", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "PT Serif", variants: ["400", "700"], category: "serif" },
  { family: "Crimson Pro", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "Fira Code", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "JetBrains Mono", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "Source Code Pro", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "Roboto Mono", variants: ["400", "500", "700"], category: "monospace" },
  { family: "Dancing Script", variants: ["400", "500", "600", "700"], category: "handwriting" },
  { family: "Pacifico", variants: ["400"], category: "handwriting" },
  { family: "Caveat", variants: ["400", "500", "600", "700"], category: "handwriting" },
  { family: "Oswald", variants: ["400", "500", "600", "700"], category: "display" },
  { family: "Bebas Neue", variants: ["400"], category: "display" },
  { family: "Anton", variants: ["400"], category: "display" },
];
