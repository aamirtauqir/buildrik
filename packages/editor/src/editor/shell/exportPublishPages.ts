import { createComposer, type Composer } from "@/engine";
import { ExportEngine } from "@/engine/export";
import type { ProjectData } from "@/shared/types/project";

/** A page ready to publish: a path + its rendered HTML. Matches the server's
 *  publishPageSchema ({ path, html }). */
export interface PublishPage {
  path: string;
  html: string;
}

/**
 * Export all of the project's pages into the publish payload. SSOT for the
 * page-export map shared by the Topbar publish button (useExportHandlers) and
 * the AI privileged-action publish gate — both must produce identical pages.
 */
/**
 * Fold the multi-page export's single stylesheet into each page's head.
 *
 * Exported for its own test: the transformation has to be provable without
 * standing up a real project, because the bug it fixes is invisible until a
 * site is actually deployed.
 */
export function inlinePublishStylesheet(
  files: ReadonlyArray<{ name: string; content: string }>
): PublishPage[] {
  const css = files.find((f) => f.name === "styles.css")?.content ?? "";
  const pages = files.filter((f) => f.name.endsWith(".html"));
  if (!css) return pages.map((f) => ({ path: f.name, html: f.content }));
  return pages.map((f) => ({
    path: f.name,
    html: f.content.replace(
      /[ \t]*<link rel="stylesheet" href="styles\.css">\n?/,
      `  <style>${css}</style>\n`
    ),
  }));
}

export async function exportPublishPages(composer: Composer): Promise<PublishPage[]> {
  const result = await new ExportEngine(composer).exportAllPages({ format: "html", minify: true });
  /* The multi-page export writes ONE styles.css and links it from every page,
     and the publish payload carries pages only (`pages: [{ path, html }]`), so
     that file never reached the deployment — the worker uploads the page HTML
     plus robots.txt and nothing else. Every published page linked a stylesheet
     that 404s, and the exported markup carries CLASSES rather than style
     attributes, so the site shipped with browser defaults.

     Inlining it needs no new transport: schema, server and worker unchanged.
     Pages are capped at 2MB each and the stylesheet is a few KB. */
  return inlinePublishStylesheet(result.files);
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
export async function renderProjectPages(snapshot: ProjectData): Promise<PublishPage[]> {
  const scratch = createComposer({
    container: document.createElement("div"),
    storage: { type: "none", autoSave: false },
  });
  scratch.whenReady().catch(() => {});
  try {
    scratch.importProject(snapshot);
    return await exportPublishPages(scratch);
  } finally {
    scratch.destroy();
  }
}
