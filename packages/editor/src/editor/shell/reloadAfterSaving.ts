/**
 * Reload onto a new editor build without losing work (2L9 B7-G24 `227:10593`,
 * B7-G25 `227:11119`).
 *
 * The new-version banner's Reload does not reload straight away: it saves
 * first and says so ("Saving first… then reloading on Home with your panels
 * as they are." — panel state already persists across a reload), and only a
 * save that lands reloads. A save that fails stops the reload and says that
 * nothing was lost, with the work's download and "Stay".
 *
 * @license BSD-3-Clause
 */
import { BANNER_ID, clearGlobalBanner, showGlobalBanner } from "./globalBanners";
import { currentWork, downloadProject } from "./workSnapshot";

export interface ReloadAfterSavingOptions {
  /** Resolves "saved" when the save landed. */
  save: () => Promise<"saved" | string>;
  /** The page the editor is on, named in the saving line. */
  pageName?: string | null;
  siteId: string | null;
  /** Injectable for tests. */
  reload?: () => void;
}

export async function reloadAfterSaving({ save, pageName, siteId, reload }: ReloadAfterSavingOptions): Promise<void> {
  showGlobalBanner({
    id: BANNER_ID.newVersion,
    tone: "info",
    message: `Saving first… then reloading${pageName ? ` on ${pageName}` : ""} with your panels as they are.`,
  });
  let outcome: string;
  try {
    outcome = await save();
  } catch {
    outcome = "error";
  }
  if (outcome === "saved") {
    (reload ?? (() => window.location.reload()))();
    return;
  }
  const work = currentWork(siteId);
  showGlobalBanner({
    id: BANNER_ID.newVersion,
    tone: "warning",
    message: "Couldn’t save, so we didn’t reload. Nothing was lost.",
    actions: [
      ...(work
        ? [{ label: "Download a copy", onClick: () => downloadProject(work, "before-reload"), testId: "banner-download" }]
        : []),
      { label: "Stay", onClick: () => clearGlobalBanner(BANNER_ID.newVersion), testId: "banner-stay" },
    ],
  });
}
