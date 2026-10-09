/**
 * "This site is open in another tab" (L5-078). A second tab on the same site
 * opened with no notice, and the conflict surfaced only when a save was
 * refused (409) — after the user had already edited. A BroadcastChannel per
 * site asks on open whether another tab is here; any tab that is answers, and
 * the one that hears an answer says so once. No server, no collab: it only
 * tells the user before the edits collide.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ToastInput } from "@/editor/chrome-ui";

const CHANNEL_PREFIX = "bk-site-tabs-";

type TabMessage = { kind: "hello" | "here"; tab: string };

export function useOtherTabNotice(siteId: string | null, addToast: (t: ToastInput) => string): void {
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;
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
      addToastRef.current({
        title: "This site is open in another tab",
        description: "Edit in one tab at a time — saves from the other tab can conflict with this one.",
        tone: "warning",
        /* Persistent: a transient toast is replaced by the next one, and the
           load's own "Project loaded" replaced this one in the new tab. */
        duration: Infinity,
      });
    };
    channel.postMessage({ kind: "hello", tab } satisfies TabMessage);
    return () => channel.close();
  }, [siteId]);
}
