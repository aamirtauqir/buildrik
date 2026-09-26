#!/usr/bin/env node
/**
 * Backfill for X-A1 (audit-fix lane Lrt, round 1): sites whose pages share
 * element ids. Every AI-generated, template-built and seeded page stored its
 * root as "root" (and repeated section ids), and blank pages loaded with one
 * shared root. The editor keys elements by id across pages, so such a site
 * loaded as ONE tree and every save wrote the open page's content into every
 * page. The write paths are fixed; this rewrites the rows already stored.
 *
 * Per site, pages in position order: the first page keeps its ids; a later
 * page's colliding ids get the shared deterministic id
 * (`packages/shared/content/elementIds.ts` → `reidSite`, keyed by page id —
 * exactly the ids the editor now assigns on load, so a save after the
 * backfill changes nothing). Style rules keyed `[data-buildrick-id="<old>"]`
 * in `sites.projectStyles` are COPIED to the new id. Idempotent: a second
 * run finds nothing.
 *
 * form_blocks: a row is keyed by (siteId, blockId = element id) —
 * form-submission.service and the publish worker upsert on it (Ldata bug A,
 * migration 20261003100000_form_block_site_scoped_identity; `id` is a cuid
 * surrogate); no writer sets pageId, so it serves EVERY page of its site
 * carrying that id. For each renamed occurrence of a form element the row is
 * COPIED to a new row { blockId: <new id>, same site, fields and settings,
 * fresh surrogate id }; submissions stay on the original. Skipped when the
 * site already has a row for that blockId (idempotent). Needs that migration
 * applied first — the idempotency check reads the (siteId, blockId) key.
 *
 * ORDER: run this BEFORE the editor re-id ships to production. The editor
 * re-ids colliding elements on load and saves the new ids; a form element
 * re-id'd that way has no FormBlock row under its new id, so its settings
 * read as defaults until this backfill has created the copies.
 *
 * Counted, not rewritten: pages whose content is already a copy of another
 * page of the site — the collapse happened, and no id rewrite brings the lost
 * content back (restore from a version).
 * CMS bindings (`sites.projectCmsBindings`, Ldata bug B, migration
 * 20261003110000_site_project_cms_bindings) are element-keyed too: entries
 * for a renamed id are COPIED to the new id (existing keys win, so a second
 * run is a no-op). The column is new, so before the editor saves any this is
 * normally a no-op.
 *
 * A site whose transaction fails is logged `site=<id> FAILED <msg>` and
 * skipped; the run continues and exits non-zero if any site failed.
 *
 * Run with editors quiet: these writes bypass the lastEditedAt CAS
 * (saveProjectData), so an editor tab open on a site during --apply can save
 * its pre-backfill copy over the result without a conflict.
 *
 * DRY RUN by default — prints per-site counts, writes nothing.
 *   --apply                         write the changes (one transaction per site)
 *   --i-know-this-is-production     allow a non-localhost DATABASE_URL
 *
 * Run (tsx resolves the TS sources):
 *   DATABASE_URL=postgresql://…/buildrik npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/reid-duplicate-elements.mjs [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

// The TS sources are CommonJS to tsx; require them (same as sanitize-dry-run.mjs).
const require = createRequire(import.meta.url);
const { reidSite, copiesForRenamedIds, copyIdKeyedRecord } = require("../../packages/shared/content/elementIds.ts");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const PRODUCTION_OK = args.has("--i-know-this-is-production");

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  return line?.replace(/^\s*DATABASE_URL\s*=\s*/, "").replace(/^["']|["']\s*$/g, "").trim();
}

function identicalPageCount(pages) {
  const seen = new Map();
  for (const p of pages) {
    // Blank pages are alike by nature, not collapsed.
    if (!p.blocks || Array.isArray(p.blocks) || !(p.blocks.children?.length > 0)) continue;
    // Ids ignored: a collapsed page that was already re-id'd is still a copy.
    const key = JSON.stringify(p.blocks, (k, v) => (k === "id" ? undefined : v));
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let n = 0;
  for (const count of seen.values()) if (count > 1) n += count;
  return n;
}

/** The site's stored bindings with an entry copied onto every renamed id, and
 *  how many entries that added (0 = nothing to write). */
function copyBindings(stored, renames) {
  if (!stored || typeof stored !== "object") return { value: stored, added: 0 };
  let added = 0;
  const value = { ...stored };
  for (const key of ["field", "collection"]) {
    if (!stored[key]) continue;
    value[key] = copyIdKeyedRecord(stored[key], renames);
    added += Object.keys(value[key]).length - Object.keys(stored[key]).length;
  }
  return { value, added };
}

async function main() {
  const url = databaseUrl();
  if (!url) throw new Error("No DATABASE_URL (env or .env.local).");
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && !PRODUCTION_OK) {
    throw new Error(`Refusing non-localhost database host "${host}". Pass --i-know-this-is-production to run against it.`);
  }
  const dbName = new URL(url).pathname.slice(1);
  console.log(`[reid] ${APPLY ? "APPLY" : "DRY RUN"} on ${host}/${dbName}`);

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const sites = await prisma.site.findMany({
      select: { id: true, name: true, projectStyles: true, projectCmsBindings: true },
    });
    const totals = { sites: 0, pages: 0, elements: 0, styleRules: 0, formBlocks: 0, bindings: 0, identicalPages: 0, failed: 0 };

    for (const site of sites) {
      const pages = await prisma.page.findMany({
        where: { siteId: site.id },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { id: true, slug: true, blocks: true },
      });
      if (pages.length < 2) continue;
      const plan = reidSite(pages, site.projectStyles);
      const identical = identicalPageCount(pages);
      if (plan.renames.length === 0 && identical === 0) continue;

      const changedPages = plan.pages.filter((p) => p.renames.length > 0);
      const styleCopies = Array.isArray(plan.styles) && Array.isArray(site.projectStyles)
        ? plan.styles.length - site.projectStyles.length
        : 0;
      // Detection reads only the keys: a DB behind on migrations (dev lacks
      // form_blocks.successAction) still dry-runs. --apply reads full rows.
      const forms = await prisma.formBlock.findMany({ where: { siteId: site.id }, select: { id: true, blockId: true } });
      const formCopies = copiesForRenamedIds(forms, plan.renames);
      const formsOnRenamed = formCopies.length;
      const bindings = copyBindings(site.projectCmsBindings, plan.renames);

      totals.sites += plan.renames.length > 0 ? 1 : 0;
      totals.pages += changedPages.length;
      totals.elements += plan.renames.length;
      totals.styleRules += styleCopies;
      totals.formBlocks += formsOnRenamed;
      totals.bindings += bindings.added;
      totals.identicalPages += identical;
      console.log(
        `  site ${site.id} "${site.name}": pages=${pages.length} pagesToRewrite=${changedPages.length} ` +
          `elementsRenamed=${plan.renames.length} styleRulesCopied=${styleCopies} ` +
          `formBlockCopies=${formsOnRenamed} bindingsCopied=${bindings.added} identicalPages=${identical}` +
          ` [${changedPages.map((p) => p.slug).join(", ")}]`,
      );

      if (APPLY && (changedPages.length > 0 || formCopies.length > 0 || bindings.added > 0)) {
        try {
          await prisma.$transaction(async (tx) => {
            for (const page of changedPages) {
              await tx.page.update({ where: { id: page.id }, data: { blocks: page.blocks } });
            }
            if (styleCopies > 0) {
              await tx.site.update({ where: { id: site.id }, data: { projectStyles: plan.styles } });
            }
            if (bindings.added > 0) {
              await tx.site.update({ where: { id: site.id }, data: { projectCmsBindings: bindings.value } });
            }
            for (const { row, to } of formCopies) {
              const existing = await tx.formBlock.findUnique({
                where: { siteId_blockId: { siteId: site.id, blockId: to } },
                select: { id: true },
              });
              if (existing) continue;
              const full = await tx.formBlock.findUniqueOrThrow({ where: { id: row.id } });
              const { id: _id, blockId: _blockId, createdAt: _c, updatedAt: _u, ...settings } = full;
              await tx.formBlock.create({ data: { ...settings, blockId: to } });
            }
          });
        } catch (e) {
          totals.failed += 1;
          console.error(`  site=${site.id} FAILED ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    console.log(
      `[reid] totals: sites=${totals.sites} pagesToRewrite=${totals.pages} elementsRenamed=${totals.elements} ` +
        `styleRulesCopied=${totals.styleRules} formBlockCopies=${totals.formBlocks} bindingsCopied=${totals.bindings} ` +
        `identicalPages(already collapsed)=${totals.identicalPages} failedSites=${totals.failed}` +
        `${APPLY ? " — APPLIED" : " — dry run, nothing written"}`,
    );
    if (totals.failed > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`[reid] ${e.message}`);
  process.exit(1);
});
