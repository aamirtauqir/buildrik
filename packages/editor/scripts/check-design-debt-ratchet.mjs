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
    // The hand-rolled accent text-link recipe — variant="link" is the home.
    pattern: String.raw`tw:enabled:hover:underline`,
    baseline: 44,
  },
  {
    id: "offscale-font-size",
    // Sizes the 7-step scale does not define (9/10/10.5/11.5/12.5/15/17…).
    pattern: String.raw`tw:text-\[(7|8|9|10|10\.5|11\.5|12\.5|15|17|18|19)px\]`,
    baseline: 67,
  },
  {
    id: "palette-gray-text",
    // tw:text-gray-* where the ink tokens are the vocabulary.
    pattern: String.raw`tw:text-gray-[0-9]{3}`,
    baseline: 10,
  },
];

function count(pattern) {
  try {
    const out = execSync(
      `grep -rEn ${JSON.stringify(pattern)} src/editor --include='*.tsx' --include='*.ts' | grep -v __tests__ | grep -v '\\.test\\.' | grep -v avatarTone.ts | wc -l`,
      { cwd: ROOT, encoding: "utf8", shell: "/bin/bash" },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

let failed = false;
for (const r of RATCHETS) {
  const n = count(r.pattern);
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
console.log("[design-debt-ratchet] PASS — all four populations at or below baseline.");
