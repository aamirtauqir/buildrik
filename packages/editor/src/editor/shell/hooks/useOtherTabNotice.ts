/**
 * "This site is open in another tab" (L5-078). A second tab on the same site
 * opened with no notice, and the conflict surfaced only when a save was
 * refused (409) — after the user had already edited. A BroadcastChannel per
 * site asks on open whether another tab is here; any tab that is answers, and
 * the one that hears an answer says so once. No server, no collab: it only
 * tells the user before the edits collide.
 *
 * The notice is the global banner slot's (F-13, board 227:12711), not a
 * persistent toast: the next toast replaced it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ToastInput } from "@/editor/chrome-ui";
import { showOtherTabBanner } from "@/editor/shell/globalBanners";

const CHANNEL_PREFIX = "bk-site-tabs-";

type TabMessage = { kind: "hello" | "here"; tab: string };

/** `addToast` is read by nothing since the notice became a banner (F-13).
 *  AquibraStudio (founder WIP, REQUESTS.md F-13) still passes it; drop the
 *  parameter together with that argument. */
export function useOtherTabNotice(siteId: string | null, addToast?: (t: ToastInput) => string): void {
  React.useEffect(() => {
    if (!siteId || typeof BroadcastChannel === "undefined") return;
    const tab = Math.random().toString(36).slice(2);
    const channel = new BroadcastChannel(CHANNEL_PREFIX + siteId);
    let told = false;
    channel.onmessage = (event: MessageEvent<TabMessage>) => {
      const msg = event.data;
      if (!msg || msg.tab === tab) return;
      /* Another tab just opened: answer, so it can say so. */
      if (msg.kind === "hello") channel.postMessage({ kind: "here", tab } satisfies TabMessage);
      if (told) return;
      told = true;
      showOtherTabBanner();
    };
    channel.postMessage({ kind: "hello", tab } satisfies TabMessage);
    return () => channel.close();
  }, [siteId]);
}
