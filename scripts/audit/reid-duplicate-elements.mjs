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
 * Not rewritten, only counted:
 *   - form_blocks whose blockId is a renamed id on that page (FormBlock.id IS
 *     the element id in form-submission.service, a primary key — owned by the
 *     forms lane);
 *   - pages whose blocks are byte-identical to another page of the site: the
 *     collapse already happened there, and no id rewrite brings the lost
 *     content back (restore from a version).
 * CMS bindings are not stored server-side (editorSaveProjectSchema has no
 * cmsBindings field), so there is nothing element-keyed to copy there.
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
const { reidSite } = require("../../packages/shared/content/elementIds.ts");

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
    if (!p.blocks || Array.isArray(p.blocks)) continue;
    // Ids ignored: a collapsed page that was already re-id'd is still a copy.
    const key = JSON.stringify(p.blocks, (k, v) => (k === "id" ? undefined : v));
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let n = 0;
  for (const count of seen.values()) if (count > 1) n += count;
  return n;
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
    const sites = await prisma.site.findMany({ select: { id: true, name: true, projectStyles: true } });
    const totals = { sites: 0, pages: 0, elements: 0, styleRules: 0, formBlocks: 0, identicalPages: 0 };

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
      const forms = await prisma.formBlock.findMany({
        where: { siteId: site.id },
        select: { pageId: true, blockId: true },
      });
      const formsOnRenamed = forms.filter((f) => f.pageId && plan.renamedIn.get(f.pageId)?.has(f.blockId)).length;

      totals.sites += plan.renames.length > 0 ? 1 : 0;
      totals.pages += changedPages.length;
      totals.elements += plan.renames.length;
      totals.styleRules += styleCopies;
      totals.formBlocks += formsOnRenamed;
      totals.identicalPages += identical;
      console.log(
        `  site ${site.id} "${site.name}": pages=${pages.length} pagesToRewrite=${changedPages.length} ` +
          `elementsRenamed=${plan.renames.length} styleRulesCopied=${styleCopies} ` +
          `formBlocksOnRenamedIds=${formsOnRenamed} identicalPages=${identical}` +
          ` [${changedPages.map((p) => p.slug).join(", ")}]`,
      );

      if (APPLY && plan.renames.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const page of changedPages) {
            await tx.page.update({ where: { id: page.id }, data: { blocks: page.blocks } });
          }
          if (styleCopies > 0) {
            await tx.site.update({ where: { id: site.id }, data: { projectStyles: plan.styles } });
          }
        });
      }
    }

    console.log(
      `[reid] totals: sites=${totals.sites} pagesToRewrite=${totals.pages} elementsRenamed=${totals.elements} ` +
        `styleRulesCopied=${totals.styleRules} formBlocksOnRenamedIds=${totals.formBlocks} ` +
        `identicalPages(already collapsed)=${totals.identicalPages}${APPLY ? " — APPLIED" : " — dry run, nothing written"}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`[reid] ${e.message}`);
  process.exit(1);
});
