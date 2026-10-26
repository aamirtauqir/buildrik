/**
 * RecoveryBanner — the one surface for unsaved work kept from an earlier
 * visit (2L9 B7-G07 `225:5474`, G08 `225:6003`, G09 `225:6532`, G10 `225:7061`).
 *
 * Two things keep such work, and both now speak here, in the board's words:
 *  · a dashboard site's save that failed before a reload (`bk-unsaved-v1-<site>`),
 *    which the load path finds, does NOT apply, and publishes as a
 *    `keptWorkOffer` with its restore. It used to be a toast with other words.
 *  · the crash sentinel RecoveryManager writes for the local draft, which is
 *    shown when that draft is what loaded (no dashboard site, or its load
 *    failed — L5-074). The draft is already on screen, so "Restore my edits"
 *    keeps it and "Discard…" reloads without it.
 *
 * What it offers depends on the server's last edit (`lastEditedAt`, which
 * folds in CMS edits):
 *  · older → G07: Discard… (asks first, G10, Cancel the default) · Restore my edits.
 *  · newer → G08: Download my copy only. Restoring would stomp the newer
 *    server work (RT-10).
 *  · unknown → G09: Download my copy only (P0-F: never invite restoring over
 *    a server we could not reach).
 * The board also draws "Compare" on G08/G09; the shared Compare has no
 * kept-copy source yet, so it is not offered (REQUESTS #16). For the local
 * draft, G08/G09 stay hidden: that copy is on screen, and "can't be restored"
 * would contradict the screen.
 *
 * The sentinel records a TIMESTAMP and nothing else, so the copy never claims
 * why the work was kept ("after an unexpected close" was an inference it could
 * not support).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { RecoveryManager } from "@/engine/recovery/RecoveryManager";
import type { ProjectData } from "@shared/types";
import { Button, ConfirmDialog } from "@/editor/chrome-ui";
import { fetchSitePublishState } from "@/services/PublishService";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { clearUnsaved, takeOffScreenUnsaved } from "@/services/unsavedRecovery";
import { setKeptWorkOffer, useKeptWorkOffer } from "./keptWorkOffer";
import { downloadProject } from "./workSnapshot";

export interface RecoveryBannerProps {
  /** Accepted from today's mount; the board's banner names no scope, so it is
   *  not shown (REQUESTS #16 drops it from the mount). */
  pageCount?: number;
  /** Injectable for tests; defaults to a real page reload. */
  reloadFn?: () => void;
  /** ISO of the server's last edit (any kind). Defaults to the site publish state. */
  serverEditedAt?: () => Promise<string | null>;
  /** Is the local draft what the editor loaded? On a dashboard site it is only
   *  when the server load failed — otherwise the screen is the server's copy
   *  (L5-074). Default true. */
  localDraftShown?: boolean;
}

const LOCAL_DRAFT_KEY = "buildrick-project";

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "today 10:12", "yesterday 18:40", "12 Nov 09:05" — the board's "(today 10:12)". */
export function formatKeptAt(at: number, now = Date.now()): string {
  const day = (ms: number) => new Date(ms).toDateString();
  const time = TIME.format(at);
  if (day(at) === day(now)) return `today ${time}`;
  if (day(at) === day(now - 86_400_000)) return `yesterday ${time}`;
  return `${DAY.format(at)} ${time}`;
}

async function defaultServerEditedAt(): Promise<string | null> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return null;
  try {
    const state = await fetchSitePublishState(siteId);
    return state.lastEditedAt;
  } catch {
    /* network/auth failure — the server's state is unknown */
    return null;
  }
}

function readLocalDraft(): ProjectData | null {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ProjectData) : null;
  } catch {
    return null;
  }
}

/** The kept work this banner speaks for, whichever source kept it. */
interface Kept {
  at: number;
  /** The kept copy is the dashboard's off-screen one (not the screen). */
  offScreen: boolean;
  project: () => ProjectData | null;
  restore: () => void;
  discard: () => void;
}

type ServerState = "loading" | "older" | "newer" | "unknown";

