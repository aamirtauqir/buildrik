import * as React from "react";
import { type ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";
import { fetchPublishStatus } from "@/services/PublishService";
import { useToast } from "@/editor/chrome-ui";

/**
 * The AI privileged-action confirm gate (platform phase 4b). An AI `propose-action`
 * comes back from applyAiEdit; this drives propose → consequence dialog → confirm.
 * Confirm exports the pages, calls `actions.confirm` (which re-checks the role and
 * runs the action through the existing domain path), then surfaces the job. The
 * gate is ALWAYS an explicit dialog — never folded into agent auto-apply.
 */
interface GateState {
  open: boolean;
  title: string;
  consequence: string;
  busy: boolean;
}
const CLOSED: GateState = { open: false, title: "", consequence: "", busy: false };

export interface AiActionGate {
  state: GateState;
  propose: (actionId: string) => Promise<void>;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export function useAiActionGate(composer: Composer | null): AiActionGate {
  const { addToast } = useToast();
  const [state, setState] = React.useState<GateState>(CLOSED);
  const tokenRef = React.useRef<string | null>(null);

  const propose = React.useCallback(
    async (actionId: string) => {
      const siteId = getSiteIdFromUrl();
      if (!siteId) {
        addToast({ title: "Can't run that", description: "Open this editor from a site URL with ?siteId=…", tone: "error" });
        return;
      }
      try {
        const { token, confirm } = await getAiSubscriptionClient().actions.propose.mutate({
          siteId,
          actionId,
          args: {},
        });
        tokenRef.current = token;
        setState({ open: true, title: confirm.title, consequence: confirm.consequence, busy: false });
      } catch (e) {
        addToast({ title: "Couldn't prepare that action", description: errText(e), tone: "error" });
      }
    },
    [addToast],
  );

  const cancel = React.useCallback(() => {
    tokenRef.current = null;
    setState(CLOSED);
  }, []);

  const confirm = React.useCallback(async () => {
    const token = tokenRef.current;
    if (!token || !composer) return;
    setState((s) => ({ ...s, busy: true }));
    try {
      const pages = await exportPublishPages(composer);
      const res = (await getAiSubscriptionClient().actions.confirm.mutate({
        token,
        payload: { pages },
      })) as { id?: string };
      tokenRef.current = null;
      setState(CLOSED);
      addToast({ title: "Publishing…", description: "Your site is deploying.", tone: "info" });
      if (res?.id) pollPublish(res.id, addToast);
    } catch (e) {
      setState((s) => ({ ...s, busy: false }));
      addToast({ title: "Action failed", description: errText(e), tone: "error" });
    }
  }, [composer, addToast]);

  return { state, propose, confirm, cancel };
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

/** Light terminal-state poll so the chat surfaces a published/failed toast. */
function pollPublish(jobId: string, addToast: (i: ToastInput) => string): void {
  let n = 0;
  const tick = async () => {
    n++;
    try {
      const s = await fetchPublishStatus(jobId);
      if (s.status === "COMPLETED") {
        addToast({ title: "Published", description: s.publishedUrl ?? "Your site is live.", tone: "success" });
        return;
      }
      if (s.status === "FAILED" || s.status === "CANCELLED") {
        addToast({ title: "Publish failed", description: s.error ?? s.status, tone: "error" });
        return;
      }
    } catch {
      // transient — keep polling
    }
    if (n < 45) setTimeout(tick, 2000); // ~90s ceiling
  };
  setTimeout(tick, 2000);
}
