/**
 * A low-alpha WHITE ground is a dark-theme value. In this chrome it paints
 * nothing.
 *
 * The editor flipped from dark to light in the 2026-04-18 theme unification.
 * Constants files were repointed at the light tokens — `CANVAS_COLORS` carries a
 * note saying it was "one edit for twenty-six call sites" — but literals written
 * inline at the call sites were not, and they are silent: nothing throws, no
 * gate fires (Gate 16 ratchets HEX, and `rgba()` is not hex), and the element
 * still has a background. It is simply the same colour as what is behind it.
 *
 * Three survived until 2026-08-25, all found by measuring rather than reading:
 *
 *   - the Compare view's Visual/Semantic pill group — `rgba(255,255,255,0.04)`
 *     measured against a `rgb(255,255,255)` panel; only its border was visible
 *   - the canvas backdrop's dot grid — `rgba(255,255,255,0.03)` over
 *     `--bk-bg-panel`, which the token file sets to `#FFFFFF`. The grid the
 *     design calls for had drawn nothing since the flip
 *   - `CanvasButton`'s default variant — `rgba(255,255,255,0.06)` on a light card
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Surfaces that are genuinely dark or coloured, where a white veil is correct. */
const ALLOWED = [
  // A phone/tablet bezel is drawn dark on purpose; the highlight sits on the
  // frame, not on the panel behind it.
  "canvas/DeviceFramePreview.tsx",
  // The multi-select badge is painted in the accent and labelled `onPrimary`.
  // Its clear button is the standard lighter spot on a coloured chip.
  "canvas/styled/SelectionStyles.ts",
  // Not chrome — the raw HTML of the dark marketing templates a CUSTOMER
  // inserts. Their palette is the template's, and this test has no say in it.
  "sidebar/tabs/templates/templatesData.ts",
];

const ROOT = join(__dirname, "..");
const EXT = /\.(tsx?|css)$/;

/* Matches the LITERAL, not the property it is assigned to.
   An earlier version of this test anchored on `background...rgba(...)` on one
   line and was negative-tested three ways — two mutations failed it, and the
   third, restoring the canvas dot grid, PASSED. That value lives inside a
   multi-line template literal, so `backgroundImage:` and the `rgba()` sit on
   different lines and a per-line regex never saw them together. A guard that
   misses the exact bug it was written for is worse than no guard, so the
   property anchor is gone: below 0.5 alpha, white has no legitimate use on this
   chrome's surfaces, whatever it is assigned to. */
const WHITE_VEIL = /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?\.[0-4]\d*\s*\)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "design-system") continue;
      walk(full, out);
    } else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

/** Comments describe the bug; `var(--token, fallback)` never reaches the paint
 *  while the token is defined. Neither is a violation, so neither is scanned. */
function strippable(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    /* One nesting level, because the shape being excluded is exactly
       `var(--bk-border, rgba(255,255,255,0.08))` — an inner `rgba(...)` puts
       parens inside the parens, and a `[^()]*` body never matches it. */
    .replace(/var\((?:[^()]|\([^()]*\))*\)/g, "var()");
}

describe("no dark-theme white veil is used as a ground in light chrome", () => {
  it("finds none outside the allowlist", () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = file.slice(ROOT.length + 1);
      if (ALLOWED.some((a) => rel === a)) continue;
      const body = strippable(readFileSync(file, "utf8"));
      for (const [i, line] of body.split("\n").entries()) {
        if (WHITE_VEIL.test(line)) offenders.push(`${rel}:${i + 1} — ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /* The allowlist is a claim about specific files. If one is renamed or deleted
     the entry becomes a silent permanent exemption for nothing. */
  it("every allowlisted file still exists", () => {
    for (const rel of ALLOWED) expect(() => statSync(join(ROOT, rel))).not.toThrow();
  });
});
