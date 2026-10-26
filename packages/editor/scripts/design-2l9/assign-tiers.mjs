#!/usr/bin/env node
/**
 * Priority tiers for boards-2l9.json (owner, 2026-10-27: "kar lo" to working
 * the surfaces people use every day first). Re-run after the manifest gains
 * rows; it only writes the `tier` field.
 *
 *   P1 — every-day editing: shell, canvas, Layers, Pages, Add, Inspector,
 *        CMS records and binding, the publish tray, Play journeys F1–F4.
 *   P2 — the rest of the product surface: Brand, Assets, Components,
 *        Templates, resources, recovery, Site settings screens, site menu
 *        and palette, the other CMS screens, Play F5 outside the approval code.
 *   P3 — later: ruler guides, trash/restore, form-submission and settings
 *        state grids, the client review page, permissions matrix, analytics,
 *        plans/trial, collaboration, visitor form runtime, class-first,
 *        the client approval code.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const has = (name, ...words) => words.some((w) => name.toLowerCase().includes(w));

/** The tier of one manifest row, from its family and board name. */
export function tierOf({ family, name }) {
  if (has(name, "guide", "ruler", "recently deleted", "trash", " deleted")) return "P3";
  switch (family) {
    case "shell-components":
      return "P1";
    case "play":
      if (/F5\.(2\d|3[0-3])/.test(name) || has(name, "approval code")) return "P3";
      return /\bF5\b|F5\./.test(name) ? "P2" : "P1";
    case "editor":
      return /^B3-N/.test(name) ? "P2" : "P1";
    case "inspector":
      return /^B4-V/.test(name) || /^CF\d/.test(name) ? "P3" : "P1";
    case "cms":
      if (/^B5-R/.test(name)) return "P3";
      return /^B5-[DC]/.test(name) ? "P1" : "P2";
    case "site-delivery":
      if (/^B8-PB/.test(name)) return "P1";
      if (/^(GAP-|Permissions|B8-AN)/.test(name)) return "P3";
      return "P2";
    case "recovery":
      return /^B7-(P|CL)/.test(name) ? "P3" : "P2";
    default:
      return "P2";
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = new URL("../conformance/boards-2l9.json", import.meta.url);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  for (const row of manifest.boards) row.tier = tierOf(row);
  writeFileSync(file, JSON.stringify(manifest, null, 1) + "\n");
}
