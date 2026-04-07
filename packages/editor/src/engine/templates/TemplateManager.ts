/**
 * Template Manager
 * Manages templates, marketplace, and template operations
 *
 * FRESH IMPLEMENTATION for Aquibra
 *
 * @module engine/templates/TemplateManager
 * @license BSD-3-Clause
 */

import type { ProjectData } from "../../shared/types";
import type { TemplateExportOptions } from "../../shared/types/data";
import type {
  Template,
  TemplateSource,
  TemplateFilter,
  TemplateLoadOptions,
  TemplateSaveOptions,
  TemplateCategory,
} from "../../shared/types/templates";
import type { Composer } from "../Composer";
import { TemplateEngine } from "../data/TemplateEngine";
import { EventEmitter } from "../EventEmitter";

/**
 * Template Manager
 * Central hub for template operations
 */
export class TemplateManager extends EventEmitter {
  private composer: Composer;
  private templates: Map<string, Template> = new Map();
  private sources: TemplateSource[] = [];
  private cache: Map<string, { templates: Template[]; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(composer: Composer) {
    super();
    this.composer = composer;

    // Register default local source
    this.registerSource({
      type: "local",
    });
  }

  /**
   * Register a template source
   */
  registerSource(source: TemplateSource): void {
    this.sources.push(source);
    this.emit("source:registered", { source });
  }

  /**
   * Fetch templates from all sources
   */
  async fetchTemplates(filter?: TemplateFilter): Promise<Template[]> {
    const allTemplates: Template[] = [];

    // Check cache first
    const cacheKey = JSON.stringify(filter || {});
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.templates;
    }

    // Fetch from all sources
    for (const source of this.sources) {
      try {
        let templates: Template[] = [];

        if (source.type === "local") {
          templates = Array.from(this.templates.values());
        } else if (source.type === "api" && source.endpoint) {
          templates = await this.fetchFromAPI(source.endpoint, source.headers);
        } else if (source.type === "custom" && source.fetch) {
          templates = await source.fetch();
        }

        allTemplates.push(...templates);
      } catch {
        // Failed to fetch from source - continue with other sources
      }
    }

    // Apply filters
    let filtered = allTemplates;

    if (filter) {
      filtered = this.applyFilters(allTemplates, filter);
    }

    // Cache results
    this.cache.set(cacheKey, {
      templates: filtered,
      timestamp: Date.now(),
    });

    return filtered;
  }

