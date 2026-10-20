/**
 * One site that exercises every style layer the class-first model touches
 * (CLASS-FIRST-SPEC §4, §6 P0): element base styles, tablet and mobile
 * overrides, :hover / :focus states, a per-breakpoint hide, user classes in
 * mixed case, imported class rules (base, combo, state, tablet), tag rules,
 * and a deleted element's leftover rules. Class and tag rules are written
 * AFTER the element rules they compete with, so a layer sort is visible in
 * the output.
 *
 * Shared by the legacy golden test (byte-identical output, flags off) and
 * the class-mode parity test.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine/Composer";
import { elementSelector } from "@/shared/utils/elementSelector";
import { ExportEngine } from "@/engine/export/ExportEngine";

const TABLET = "(max-width: 1023px)";
const MOBILE = "(max-width: 767px)";

export function loadStyleModelSite(composer: Composer): void {
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: {
          id: "root1", type: "container", tagName: "div", styles: { padding: "8px" },
          children: [
            {
              id: "heroTitle", type: "heading", tagName: "h1", content: "Hello",
              classes: ["hero-title"],
              styles: { color: "rgb(10, 20, 30)", "font-size": "48px" },
              children: [],
            },
            {
              id: "noteText", type: "paragraph", tagName: "p", content: "Note",
              classes: ["Card", "note"],
              styles: { "line-height": "1.5", "--hide-mobile": "true" },
              children: [],
            },
            {
              id: "cardBox", type: "container", tagName: "div", classes: ["card", "note"],
              children: [
                { id: "cardText", type: "paragraph", tagName: "p", content: "Plain", children: [] },
              ],
            },
            {
              id: "ctaButton", type: "button", tagName: "button", content: "Go",
              styles: { background: "rgb(26, 86, 219)" },
              children: [],
            },
          ],
        },
      },
      {
        id: "about", name: "About", slug: "about",
        root: {
          id: "root2", type: "container", tagName: "div",
          children: [
            { id: "aboutText", type: "paragraph", tagName: "p", content: "About", styles: { color: "rgb(40, 50, 60)" }, children: [] },
          ],
        },
      },
    ],
  } as never);

  const s = composer.styles;
  s.setBreakpointStyle("heroTitle", "tablet", { "font-size": "36px" });
  s.setBreakpointStyle("heroTitle", "mobile", { "font-size": "28px" });
  s.setRule(elementSelector("heroTitle"), { color: "rgb(11, 21, 31)" }, { pseudo: ":hover" });
  s.setRule(elementSelector("ctaButton"), { outline: "2px solid rgb(0, 0, 0)" }, { pseudo: ":focus", mediaQuery: TABLET });
  s.setBreakpointStyle("aboutText", "mobile", { "font-size": "19px" });
  // A deleted element's rules (they stay in the StyleEngine today).
  s.setRule(elementSelector("goneEl"), { outline: "7px dotted rgb(1, 2, 3)" });
  s.setRule(elementSelector("goneEl"), { "font-size": "9px" }, { mediaQuery: TABLET });

  // Imported class and tag rules, after the element rules.
  s.setRule(".hero-title", { color: "rgb(200, 0, 0)", "letter-spacing": "1px" });
  s.setRule(".hero-title", { color: "rgb(0, 200, 0)" }, { pseudo: ":hover" });
  s.setRule(".hero-title", { "font-size": "30px", "letter-spacing": "2px" }, { mediaQuery: TABLET });
  s.setRule(".card.note", { border: "1px solid rgb(9, 9, 9)" });
  s.setRule(".card", { padding: "24px", border: "2px solid rgb(5, 5, 5)" });
  s.setRule(".card", { padding: "12px" }, { mediaQuery: MOBILE });
  s.setRule("h1", { "font-weight": "600", color: "rgb(1, 1, 1)" });
  s.setRule("p", { margin: "0 0 4px" });
}

function canvasSheet(composer: Composer, device: "desktop" | "tablet" | "mobile"): string {
  composer.setDevice(device);
  composer.styles.flush();
  return document.getElementById("aquibra-styles")?.textContent ?? "";
}

/** Every emitted surface, by golden file name. */
export async function emittedSurfaces(composer: Composer): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const publish = await new ExportEngine(composer).exportAllPages({
    format: "html", minify: true, rootAbsoluteHrefs: true, inlineStyles: true,
  });
  for (const f of publish.files) out[`publish-${f.name}`] = f.content;
  const zip = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  for (const f of zip.files) out[`zip-${f.name}`] = f.content;
  out["single-file.css"] = new ExportEngine(composer).generateCSS({ minify: false });
  out["preview.html"] = composer.exportHTML().html;
  out["preview.css"] = composer.exportHTML().css;
  for (const device of ["desktop", "tablet", "mobile"] as const) out[`canvas-${device}.css`] = canvasSheet(composer, device);
  return out;
}
