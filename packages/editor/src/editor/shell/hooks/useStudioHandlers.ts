/**
 * useStudioHandlers - Hook for action handlers in AquibraStudio
 * Extracts AI, template, and block action handlers
 *
 * @module Editor/hooks/useStudioHandlers
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import { STORAGE_KEYS } from "../../../shared/constants/config";
import type { BlockData } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";
import { mirrorUserTemplate } from "../../../services/templateSync";
import { inverseResolveTokens } from "../../sidebar/tabs/templates/utils/inverseResolveTokens";
import { snapshotFromComputedStyle } from "../../sidebar/tabs/templates/utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "../../design-system/constants";

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

  const handleQuickAdd = React.useCallback(
    (block: BlockData) => {
      if (!composer) return;
      composer.beginTransaction("Add Element");
      try {
        const page = composer.elements.getActivePage() || composer.elements.createPage("Page 1");
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
        // #13/25: mirror to the server (workspace-scoped) so the template is
        // shared across the agency's sites + survives device loss. Best-effort.
        void mirrorUserTemplate(newTemplate);
        addToast({
          title: "Template saved",
          description: `${data.name} saved to My Templates`,
          tone: "success",
          duration: 2000,
        });
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
