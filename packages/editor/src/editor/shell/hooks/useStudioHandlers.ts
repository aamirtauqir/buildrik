/**
 * useStudioHandlers - Hook for action handlers in AquibraStudio
 * Extracts AI, template, and block action handlers
 *
 * @module Editor/hooks/useStudioHandlers
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import { STORAGE_KEYS } from "../../../shared/constants/config";
import type { BlockData } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";
import { applyTemplate } from "../../../templates/templateActions";
import { mirrorUserTemplate } from "../../../services/templateSync";
import type { Template } from "../../../templates/TemplateLibrary";
import type { ToastInput } from "@/editor/shared/vibcoder";

export interface UseStudioHandlersParams {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  closeTemplates: () => void;
}

export interface UseStudioHandlersReturn {
  handleQuickAdd: (block: BlockData) => void;
  handleSelectTemplate: (template: Template) => void;
  handleSaveTemplate: (data: { name: string; category: string; description: string }) => void;
}

export function useStudioHandlers(params: UseStudioHandlersParams): UseStudioHandlersReturn {
  const { composer, addToast, closeTemplates } = params;

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

  const handleSelectTemplate = React.useCallback(
    (template: Template) => {
      if (composer) {
        try {
          applyTemplate(composer, template);
          closeTemplates();
          addToast({
            title: "Template applied",
            description: `${template.name} added`,
            tone: "success",
            duration: 1800,
          });
        } catch {
          addToast({
            title: "Template failed",
            description: "Could not apply template.",
            tone: "error",
          });
        }
      }
    },
    [composer, closeTemplates, addToast]
  );

  const handleSaveTemplate = React.useCallback(
    (data: { name: string; category: string; description: string }) => {
      if (!composer) return;
      const exported = composer.exportHTML();
      const newTemplate = {
        id: `user-${Date.now()}`,
        ...data,
        thumbnail: "",
        html: exported.combined || "",
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
    handleSelectTemplate,
    handleSaveTemplate,
  };
}

export default useStudioHandlers;
