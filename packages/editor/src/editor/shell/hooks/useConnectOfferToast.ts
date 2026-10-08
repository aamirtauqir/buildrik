/**
 * The template-applied Connect offer (spec §3, BRP1-M7): when a template
 * lands raw values a token already holds exactly, the engine announces
 * `BRAND_CONNECT_SUGGESTED`; this turns it into a toast whose action opens
 * Brand on the Connect to tokens page. No board draws the toast — its copy
 * is the shape of the page's own rows.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { ToastInput } from "@/editor/chrome-ui";
import { EVENTS, type EventPayloads } from "@/shared/constants/events";
import { requestBrandPage } from "@/editor/design-system/ui/brandOpenRequest";

export function useConnectOfferToast(composer: Composer | null | undefined, addToast?: (t: ToastInput) => void): void {
  React.useEffect(() => {
    if (!composer || !addToast) return;
    const offer = ({ suggestions }: EventPayloads[typeof EVENTS.BRAND_CONNECT_SUGGESTED]) => {
      const n = suggestions.length;
      addToast({
        description: `${n} value${n === 1 ? "" : "s"} on this page match${n === 1 ? "es" : ""} your tokens exactly.`,
        tone: "info",
        duration: 8000,
        action: { label: "Connect to tokens", onClick: () => requestBrandPage(composer, "connect") },
      });
    };
    composer.on(EVENTS.BRAND_CONNECT_SUGGESTED, offer);
    return () => {
      composer.off(EVENTS.BRAND_CONNECT_SUGGESTED, offer);
    };
  }, [composer, addToast]);
}
