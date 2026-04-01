/**
 * useCanvasCommandPalette
 * Command palette state, keyboard shortcut (Cmd+Shift+P), and command definitions.
 * Extracted from Canvas.tsx for maintainability.
 *
 * @module components/Canvas/hooks/useCanvasCommandPalette
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { CommandAction } from "../controls";

interface UseCanvasCommandPaletteParams {
  composer: Composer | null;
  selectedId: string | null;
  clear: () => void;
}

export function useCanvasCommandPalette({
  composer,
  selectedId,
  clear,
}: UseCanvasCommandPaletteParams) {
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const closePalette = React.useCallback(() => setIsPaletteOpen(false), []);
  const openPalette = React.useCallback(() => setIsPaletteOpen(true), []);

  // Keyboard shortcut: Cmd+Shift+P toggles, Escape closes
  React.useEffect(() => {
    const handlePaletteShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isPaletteOpen) {
        e.preventDefault();
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handlePaletteShortcut);
    return () => window.removeEventListener("keydown", handlePaletteShortcut);
  }, [isPaletteOpen]);

  const commands = React.useMemo<CommandAction[]>(() => {
    if (!composer) return [];
    return [
      {
        id: "undo",
        label: "Undo",
        category: "Edit",
        shortcut: "Cmd+Z",
        icon: "\u21a9",
        handler: () => composer.history.undo(),
      },
      {
        id: "redo",
        label: "Redo",
        category: "Edit",
        shortcut: "Cmd+Shift+Z",
        icon: "\u21aa",
        handler: () => composer.history.redo(),
      },
      {
        id: "duplicate",
        label: "Duplicate",
        category: "Edit",
        shortcut: "Cmd+D",
        icon: "\u29c9",
        requiresSelection: true,
        handler: () => selectedId && composer.elements.duplicateElement(selectedId),
      },
      {
        id: "delete",
        label: "Delete",
        category: "Edit",
        shortcut: "Del",
        icon: "\ud83d\uddd1",
        requiresSelection: true,
        handler: () => selectedId && composer.elements.removeElement(selectedId),
      },
      {
        id: "select-all",
        label: "Select All",
        category: "Selection",
        shortcut: "Cmd+A",
        icon: "\u2610",
        handler: () => composer.selection.selectAll(),
      },
      {
        id: "deselect",
        label: "Deselect All",
        category: "Selection",
        shortcut: "Esc",
        icon: "\u2612",
        handler: () => clear(),
      },
      {
        id: "zoom-in",
        label: "Zoom In",
        category: "View",
        shortcut: "Cmd++",
        icon: "\ud83d\udd0d",
        handler: () => composer.emit(EVENTS.ZOOM_IN, {}),
      },
      {
        id: "zoom-out",
        label: "Zoom Out",
        category: "View",
        shortcut: "Cmd+-",
        icon: "\ud83d\udd0e",
        handler: () => composer.emit(EVENTS.ZOOM_OUT, {}),
      },
      {
        id: "zoom-fit",
        label: "Zoom to Fit",
        category: "View",
        shortcut: "Cmd+0",
        icon: "\u26f6",
        handler: () => composer.emit(EVENTS.ZOOM_FIT, {}),
      },
      {
        id: "add-text",
        label: "Add Text",
        category: "Add",
        icon: "T",
        keywords: ["paragraph", "heading"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "text" }),
      },
      {
        id: "add-image",
        label: "Add Image",
        category: "Add",
        icon: "\ud83d\uddbc",
        keywords: ["picture", "photo"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "image" }),
      },
      {
        id: "add-button",
        label: "Add Button",
        category: "Add",
        icon: "\u25fb",
        keywords: ["cta", "link"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "button" }),
      },
      {
        id: "add-container",
        label: "Add Container",
        category: "Add",
        icon: "\u25a2",
        keywords: ["div", "section", "box"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "container" }),
      },
      {
        id: "browse-templates",
        label: "Browse Templates",
        category: "Navigate",
        shortcut: "T",
        icon: "\ud83d\udcd0",
        keywords: ["template", "start", "design", "layout"],
        handler: () => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, {}),
      },
      // Settings navigation
      {
        id: "open-analytics",
        label: "Open Analytics Settings",
        category: "Navigate",
        icon: "\ud83d\udcca",
        keywords: ["analytics", "google", "tracking", "pixel"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "analytics" }),
      },
      {
        id: "open-seo",
        label: "Open SEO Settings",
        category: "Navigate",
        icon: "\ud83d\udd0d",
        keywords: ["seo", "meta", "title", "description", "search"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages", screen: "seo" }),
      },
      {
        id: "open-export",
        label: "Open Export Settings",
        category: "Navigate",
        icon: "\ud83d\udce6",
        keywords: ["export", "code", "download"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "export" }),
      },
      {
        id: "open-integrations",
        label: "Open Integrations",
        category: "Navigate",
        icon: "\ud83d\udd17",
        keywords: ["integrations", "api", "connect", "third-party"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "integrations" }),
      },
      {
        id: "toggle-layers",
        label: "Toggle Layers Panel",
        category: "Navigate",
        icon: "\u2630",
        keywords: ["layers", "tree", "structure"],
        handler: () => composer.emit(EVENTS.UI_TOGGLE_LAYERS, {}),
      },
      {
        id: "toggle-preview",
        label: "Preview Site",
        category: "Navigate",
        shortcut: "Cmd+P",
        icon: "\u25b6",
        keywords: ["preview", "view", "live"],
        handler: () => composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {}),
      },
    ];
  }, [composer, selectedId, clear]);

  return { isPaletteOpen, closePalette, openPalette, commands };
}
