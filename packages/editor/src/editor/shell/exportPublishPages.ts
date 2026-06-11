import type { Composer } from "@/engine";
import { ExportEngine } from "@/engine/export";

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
export async function exportPublishPages(composer: Composer): Promise<PublishPage[]> {
  const result = await new ExportEngine(composer).exportAllPages({ format: "html", minify: true });
  return result.files
    .filter((f) => f.name.endsWith(".html"))
    .map((f) => ({ path: f.name, html: f.content }));
}
