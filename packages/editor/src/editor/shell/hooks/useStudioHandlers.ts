/**
 * useStudioHandlers - Hook for action handlers in AquibraStudio
 * Extracts AI, template, and block action handlers
 *
 * @module Editor/hooks/useStudioHandlers
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AIGenerationResult } from "../../../ai/AIAssistant";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import { STORAGE_KEYS } from "../../../shared/constants/config";
import type { BlockData } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";
import { applyTemplate } from "../../../templates/templateActions";
import { mirrorUserTemplate } from "../../../services/templateSync";
import type { Template } from "../../../templates/TemplateLibrary";
import type { AIContext } from "./useStudioModals";
import type { ToastInput } from "@/editor/shared/vibcoder";

export interface UseStudioHandlersParams {
  composer: Composer | null;
  selectedElement: { id: string; type: string; tagName?: string } | null;
  aiContext: AIContext | null;
  addToast: (input: ToastInput) => string;
  openAI: (context?: AIContext) => void;
  closeTemplates: () => void;
}

export interface UseStudioHandlersReturn {
  handleQuickAdd: (block: BlockData) => void;
  handleAIRequest: (payload: { elementId?: string; elementType?: string }) => void;
  applyAIResult: (result: AIGenerationResult) => void;
  handleCopilotInsert: (content: string, type: "text" | "html" | "image") => void;
  handleSelectTemplate: (template: Template) => void;
  handleSaveTemplate: (data: { name: string; category: string; description: string }) => void;
}

const CONTAINER_TYPES = [
  "container",
  "section",
  "div",
  "grid",
  "columns",
  "flex",
  "card",
  "hero",
  "navbar",
  "footer",
  "pricing",
  "cta",
  "social",
];

export function useStudioHandlers(params: UseStudioHandlersParams): UseStudioHandlersReturn {
  const { composer, selectedElement, aiContext, addToast, openAI, closeTemplates } = params;

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

  const handleAIRequest = React.useCallback(
    (payload: { elementId?: string; elementType?: string }) => {
      openAI({
        elementId: payload.elementId,
        elementType: payload.elementType,
        prompt: `Suggest improvements for ${payload.elementType || "element"}`,
      });
    },
    [openAI]
  );

  const applyAIResult = React.useCallback(
    (result: AIGenerationResult) => {
      if (!composer) return;
      const targetId = aiContext?.elementId || selectedElement?.id;
      if (!targetId) return;
      const el = composer.elements.getElement(targetId);
      if (!el) return;
      composer.beginTransaction("Apply AI Changes");
      try {
        if (result.type === "text") {
          const tag = el.getTagName?.().toLowerCase?.() || "";
          if (tag === "img") el.setAttribute?.("alt", result.content);
          else {
            el.getChildren?.().forEach((c) => composer.elements.removeElement(c.getId()));
            el.setContent?.(result.content);
          }
        } else if (result.type === "html") {
          const parentType = el.getType?.();
          const canHost = typeof parentType === "string" && CONTAINER_TYPES.includes(parentType);
          if (canHost) {
            el.getChildren?.().forEach((c) => composer.elements.removeElement(c.getId()));
            el.setContent?.("");
            composer.elements.insertHTMLToElement(el.getId(), result.content);
          }
        } else if (result.type === "image") {
          el.setAttribute?.("src", result.content);
          if (!el.getAttribute?.("alt")) el.setAttribute?.("alt", "AI generated image");
        }
        composer.selection.select(el);
      } finally {
        composer.endTransaction();
      }
    },
    [composer, aiContext, selectedElement]
  );

  const handleCopilotInsert = React.useCallback(
    (content: string, type: "text" | "html" | "image") => {
      if (!composer) return;
      composer.beginTransaction("Insert AI Content");
      try {
        const page = composer.elements.getActivePage() || composer.elements.createPage("Page 1");
        const root = composer.elements.getElement(page.root.id);
        if (!root) return;
        if (type === "html") {
          composer.elements.insertHTMLToElement(root.getId(), content);
          addToast({
            title: "Layout Inserted",
            description: "AI-generated layout added",
            tone: "success",
          });
        } else if (type === "text") {
          const textEl = composer.elements.createElement("text");
          if (textEl) {
            textEl.setContent(content);
            root.addChild(textEl);
            composer.selection.select(textEl);
          }
          addToast({
            title: "Text Inserted",
            description: "AI-generated text added",
            tone: "success",
          });
        } else if (type === "image") {
          const imgEl = composer.elements.createElement("image");
          if (imgEl) {
            imgEl.setAttribute("src", content);
            imgEl.setAttribute("alt", "AI generated image");
            root.addChild(imgEl);
            composer.selection.select(imgEl);
          }
          addToast({
            title: "Image Inserted",
            description: "AI-generated image added",
            tone: "success",
          });
        }
      } finally {
        composer.endTransaction();
      }
    },
    [composer, addToast]
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
    handleAIRequest,
    applyAIResult,
    handleCopilotInsert,
    handleSelectTemplate,
    handleSaveTemplate,
  };
}

export default useStudioHandlers;
