/**
 * Saved Templates Utility
 * LocalStorage-based storage for user-saved templates
 * @license BSD-3-Clause
 */

// ============================================
// Types
// ============================================

export interface SavedTemplate {
  id: string;
  name: string;
  type: "section" | "page";
  html: string;
  createdAt: number;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "aqb-saved-templates";

// ============================================
// Functions
// ============================================

/**
 * Get all saved templates from localStorage
 */
export function getSavedTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a template to localStorage
 */
export function saveTemplate(template: Omit<SavedTemplate, "id" | "createdAt">): SavedTemplate {
  const templates = getSavedTemplates();
  const newTemplate: SavedTemplate = {
    ...template,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  templates.unshift(newTemplate); // Add to beginning (most recent first)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

/**
 * Delete a template from localStorage
 */
export function deleteTemplate(id: string): boolean {
  const templates = getSavedTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Update a template name
 */
export function renameTemplate(id: string, newName: string): boolean {
  const templates = getSavedTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) return false;
  templates[index].name = newName;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return true;
}
