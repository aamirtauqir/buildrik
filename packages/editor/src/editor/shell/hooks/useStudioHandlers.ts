/**
 * useStudioHandlers - Hook for action handlers in AquibraStudio
 * Extracts AI, template, and block action handlers
 *
 * @module Editor/hooks/useStudioHandlers
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput, dismissToast } from "@/editor/chrome-ui";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import { STORAGE_KEYS } from "../../../shared/constants/config";
import type { BlockData } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";
import { mirrorUserTemplate, retryTemplateSync, getTemplateSyncPendingCount, onTemplateSyncError } from "../../../services/templateSync";
import { inverseResolveTokens } from "../../sidebar/tabs/templates/utils/inverseResolveTokens";
import { snapshotFromComputedStyle } from "../../sidebar/tabs/templates/utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "../../design-system/constants";
import { getDefaultPageName } from "@/shared/utils/pageUtils";

export interface UseStudioHandlersParams {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
}

export interface UseStudioHandlersReturn {
  handleQuickAdd: (block: BlockData) => void;
  handleSaveTemplate: (data: { name: string; category: string; description: string }) => void;
}

export function useStudioHandlers(params: UseStudioHandlersParams): UseStudioHandlersReturn {
  const { composer, addToast } = params;

  /* One coalesced "template didn't reach the server" notice, owned by the sync
     queue's own error channel — the same shape `useCmsSync`, `useComponentSync`
     and `useVersionSync` use. Templates were the odd one out: nothing subscribed
     to `onTemplateSyncError` at all, so the notice was raised from the save
     handler and could never be retracted by anything the handler did not do
     itself. */
  React.useEffect(() => {
    let toastShown = false;
    let toastId: string | null = null;
    const clear = () => {
      if (toastId) dismissToast(toastId);
      toastId = null;
      toastShown = false;
    };
    const off = onTemplateSyncError(() => {
      if (getTemplateSyncPendingCount() === 0) return clear();
      if (toastShown) return;
      toastShown = true;
      toastId = addToast({
        title: "Template saved on this device only",
        description:
          "It didn't reach the server, so your other sites can't use it yet. Retry now, or leave it — a reconnect replays the queue.",
        tone: "error",
        duration: Infinity,
        action: {
          label: "Retry now",
          onClick: () => {
            clear();
            void retryTemplateSync();
          },
        },
      });
    });
    return () => {
      off();
      clear();
    };
  }, [addToast]);

  const handleQuickAdd = React.useCallback(
    (block: BlockData) => {
      if (!composer) return;
      composer.beginTransaction("Add Element");
      try {
        const page =
          composer.elements.getActivePage() ||
          composer.elements.createPage(getDefaultPageName(composer.elements.getAllPages()));
        const root = composer.elements.getElement(page.root.id);
        if (!root) return;
        const def = getBlockDefinitions().find((b) => b.id === block.id);
        if (!def || !canNestElement(def.elementType, root.getType())) return;
        insertBlock(composer, def, root.getId(), root.getChildCount());
      } finally {
        composer.endTransaction();
      }
    },
    [composer]
  );

  const handleSaveTemplate = React.useCallback(
    (data: { name: string; category: string; description: string }) => {
      if (!composer) return;
      const exported = composer.exportHTML();
      /**
       * Save the page with token PLACEHOLDERS, not the literal values this
       * project happens to use — board 1169:4753's own promise, "Tokens are
       * snapshotted — applying it later re-maps them to that site's brand."
       *
       * The apply half of that round trip has always been wired
       * (`TemplatesTab` runs `resolveTokens` against a live snapshot before
       * importing). The save half was not: `inverseResolveTokens` was written,
       * tested and imported by nothing, so a saved template carried this
       * site's hexes and applying it into another site painted that site in
       * these colours. Same snapshot source as the apply path, so the two
       * directions cannot drift.
       */
      const snapshot = snapshotFromComputedStyle(document.documentElement, DEFAULT_TOKENS);
      const portableHtml = inverseResolveTokens(exported.combined || "", snapshot);
      const newTemplate = {
        id: `user-${Date.now()}`,
        ...data,
        thumbnail: "",
        html: portableHtml,
        css: "",
      };
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES);
        const myTemplates = saved ? JSON.parse(saved) : [];
        myTemplates.unshift(newTemplate);
        localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(myTemplates));
        addToast({
          title: "Template saved",
          description: `${data.name} saved to My Templates`,
          tone: "success",
          duration: 2000,
        });
        /* #13/25: mirror to the server (workspace-scoped) so the template is
           shared across the agency's sites + survives device loss. Best-effort,
           and the local save above already succeeded — so this reports rather
           than blocks. It used to be a bare `void`: templateSync queues and
           notifies on failure exactly like version/component sync, but nothing
           ever subscribed (`onTemplateSyncError` and `retryTemplateSync` had no
           callers at all), so a template that never left this device looked
           identical to one that did. */
        /* The stranded-template notice is raised by the subscriber effect at the
           top of this hook, not here. Raised inline it could see only ITS OWN
           mirror's outcome: a reconnect that drained the queue left the notice
           standing, and a second failed template stacked a second identical
           permanent notice beside the first. (Codex review, 2026-08-24.) */
        void mirrorUserTemplate(newTemplate);
      } catch {
        addToast({ title: "Save failed", description: "Could not save template.", tone: "error" });
      }
    },
    [composer, addToast]
  );

  return {
    handleQuickAdd,
    handleSaveTemplate,
  };
}

export default useStudioHandlers;
