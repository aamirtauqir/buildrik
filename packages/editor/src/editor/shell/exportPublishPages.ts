import { createComposer, type Composer } from "@/engine";
import { ExportEngine } from "@/engine/export";
import { CMSExportResolver } from "@/engine/cms/CMSExportResolver";
import type { ProjectData } from "@/shared/types/project";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { cmsFromRows, cmsSyncBlocker, fetchPublishSnapshot } from "@/services/cmsSync";

/** A page ready to publish: a path + its rendered HTML. Matches the server's
 *  publishPageSchema ({ path, html }). */
export interface PublishPage {
  path: string;
  html: string;
}

/**
 * The publish payload's pages: every page file the export wrote. Each one
 * carries its own CSS inline (`inlineStyles`) — the payload is `pages` only,
 * so a linked styles.css would never reach the deployment (every published
 * page used to link a stylesheet that 404'd and shipped with browser
 * defaults), and each page carries only its own elements' rules (REA #25).
 */
function publishPagesOf(files: ReadonlyArray<{ name: string; content: string }>): PublishPage[] {
  return files.filter((f) => f.name.endsWith(".html")).map((f) => ({ path: f.name, html: f.content }));
}

async function exportPageFiles(composer: Composer) {
  return (
    await new ExportEngine(composer).exportAllPages({ format: "html", minify: true, rootAbsoluteHrefs: true, inlineStyles: true })
  ).files;
}

/** Collection ids the project's bindings read — field bindings and lists. */
function boundCollectionIds(project: ProjectData): string[] {
  const ids = new Set<string>();
  for (const list of Object.values(project.cmsBindings?.field ?? {})) {
    for (const b of list) ids.add(b.collectionId);
  }
  for (const b of Object.values(project.cmsBindings?.collection ?? {})) {
    ids.add(b.collectionId);
  }
  return [...ids];
}

/** Publish refused before any request: CMS changes are not on the server
 *  yet (or wait on a conflict choice). Board 8139:218055 titles it "Publish
 *  blocked" — nothing failed, the publish never started. */
export class PublishBlockedError extends Error {}

/**
 * Export all of the project's pages into the publish payload. SSOT for the
 * page-export map shared by the Topbar publish button (useExportHandlers) and
 * the AI privileged-action publish gate — both must produce identical pages.
 */
export async function exportPublishPages(composer: Composer): Promise<PublishPage[]> {
  const siteId = getSiteIdFromUrl();
  const project = composer.exportProject();
  const collectionIds = boundCollectionIds(project);
  /* The standalone demo has no server; a site with no bindings has nothing
     the server could correct. Everything else publishes the SERVER's CMS rows:
     this browser's store can hold rows another device deleted, edits that
     never synced, or a rename the server never saw (DM-01). */
  if (!siteId || collectionIds.length === 0) {
    return publishPagesOf(await exportPageFiles(composer));
  }
  const blocker = cmsSyncBlocker();
  if (blocker) throw new PublishBlockedError(blocker);
  const { cms, siteFonts } = await fetchPublishSnapshot(siteId, collectionIds);
  return renderProjectPages(project, siteFonts, cmsFromRows(cms), composer.designSystem.brandTokensV2);
}

/** A rendered page plus the page it came from — its NAME for a page menu and
 *  its SLUG for a `?page=` link (the /share preview). */
export interface RenderedPage extends PublishPage {
  name: string;
  slug: string;
}

/**
 * A project that is NOT the open one, rendered to its publish pages in a
 * scratch composer: a saved version in Compare, and the `/share/<token>` draft
 * preview (which has no editor at all). Never THE live composer — importing
 * there replaces the user's draft (lane B's first cut did exactly that and
 * never swapped back). Storage is off, so the scratch instance cannot autosave
 * over anything either.
 *
 * It does not wait for `whenReady()`: that is the media library's IndexedDB
 * load, which the export does not read (the engine's own export tests import
 * and export without it). Its late outcome is swallowed — the instance is
 * already destroyed by then.
 */
