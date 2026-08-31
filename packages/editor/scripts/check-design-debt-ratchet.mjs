#!/usr/bin/env node
/**
 * Design-debt ratchet (2026-08-28 designer-lens arc).
 *
 * Two independent source audits (codex + subagent) counted the same debt:
 * off-brand Tailwind blues beside the token accent, ~20 font sizes against a
 * 7-step scale, palette-gray classes beside the ink tokens, and one ghost-
 * link recipe copy-pasted across 22 files. The blues were codemodded to ZERO
 * in the same arc; the populations that need judgment drain by ratchet —
 * every count may only go DOWN. Growth = build failure, the same contract as
 * the hex and styling ratchets.
 *
 * Counting is line-based per pattern, chrome TSX/TS only, tests excluded.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const RATCHETS = [
  {
    id: "offbrand-blue",
    // Tailwind stock blues impersonating the accent (#1D4ED8 ≠ #1A56DB).
    pattern: String.raw`tw:(text|bg|border|hover:text|hover:bg)-blue-[0-9]{3}`,
    baseline: 0,
  },
  {
    id: "ghost-link-incantation",
    /* The accent text-link recipe: 44 → 19 → ZERO on 2026-08-29. Every call
       site is `variant="link"` now, and the recipe itself lives once, in
       Button's own theme (chrome-ui/buttonTheme.ts — excluded below as the
       DEFINITION). Sites that differ keep only what they add: a min-height, a
       12px step, a full-width nav row's geometry. The interim class constants
       this arc introduced are deleted; a vocabulary with two spellings is the
       thing the audits were complaining about. */
    pattern: String.raw`tw:enabled:hover:underline`,
    baseline: 0,
  },
  {
    id: "offscale-font-size",
    /* Sizes the 7-step scale does not define — 86 → 67 → 42 → ZERO across
       three passes. The half-pixels (10.5/11.5/12.5, eyeballed Figma exports)
       snapped onto 11/12/13; the near-scale headings (15/17px h2/h3 and a
       ModalTitle) onto --bk-text-16; and the micro furniture (9/10px badge
       chips, inspector unit glyphs, breadcrumb separators) onto --bk-text-11,
       the scale's own floor — measured live afterwards for overflow, since a
       fixed-width badge is the one place a size bump can break a layout.
       Two paths stay excluded, for the same reason avatarTone is:
         · CatalogCard draws a MINIATURE of a component — 7/8px is the
           thumbnail's own scale, not chrome type;
         · BrandPreview / TypographySection render the USER's typefaces as
           specimens, where the size is the sample, not a chrome decision. */
    /* THREE spellings, one rule (2026-08-29): a `tw:text-[Npx]` class, an
       inline `fontSize: N`, and a `font: "500 Npx …"` shorthand string all say
       the same thing, and the first version of this gate counted only the
       first — which is how 47 off-scale sizes survived two "zero" passes. */
    pattern: String.raw`tw:text-\[(7|8|9|9\.5|10|10\.5|11\.5|12\.5|15|17|18|19|28|32)px\]|fontSize: ?(7|8|9|9\.5|10|10\.5|11\.5|12\.5|15|17|18|19|28|32)\b|font: "[^"]*\b(7|8|9|9\.5|10|10\.5|11\.5|12\.5|15|17|18|19|28|32)px`,
    baseline: 0,
  },
  {
    id: "palette-gray-any",
    /* 470 → 0 on 2026-08-29. Every shade mapped: the four with an exact ink
       twin (900/600/500/300) to the semantic tokens, and the rest — gray-400
       on decoration chevrons, a drag handle, a presence chip — to the
       GENERATED --bk-gray-* scale, which the token file has carried all
       along (CanvasBreadcrumb was already using it). Locked at zero: chrome
       has no reason to reach for a Tailwind palette class again. */
    pattern: String.raw`tw:[a-z:-]*-gray-[0-9]{2,3}`,
    baseline: 0,
  },
  {
    id: "offscale-css-font-size",
    /* The CSS layer was invisible to this gate until 2026-08-29 — it only ever
       scanned TSX — and that is where the editor's "not professional" symptom
       actually lived: 9.5px and 10.5px type in the inspector, settings and
       layers stylesheets, below the scale's 11px floor and below what anyone
       reads comfortably. All snapped onto var(--bk-text-11). Locked at 0. */
    pattern: String.raw`font(-size)?:[^;]*\b(7|8|9|9\.5|10|10\.5|11\.5|12\.5)px`,
    baseline: 0,
    css: true,
  },
];

function count(pattern, css = false) {
  try {
    const out = execSync(
      `grep -rEn ${JSON.stringify(pattern)} src/editor ${css ? "src/themes --include='*.css'" : "--include='*.tsx' --include='*.ts'"} | grep -v __tests__ | grep -v '\\.test\\.' | grep -v avatarTone.ts | grep -v buttonTheme.ts | grep -v CatalogCard.tsx | grep -v BrandPreview.tsx | grep -v TypographySection.tsx | wc -l`,
      { cwd: ROOT, encoding: "utf8", shell: "/bin/bash" },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

let failed = false;
for (const r of RATCHETS) {
  const n = count(r.pattern, r.css);
  if (n > r.baseline) {
    console.error(
      `[design-debt-ratchet] FAIL — ${r.id}: ${n} > baseline ${r.baseline}. ` +
        `This population only goes DOWN. New code uses the chrome-ui vocabulary ` +
        `(variant="link"/"ghost", TYPE_* ramp constants, var(--bk-ink*)/var(--bk-accent*)).`,
    );
    failed = true;
  } else if (n < r.baseline) {
    console.log(
      `[design-debt-ratchet] ok   ${r.id}: ${n} (baseline ${r.baseline}, drained ${r.baseline - n} — ` +
        `ratchet the baseline down in this file when convenient)`,
    );
  } else {
    console.log(`[design-debt-ratchet] ok   ${r.id}: ${n} (baseline ${r.baseline})`);
  }
}

if (failed) process.exit(1);
console.log("[design-debt-ratchet] PASS — every population at or below baseline.");
