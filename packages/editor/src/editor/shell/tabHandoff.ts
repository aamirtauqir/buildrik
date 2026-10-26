/**
 * Tab handoff — "Edit here" (2L9 B7-G28 `227:12711`, G29 `227:13239`,
 * G30 `227:13769`).
 *
 * Two tabs on one site edit over each other: the second tab's saves conflict
 * with the first's. "Edit here" moves editing to the tab that asks for it,
 * over the same per-site BroadcastChannel the other-tab notice uses:
 *   1. the asking tab posts `claim`;
 *   2. the editing tab saves its work first. Saved → it turns view only (the
 *      engine's "view" lock) and says "Editing moved to another tab…" with
 *      "Edit here instead", and posts `released`. Not saved → it stays
 *      editable and posts `refused`;
 *   3. the asking tab, on `released`, drops the notice and edits; on
 *      `refused` it says "The other tab couldn’t save — finish there first.
 *      Nothing turned read-only." with Edit here to try again.
 * No answer within `ANSWER_MS` means no other tab is listening any more
 * (closed, or an older build): the claim simply succeeds.
 *
 * The view lock is released only if this module set it, so a tab that was
 * already view only (a viewer, a read-only view) stays that way.
 *
 * Mounted by the other-tab notice hook (lead, REQUESTS F-21).
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { BANNER_ID, clearGlobalBanner, showGlobalBanner } from "./globalBanners";

const CHANNEL_PREFIX = "bk-site-handoff-";
const ANSWER_MS = 5000;

type HandoffMessage =
  | { kind: "claim"; from: string }
  | { kind: "released"; from: string; to: string }
  | { kind: "refused"; from: string; to: string };

export interface TabHandoffOptions {
  siteId: string;
  composer: Pick<Composer, "setEditLock" | "editLocks">;
  /** Save this tab's work; "saved" when it landed. */
  save: () => Promise<"saved" | string>;
  /** Injectable for tests. */
  channel?: Pick<BroadcastChannel, "postMessage" | "close"> & { onmessage: BroadcastChannel["onmessage"] };
}

export interface TabHandoff {
  /** "Edit here": ask the other tab to hand editing over. */
  claim: () => void;
  dispose: () => void;
}

export function createTabHandoff({ siteId, composer, save, channel }: TabHandoffOptions): TabHandoff {
  const tab = Math.random().toString(36).slice(2);
  const ch = channel ?? new BroadcastChannel(CHANNEL_PREFIX + siteId);
  let lockedHere = false;
  let pending: ReturnType<typeof setTimeout> | null = null;

  const unlock = () => {
    if (lockedHere) composer.setEditLock("view", false);
    lockedHere = false;
  };

  const settleClaim = () => {
    if (pending) clearTimeout(pending);
    pending = null;
  };

  const claim = () => {
    settleClaim();
    ch.postMessage({ kind: "claim", from: tab } satisfies HandoffMessage);
    pending = setTimeout(() => {
      /* Nobody answered: no tab is editing this site any more. */
      pending = null;
      unlock();
      clearGlobalBanner(BANNER_ID.otherTab);
    }, ANSWER_MS);
  };

  const handOver = async (to: string) => {
    let outcome: string;
    try {
      outcome = await save();
    } catch {
      outcome = "error";
    }
    if (outcome !== "saved") {
      ch.postMessage({ kind: "refused", from: tab, to } satisfies HandoffMessage);
      return;
    }
    if (!composer.editLocks.has("view")) {
      composer.setEditLock("view", true);
      lockedHere = true;
    }
    showGlobalBanner({
      id: BANNER_ID.otherTab,
      tone: "warning",
      message: "Editing moved to another tab. This tab is view only; your changes were saved first.",
      actions: [{ label: "Edit here instead", onClick: claim, testId: "banner-edit-here-instead" }],
    });
    ch.postMessage({ kind: "released", from: tab, to } satisfies HandoffMessage);
  };

  ch.onmessage = (event: MessageEvent<HandoffMessage>) => {
    const msg = event.data;
    if (!msg || msg.from === tab) return;
    if (msg.kind === "claim") {
      void handOver(msg.from);
      return;
    }
    if (msg.to !== tab) return;
    settleClaim();
    if (msg.kind === "released") {
      unlock();
      clearGlobalBanner(BANNER_ID.otherTab);
    } else {
      showGlobalBanner({
        id: BANNER_ID.otherTab,
        tone: "warning",
        message: "The other tab couldn’t save — finish there first. Nothing turned read-only.",
        actions: [{ label: "Edit here", onClick: claim, testId: "banner-edit-here", primary: true }],
      });
    }
  };

  return {
    claim,
    dispose: () => {
      settleClaim();
      ch.close();
    },
  };
}