export async function renderProjectPages(
  snapshot: ProjectData,
  /** The site's ADDED fonts (library files) — what the live composer registers
   *  from its media library, which a scratch instance does not load. Without
   *  them the export cannot write their @font-face. A file that fails to load
   *  is left out, and the export drops its family from the stacks. */
  siteFonts: ReadonlyArray<{ filename: string; url: string }> = [],
  /** The CMS data the project's bindings resolve from (the /share draft's
   *  published entries, `cmsFromRows`). Given, the scratch store is exactly
   *  this — the export's CMSExportResolver resolves bindings as a publish
   *  does. Omitted, bindings resolve from the browser's own CMS store. */
  cms?: { collections: CMSCollection[]; items: CMSContentItem[] },
  /** The site's brand-token switch (L4-031). The scratch composer otherwise
   *  takes the engine default (on) and migrates a switched-off site's pre-v6
   *  tokens in memory, so the render's CSS differed from canvas and publish.
   *  The editor passes its own; the /share rows carry the server's. */
  brandTokensV2: boolean = snapshot.brandTokensV2 === true,
): Promise<RenderedPage[]> {
  const scratch = createComposer({
    container: document.createElement("div"),
    storage: { type: "none", autoSave: false },
  });
  scratch.designSystem.brandTokensV2 = brandTokensV2;
  scratch.whenReady().catch(() => {});
  try {
    await Promise.all(siteFonts.map((f) => scratch.fonts.registerLibraryFont(f).catch(() => undefined)));
    if (cms) scratch.cms.collections.loadSnapshot(cms.collections, cms.items);
    scratch.importProject(snapshot);
    const files = await exportPageFiles(scratch);
    const byId = new Map(snapshot.pages.map((p) => [p.id, p]));
    const htmlFiles = files.filter((f) => f.name.endsWith(".html"));
    // publishPagesOf keeps the html files' order, so index i is file i.
    return publishPagesOf(files).map((page, i) => {
      const source = byId.get(htmlFiles[i]?.pageId ?? "");
      return { ...page, name: source?.name ?? page.path, slug: source?.slug ?? "" };
    });
  } finally {
    scratch.destroy();
  }
}

/**
 * The in-editor Preview's HTML: the page being edited, exactly as Publish
 * ships it — the same multi-page export, the same inlined stylesheet. It was
 * `exportHTML()`, a second document assembly, so Preview could disagree with
 * the published page (REA #18). CMS bindings resolve the way that export
 * resolves them (published records, from this browser's store).
 *
 * A page the export leaves out (Hidden or Password) is still previewed, from
 * the single-page document: the user is looking at it, and it has no
 * published twin to disagree with.
 *
 * `hiddenDrafts`: the records this page's collection lists leave out because
 * they are not published — the canvas shows them, Preview and the live site
 * do not, and Preview says so rather than dropping them silently.
 */
export async function renderPreviewHtml(composer: Composer): Promise<{ html: string; hiddenDrafts: number }> {
  const html = await previewPageHtml(composer);
  return { html, hiddenDrafts: await hiddenDraftCount(composer, html).catch(() => 0) };
}

async function previewPageHtml(composer: Composer): Promise<string> {
  const pageId = composer.elements.getActivePage?.()?.id;
  const files = await exportPageFiles(composer);
  const index = files.filter((f) => f.name.endsWith(".html")).findIndex((f) => f.pageId === pageId);
  if (index >= 0) return publishPagesOf(files)[index].html;
  const raw = composer.exportHTML().combined || "<!DOCTYPE html><html><body>No content</body></html>";
  // A resolve that throws previews the stored text, as before — never nothing.
  return new CMSExportResolver(composer).resolve(raw, { mode: "static" }).catch(() => raw);
}

/** Unpublished records of the collections bound to a list on this page. A
 *  list's copies keep its element id, so the page's HTML says which lists it
 *  has. */
async function hiddenDraftCount(composer: Composer, html: string): Promise<number> {
  const collections = new Set(
    Object.entries(composer.cms.bindings.exportCollectionBindings())
      .filter(([elementId]) => html.includes(`data-buildrick-id="${elementId}"`))
      .map(([, binding]) => binding.collectionId),
  );
  let count = 0;
  for (const id of collections) {
    count += (await composer.cms.collections.getContentItems(id)).filter((i) => i.status !== "published").length;
  }
  return count;
}