  /**
   * Fetch templates from API
   */
  private async fetchFromAPI(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<Template[]> {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.templates || data;
  }

  /**
   * Apply filters to templates
   */
  private applyFilters(templates: Template[], filter: TemplateFilter): Template[] {
    let filtered = [...templates];

    // Category filter
    if (filter.category) {
      filtered = filtered.filter((t) => t.category === filter.category);
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter((t) => filter.tags!.some((tag) => t.tags?.includes(tag)));
    }

    // Search query
    if (filter.query) {
      const query = filter.query.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Free only
    if (filter.freeOnly) {
      filtered = filtered.filter((t) => !t.premium);
    }

    // Minimum rating
    if (filter.minRating !== undefined) {
      filtered = filtered.filter((t) => (t.rating || 0) >= filter.minRating!);
    }

    // Sort
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (filter.sortBy) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "date":
            aVal = new Date(a.updatedAt || a.createdAt || 0).getTime();
            bVal = new Date(b.updatedAt || b.createdAt || 0).getTime();
            break;
          case "downloads":
            aVal = a.downloads || 0;
            bVal = b.downloads || 0;
            break;
          case "rating":
            aVal = a.rating || 0;
            bVal = b.rating || 0;
            break;
          default:
            return 0;
        }

        if (filter.sortOrder === "desc") {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    return filtered;
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    // Check local first
    if (this.templates.has(id)) {
      return this.templates.get(id)!;
    }

    // Fetch from sources
    const allTemplates = await this.fetchTemplates();
    return allTemplates.find((t) => t.id === id) || null;
  }

  /**
   * Load template into composer
   */
  async loadTemplate(templateId: string, options: TemplateLoadOptions = {}): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    // Call before load callback
    if (options.onBeforeLoad) {
      const shouldContinue = await options.onBeforeLoad(template);
      if (!shouldContinue) {
        return;
      }
    }

    this.emit("template:loading", { template });

    try {
      // Load template data
      if (options.replace) {
        // Replace entire project
        this.composer.importProject(template.data);
      } else if (options.merge) {
        // Merge with current project
        await this.mergeTemplate(template, options.mergeStrategy || "append");
      } else {
        // Default: replace
        this.composer.importProject(template.data);
      }

      // Increment download count
      if (template.downloads !== undefined) {
        template.downloads++;
      }

      this.emit("template:loaded", { template });

      // Call after load callback
      if (options.onAfterLoad) {
        await options.onAfterLoad(template);
      }
    } catch (error) {
      this.emit("template:error", { template, error });
      throw error;
    }
  }

  /**
   * Merge template with current project
   */
  private async mergeTemplate(
    template: Template,
    strategy: "append" | "prepend" | "replace"
  ): Promise<void> {
    const currentProject = this.composer.exportProject();
    const templateData = template.data;

    // Merge pages
    if (templateData.pages) {
      if (strategy === "append") {
        currentProject.pages = [...(currentProject.pages || []), ...templateData.pages];
      } else if (strategy === "prepend") {
        currentProject.pages = [...templateData.pages, ...(currentProject.pages || [])];
      } else {
        currentProject.pages = templateData.pages;
      }
    }

    // Merge styles (combine)
    if (templateData.styles) {
      currentProject.styles = {
        ...currentProject.styles,
        ...templateData.styles,
      };
    }

    // Load merged project
    this.composer.importProject(currentProject);
  }

  /**
   * Save current project as template
   */
  async saveAsTemplate(options: TemplateSaveOptions): Promise<Template> {
    const projectData = this.composer.exportProject();

    const emptyProjectData: ProjectData = {
      version: "1.0.0",
      pages: [],
      styles: [],
      assets: [],
    };

    const template: Template = {
      id: this.generateTemplateId(),
      ...options.metadata,
      data: options.includeData !== false ? projectData : emptyProjectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate thumbnail if requested
    if (options.generateThumbnail) {
      template.thumbnail = await this.generateThumbnail(options.thumbnailOptions);
    }

    // Save to local templates
    this.templates.set(template.id, template);

    this.emit("template:saved", { template });

    // Clear cache
    this.cache.clear();

    return template;
  }

  /**
   * Generate thumbnail for current project using html2canvas
   */
  private async generateThumbnail(options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<string> {
    if (typeof document === "undefined") {
      return this.getPlaceholderThumbnail();
    }

    const canvasElement = document.querySelector("[data-aqb-canvas]") as HTMLElement | null;
    if (!canvasElement) {
      return this.getPlaceholderThumbnail();
    }

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(canvasElement, {
        width: options?.width || 400,
        height: options?.height || 300,
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      return canvas.toDataURL("image/png", options?.quality || 0.8);
    } catch {
      return this.getPlaceholderThumbnail();
    }
  }

  private getPlaceholderThumbnail(): string {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): void {
    if (this.templates.has(id)) {
      const template = this.templates.get(id)!;
      this.templates.delete(id);
      this.emit("template:deleted", { template });
      this.cache.clear();
    }
  }

  /**
   * Get all categories
   */
  getCategories(): TemplateCategory[] {
    return [
      "landing-page",
      "portfolio",
      "blog",
      "ecommerce",
      "dashboard",
      "email",
      "marketing",
      "business",
      "creative",
      "other",
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit("cache:cleared");
  }

  /**
   * Export all local templates
   */
  exportTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Export an element to template syntax using the TemplateEngine
   */
  exportElementTemplate(elementId: string, options: TemplateExportOptions): string {
    const element = this.composer.elements.getElement(elementId);
    if (!element) {
      throw new Error(`Element "${elementId}" not found`);
    }

    const engine = new TemplateEngine(options);
    return engine.export(element);
  }

  /**
   * Import templates
   */
  importTemplates(templates: Template[]): void {
    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });

    this.emit("templates:imported", { count: templates.length });
    this.cache.clear();
  }

  /**
   * Destroy template manager
   */
  destroy(): void {
    this.templates.clear();
    this.sources = [];
    this.cache.clear();
    this.removeAllListeners();
  }
}