const BAR =
  "tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:px-4 tw:py-2.5 tw:border-b tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-accent-tint)] tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const QUIET =
  "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({
  reloadFn,
  serverEditedAt = defaultServerEditedAt,
  localDraftShown = true,
}) => {
  const offer = useKeptWorkOffer();
  // Consume once, when it can apply — reading clears the sentinel so a later
  // re-render or reload won't re-surface the same crash.
  const [record, setRecord] = React.useState(() => (localDraftShown ? RecoveryManager.consumeLastCrash() : null));
  React.useEffect(() => {
    if (localDraftShown && !record) setRecord(RecoveryManager.consumeLastCrash());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDraftShown]);
  const [dismissed, setDismissed] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const reload = reloadFn ?? (() => window.location.reload());

  const kept: Kept | null = React.useMemo(() => {
    if (offer) {
      return {
        at: Date.parse(offer.at),
        offScreen: true,
        project: () => offer.project,
        restore: () => {
          offer.restore();
          setKeptWorkOffer(null);
        },
        discard: () => {
          /* Hand the copy over, then throw it away — without the conflict
             path's latch, so a later failed save is still kept. */
          takeOffScreenUnsaved(offer.siteId);
          clearUnsaved(offer.siteId);
          setKeptWorkOffer(null);
        },
      };
    }
    if (record && localDraftShown) {
      return {
        at: record.at,
        offScreen: false,
        project: readLocalDraft,
        restore: () => setDismissed(true),
        discard: () => {
          try {
            localStorage.removeItem(LOCAL_DRAFT_KEY);
          } catch {
            /* private-mode / disabled storage — the reload still fetches the server copy */
          }
          reload();
        },
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer, record, localDraftShown]);

  const [server, setServer] = React.useState<{ state: ServerState; at: number | null }>({ state: "loading", at: null });
  const keptAt = kept?.at ?? null;
  React.useEffect(() => {
    if (keptAt === null) return;
    let cancelled = false;
    setServer({ state: "loading", at: null });
    void (async () => {
      const at = await serverEditedAt();
      if (cancelled) return;
      const serverMs = at ? Date.parse(at) : NaN;
      if (!Number.isFinite(serverMs)) setServer({ state: "unknown", at: null });
      else setServer({ state: serverMs > keptAt ? "newer" : "older", at: serverMs });
    })();
    return () => {
      cancelled = true;
    };
  }, [keptAt, serverEditedAt]);

  if (!kept || dismissed || server.state === "loading") return null;
  /* The local draft is on screen: only the "restore allowed" case has
     anything true to say about it. */
  if (!kept.offScreen && server.state !== "older") return null;

  const download = () => {
    const project = kept.project();
    if (project) downloadProject(project, "kept-copy");
  };

  const message =
    server.state === "older"
      ? `Unsaved edits from your last visit (${formatKeptAt(kept.at)}) were kept in this browser. The site hasn’t changed since.`
      : server.state === "newer"
        ? `Someone saved this site after your copy was kept (${formatKeptAt(server.at ?? Date.now())}). Your copy is still in this browser.`
        : "Couldn’t check the server version, so your kept copy can’t be restored safely right now.";

  return (
    <div className={BAR} role="status" aria-label="Unsaved work found" data-testid="recovery-banner" data-server={server.state}>
      <p className="tw:m-0 tw:grow tw:basis-60">{message}</p>
      <div className="tw:flex tw:items-center tw:gap-2">
        {server.state === "older" ? (
          <>
            <Button color="light" size="xs" onClick={() => setConfirmDiscard(true)} className={QUIET}>
              Discard…
            </Button>
            <Button size="xs" onClick={kept.restore}>
              Restore my edits
            </Button>
          </>
        ) : (
          <Button color="light" size="xs" onClick={download} data-testid="recovery-download">
            Download my copy
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          kept.discard();
        }}
        title="Delete the kept copy?"
        message="This can’t be undone. The site stays as it was last saved."
        confirmLabel="Delete copy"
        cancelLabel="Cancel"
        tone="destructive"
        testId="recovery-discard-confirm"
      />
    </div>
  );
};

export default RecoveryBanner;
