#!/usr/bin/env node
/**
 * Dry run of the stored-markup sanitizer (S-1a, audit A19-1) over the LOCAL
 * database: how many nodes and attributes would the new tag/attribute
 * allowlist change, grouped by reason. Nothing is written — every query is a
 * `findMany` with a `select`.
 *
 * The allowlist rewrites anything off it (`tagName` → "div", attribute
 * dropped). Before shipping it, this answers "does real content change?" —
 * audio, video, svg children, iframe embeds, upper-case DIV. A legitimate tag
 * showing up under `tag` means the allowlist in
 * `packages/shared/schemas/element-markup.ts` needs extending first.
 *
 * Covers pages.blocks, templates.pages[].blocks, site_components.payload,
 * site_versions.payload (page roots AND snapshot.styles), sites.projectStyles
 * (server rules, `lib/sanitize-blocks.ts`) and user_templates.html
 * (DOMPurify). `id` counts element ids that would be regenerated;
 * `style-rule` counts project style rules dropped for their selector or media
 * query. The totals line also says how many of each were scanned. The editor's `isSafeAttrValue` is
 * stricter on URL schemes and now checks srcset/formaction/xlink:href/poster
 * too; it cannot be imported here (ESM editor → CJS shared under tsx), so
 * every stored value of those four is listed as `review-url-attr` for a
 * human to judge. `content` sanitizing predates S-1a (DOMPurify on rich
 * text); it is split into real removals and `content-reserialised-only`.
 *
 * Refuses any DATABASE_URL whose host is not localhost.
 *
 * Run (tsx resolves the TS sources and the `@buildrik/shared` path alias):
 *   npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/sanitize-dry-run.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";

// The TS sources are CommonJS to tsx (the root package has no "type"), and
// their named exports are invisible to an ESM `import`; require them instead.
// DOMPurify is required too so `DOMPurify.removed` is the sanitizer's instance.
const require = createRequire(import.meta.url);
const {
  sanitizeBlocks,
  sanitizeComponentPayload,
  sanitizeProjectStyles,
  sanitizeTemplateHtml,
  sanitizeVersionPayload,
} = require("../../lib/sanitize-blocks.ts");
const DOMPurify = require("isomorphic-dompurify");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  return line?.replace(/^\s*DATABASE_URL\s*=\s*/, "").replace(/^["']|["']\s*$/g, "").trim();
}

const url = databaseUrl();
if (!url) {
  console.error("No DATABASE_URL (env or .env.local).");
  process.exit(1);
}
const host = new URL(url).hostname;
if (!LOCAL_HOSTS.has(host)) {
  console.error(`Refusing non-local database host "${host}". This dry run is for the local dev DB only.`);
  process.exit(1);
}

/** reason → { count, examples: Map<detail, n> } */
const tally = new Map();
const touched = new Map(); // source → Set of row ids that would change
function record(source, rowId, reason, detail) {
  // A `content` change is reported on any string difference, and DOMPurify
  // re-serialises (quote style, entity form). Say what it actually removed.
  if (reason === "content" && DOMPurify.removed.length === 0) reason = "content-reserialised-only";
  const key = `${source} ${reason}`;
  const entry = tally.get(key) ?? { count: 0, details: new Map() };
  entry.count++;
  entry.details.set(detail, (entry.details.get(detail) ?? 0) + 1);
  tally.set(key, entry);
  if (!touched.has(source)) touched.set(source, new Set());
  touched.get(source).add(rowId);
}

/** Every element-like node under `value` (roots, children), for the client pass. */
function* nodes(value) {
  if (Array.isArray(value)) {
    for (const v of value) yield* nodes(v);
  } else if (value && typeof value === "object") {
    yield value;
    if (Array.isArray(value.children)) yield* nodes(value.children);
  }
}

const NEWLY_CHECKED_URL_ATTRS = new Set(["srcset", "formaction", "xlink:href", "poster"]);
function clientPass(source, rowId, roots) {
  for (const node of nodes(roots)) {
    const attrs = node.attributes;
    if (!attrs || typeof attrs !== "object") continue;
    for (const [name, value] of Object.entries(attrs)) {
      if (NEWLY_CHECKED_URL_ATTRS.has(name.toLowerCase())) {
        record(source, rowId, "review-url-attr", `${name}=${String(value).slice(0, 60)}`);
      }
    }
  }
}

/** How many selectors, media queries and element ids were looked at. */
const scanned = { styleRuleSelectors: 0, styleRuleMediaQueries: 0, elementIds: 0 };
function countRules(styles) {
  if (!Array.isArray(styles)) return;
  for (const r of styles) {
    if (!r || typeof r !== "object") continue;
    if (r.selector !== undefined) scanned.styleRuleSelectors++;
    if (r.mediaQuery) scanned.styleRuleMediaQueries++;
  }
}
function countIds(roots) {
  for (const node of nodes(roots)) if (node.id !== undefined) scanned.elementIds++;
}

const prisma = new PrismaClient({ datasources: { db: { url } } });
const counts = {};
try {
  const pages = await prisma.page.findMany({ select: { id: true, blocks: true } });
  counts.pages = pages.length;
  for (const p of pages) {
    sanitizeBlocks(structuredClone(p.blocks), (reason, detail) => record("pages", p.id, reason, detail));
    clientPass("pages", p.id, p.blocks);
    countIds(p.blocks);
  }

  const templates = await prisma.template.findMany({ select: { id: true, pages: true } });
  counts.templates = templates.length;
  for (const t of templates) {
    const tPages = Array.isArray(t.pages) ? t.pages : [];
    for (const tp of tPages) {
      const blocks = tp && typeof tp === "object" ? tp.blocks : undefined;
      sanitizeBlocks(structuredClone(blocks), (reason, detail) => record("templates", t.id, reason, detail));
      clientPass("templates", t.id, blocks);
    }
  }

  const components = await prisma.siteComponent.findMany({ select: { id: true, payload: true } });
  counts.site_components = components.length;
  for (const c of components) {
    sanitizeComponentPayload(structuredClone(c.payload), (reason, detail) =>
      record("site_components", c.id, reason, detail)
    );
    clientPass("site_components", c.id, c.payload?.masterTree);
  }

  const versions = await prisma.siteVersion.findMany({ select: { id: true, payload: true } });
  counts.site_versions = versions.length;
  for (const v of versions) {
    sanitizeVersionPayload(structuredClone(v.payload), (reason, detail) =>
      record("site_versions", v.id, reason, detail)
    );
    const vPages = v.payload?.snapshot?.pages;
    if (Array.isArray(vPages)) {
      clientPass("site_versions", v.id, vPages.map((pg) => pg?.root));
      countIds(vPages.map((pg) => pg?.root));
    }
    countRules(v.payload?.snapshot?.styles);
  }

  const sites = await prisma.site.findMany({ select: { id: true, projectStyles: true } });
  counts.sites = sites.length;
  for (const site of sites) {
    sanitizeProjectStyles(structuredClone(site.projectStyles), (reason, detail) =>
      record("sites.projectStyles", site.id, reason, detail)
    );
    countRules(site.projectStyles);
  }

  const userTemplates = await prisma.userTemplate.findMany({ select: { id: true, html: true } });
  counts.user_templates = userTemplates.length;
  for (const u of userTemplates) {
    sanitizeTemplateHtml(u.html);
    // DOMPurify re-serialises, so a string diff over-counts; its removal log does not.
    if (DOMPurify.removed.length > 0) record("user_templates", u.id, "html", `${DOMPurify.removed.length} removal(s)`);
  }
} finally {
  await prisma.$disconnect();
}

console.log(`Local DB ${host} — rows scanned:`, counts);
console.log("Values scanned (pages + versions + projectStyles):", scanned);
if (tally.size === 0) {
  console.log("No node or attribute would change.");
} else {
  console.log("\nWould change (source reason: count):");
  for (const [key, { count, details }] of [...tally].sort()) {
    console.log(`  ${key}: ${count}`);
    for (const [detail, n] of [...details].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      console.log(`      ${n}× ${detail}`);
    }
  }
  console.log("\nRows that would change:", Object.fromEntries([...touched].map(([s, ids]) => [s, ids.size])));
}
