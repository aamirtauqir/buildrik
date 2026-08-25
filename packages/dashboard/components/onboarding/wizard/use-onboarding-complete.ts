"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";
import { useWizard } from "./wizard-context";

/**
 * Shared onboarding exit + site creation for every build path.
 *
 * - `createAndAdvance` makes the first site with the chosen method, best-effort
 *   attaches the client captured at S2 (a no-op when the agency layer is off —
 *   the site still lives under the workspace), records siteId, and advances to
 *   the E1 "Ready to edit" summary.
 * - `openEditor` flips the coarse step machine to CHECKLIST (so the dashboard
 *   checklist shows) and opens the editor for a site.
 * - `skipSetup` bails straight to a bare blank site + editor — nobody is trapped.
 */
export function useOnboardingComplete() {
  const router = useRouter();
  const unified = useUnifiedEditorFlag();
  const { data, saveAndGo } = useWizard();
  const completeWizard = trpc.onboarding.completeWizard.useMutation();
  const createSite = trpc.sites.create.useMutation();
  const createClient = trpc.clients.create.useMutation();
  const assignSite = trpc.clients.assignSite.useMutation();
  const [busy, setBusy] = useState(false);

  async function attachClient(siteId: string) {
    const site = data.site;
    if (!site || site.orgType === "mine") return;
    try {
      let clientId = site.client?.id;
      if (site.orgType === "new" && site.client?.name) {
        const created = await createClient.mutateAsync({ name: site.client.name });
        clientId = created.id;
      }
      if (clientId) await assignSite.mutateAsync({ siteId, clientId });
    } catch (e) {
      /* Still non-blocking — never trap the user out of their new site. But
         this used to be an empty catch, and the wizard only reaches here when
         the user typed a client name it had made a hard requirement. Silently
         discarding that is the defect; S2 now hides the client branches unless
         the agency layer is on, so reaching this catch means something else
         went wrong and it should be visible. */
      console.error("[onboarding] client attach failed; site stays under the workspace", e);
    }
  }

  async function openEditor(siteId: string) {
    try {
      await completeWizard.mutateAsync();
    } catch {
      /* non-blocking — never trap the user out of their new site */
    }
    const href = getEditorHref(siteId, unified);
    if (unified) router.push(href);
    else window.location.href = href;
  }

  async function createAndAdvance(opts: {
    method: "blank" | "template" | "ai";
    templateId?: string;
    /** Override the S2 site name (B1 lets the user edit it). */
    siteName?: string;
    patch?: Record<string, unknown>;
  }) {
    setBusy(true);
    try {
      const name = (opts.siteName ?? data.site?.name ?? "").trim() || "My Site";
      const site = await createSite.mutateAsync({
        name,
        method: opts.method,
        ...(opts.templateId ? { templateId: opts.templateId } : {}),
      });
      await attachClient(site.id);
      await saveAndGo("/onboarding/ready", {
        site: { ...data.site, name },
        siteId: site.id,
        path: opts.method,
        ...opts.patch,
      });
      return site.id;
    } catch (e) {
      setBusy(false);
      throw e;
    }
  }

  async function skipSetup() {
    setBusy(true);
    try {
      const site = await createSite.mutateAsync({ name: "My Site", method: "blank" });
      await openEditor(site.id);
    } catch {
      setBusy(false);
    }
  }

  return {
    openEditor,
    createAndAdvance,
    skipSetup,
    busy,
    skipping: busy || createSite.isPending,
  };
}
