/**
 * Template Manager Hook
 * Provides template operations from composer's TemplateManager
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type {
  Template,
  TemplateFilter,
  TemplateSaveOptions,
  TemplateLoadOptions,
} from "../../../shared/types/templates";

export interface UseTemplateManagerResult {
  /** All available templates */
  templates: Template[];
  /** Loading state */
  isLoading: boolean;
  /** Fetch templates with optional filter */
  fetchTemplates: (filter?: TemplateFilter) => Promise<Template[]>;
  /** Get a specific template by ID */
  getTemplate: (id: string) => Promise<Template | null>;
  /** Load a template into the composer */
  loadTemplate: (templateId: string, options?: TemplateLoadOptions) => Promise<void>;
  /** Save current canvas as template */
  saveAsTemplate: (options: TemplateSaveOptions) => Promise<Template>;
  /** Delete a template */
  deleteTemplate: (templateId: string) => void;
  /** Export all local templates */
  exportTemplates: () => Template[];
}

export function useTemplateManager(composer: Composer | null): UseTemplateManagerResult {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Subscribe to template changes
  React.useEffect(() => {
    if (!composer?.templates) return;

    const updateTemplates = async () => {
      const allTemplates = await composer.templates.fetchTemplates();
      setTemplates(allTemplates);
    };

    composer.templates.on("template:saved", updateTemplates);
    composer.templates.on("template:deleted", updateTemplates);
    composer.templates.on("templates:imported", updateTemplates);

    // Get initial state
    void updateTemplates();

    return () => {
      composer.templates.off("template:saved", updateTemplates);
      composer.templates.off("template:deleted", updateTemplates);
      composer.templates.off("templates:imported", updateTemplates);
    };
  }, [composer]);

  const fetchTemplates = React.useCallback(
    async (filter?: TemplateFilter): Promise<Template[]> => {
      if (!composer?.templates) return [];
      setIsLoading(true);
      try {
        const results = await composer.templates.fetchTemplates(filter);
        setTemplates(results);
        return results;
      } finally {
        setIsLoading(false);
      }
    },
    [composer]
  );

  const getTemplate = React.useCallback(
    async (id: string): Promise<Template | null> => {
      if (!composer?.templates) return null;
      return composer.templates.getTemplate(id);
    },
    [composer]
  );

  const loadTemplate = React.useCallback(
    async (templateId: string, options?: TemplateLoadOptions) => {
      if (!composer?.templates) return;
      setIsLoading(true);
      try {
        await composer.templates.loadTemplate(templateId, options);
      } finally {
        setIsLoading(false);
      }
    },
    [composer]
  );

  const saveAsTemplate = React.useCallback(
    async (options: TemplateSaveOptions): Promise<Template> => {
      if (!composer?.templates) throw new Error("Template manager not available");
      return composer.templates.saveAsTemplate(options);
    },
    [composer]
  );

  const deleteTemplate = React.useCallback(
    (templateId: string) => {
      composer?.templates?.deleteTemplate(templateId);
    },
    [composer]
  );

  const exportTemplates = React.useCallback((): Template[] => {
    return composer?.templates?.exportTemplates() ?? [];
  }, [composer]);

  return {
    templates,
    isLoading,
    fetchTemplates,
    getTemplate,
    loadTemplate,
    saveAsTemplate,
    deleteTemplate,
    exportTemplates,
  };
}

export default useTemplateManager;
