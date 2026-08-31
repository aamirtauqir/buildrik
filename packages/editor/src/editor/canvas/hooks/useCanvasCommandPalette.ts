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
import { getSiteIdFromUrl } from "../../../services/BuildrikSyncProvider";
import type { CommandAction } from "../controls";

interface UseCanvasCommandPaletteParams {
  composer: Composer | null;
  selectedId: string | null;
  clear: () => void;
  /** View mode. No palette is bound at all — see the effect below. */
  readOnly?: boolean;
}

export function useCanvasCommandPalette({
  composer,
  selectedId,
  clear,
  readOnly = false,
}: UseCanvasCommandPaletteParams) {
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const closePalette = React.useCallback(() => setIsPaletteOpen(false), []);
  const openPalette = React.useCallback(() => setIsPaletteOpen(true), []);

  // Keyboard shortcut: Cmd+Shift+P toggles, Escape closes
  React.useEffect(() => {
    /* View mode has no command palette. ⌘K is already withheld there by the
       shell; this one binds its OWN window listener, so it kept opening —
       measured 2026-08-23 with ?view=readonly: ⌘K stayed shut and ⌘⇧P opened a
       full palette. Not binding at all beats rendering a palette whose rows are
       refused one layer down. */
    if (readOnly) return;
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
  }, [isPaletteOpen, readOnly]);

  const commands = React.useMemo<CommandAction[]>(() => {
    if (!composer) return [];
    /* Edit rows run the REGISTRY, they do not reimplement it. This palette used
       to call composer.elements.removeElement(selectedId) and
       duplicateElement(selectedId) straight — a third copy of commands the
       engine already owns, and single-element ones at that, so Delete here took
       one element out of a multi-selection and wrapped nothing in a
       transaction. That is the same defect the ⌘K palette carried in two other
       rows.

       Zoom is deliberately NOT routed, but not for the reason first written
       here. That comment said the two paths give different numbers; they do
       not — the ZOOM_IN listener does setZoom(current + ZOOM_STEP) with
       ZOOM_STEP = 10 (Canvas.tsx, config.ts:90), the same step the registry
       takes. The 150-vs-110 split recorded in defaultCommands.ts comes from the
       FOOTER's own keyboard handler walking ZOOM_PRESETS
       (CanvasFooterToolbar.tsx), a third path again. The real reason to leave
       these emitting is ownership: zoom state lives on the canvas and the
       events are how it hears about it. Routing them through the engine moves
       that ownership, which is a decision, not a cleanup. Corrected after
       codex checked the claim. */
    return [
      {
        id: "undo",
        label: "Undo",
        category: "Edit",
        shortcut: "Cmd+Z",
        icon: "\u21a9",
        handler: () => composer.commands.run("undo"),
      },
      {
        id: "redo",
        label: "Redo",
        category: "Edit",
        shortcut: "Cmd+Shift+Z",
        icon: "\u21aa",
        handler: () => composer.commands.run("redo"),
      },
      {
        id: "duplicate",
        label: "Duplicate",
        category: "Edit",
        shortcut: "Cmd+D",
        icon: "\u29c9",
        requiresSelection: true,
        handler: () => composer.commands.run("duplicate"),
      },
      {
        id: "delete",
        label: "Delete",
        category: "Edit",
        shortcut: "Del",
        icon: "\ud83d\uddd1",
        requiresSelection: true,
        handler: () => composer.commands.run("delete"),
      },
      {
        id: "select-all",
        label: "Select all",
        category: "Edit",
        shortcut: "Cmd+A",
        icon: "\u2610",
        handler: () => composer.commands.run("select-all"),
      },
      {
        id: "deselect",
        label: "Deselect all",
        category: "Edit",
        shortcut: "Esc",
        icon: "\u2612",
        handler: () => clear(),
      },
      {
        id: "zoom-in",
        label: "Zoom in",
        category: "View",
        shortcut: "Cmd++",
        icon: "\ud83d\udd0d",
        handler: () => composer.emit(EVENTS.ZOOM_IN, {}),
      },
      {
        id: "zoom-out",
        label: "Zoom out",
        category: "View",
        shortcut: "Cmd+-",
        icon: "\ud83d\udd0e",
        handler: () => composer.emit(EVENTS.ZOOM_OUT, {}),
      },
      {
        id: "zoom-fit",
        /* Cmd+1, not Cmd+0. Measured live 2026-08-31: from 50%, Cmd+0 goes to
           100% and Cmd+1 fits (33% on a long page). The footer zoom flyout and
           KeyboardShortcutsPanel both already print it this way; this row and
           `shared/constants/commands.ts` were the two places still claiming
           the swap. A printed chord is a contract. */
        label: "Zoom to fit",
        category: "View",
        shortcut: "Cmd+1",
        icon: "\u26f6",
        handler: () => composer.emit(EVENTS.ZOOM_FIT, {}),
      },
      {
        id: "cms-records",
        label: "Manage CMS records",
        category: "Tools",
        icon: "\u{1F5C3}",
        keywords: ["cms", "content", "collection", "records", "data"],
        handler: () => composer.emit(EVENTS.CMS_MANAGE_RECORDS, {}),
      },
      {
        id: "save-template",
        label: "Save page as template",
        category: "Tools",
        icon: "\u{1F4BE}",
        keywords: ["template", "save", "reuse", "my templates"],
        handler: () => composer.emit(EVENTS.TEMPLATE_SAVE_REQUESTED, {}),
      },
      {
        id: "start-collab",
        label: "Start collaboration session",
        category: "Tools",
        icon: "\u{1F465}",
        keywords: ["collaborate", "team", "real-time", "multiplayer", "share"],
        handler: () => {
          const siteId = getSiteIdFromUrl();
          if (siteId) void composer.collab.manager.startSession(siteId, "Editor").catch(() => {});
        },
      },
      {
        id: "add-text",
        label: "Add text",
        category: "Insert",
        icon: "T",
        keywords: ["paragraph", "heading"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "text" }),
      },
      {
        id: "add-image",
        label: "Add image",
        category: "Insert",
        icon: "\ud83d\uddbc",
        keywords: ["picture", "photo"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "image" }),
      },
      {
        id: "add-button",
        label: "Add button",
        category: "Insert",
        icon: "\u25fb",
        keywords: ["cta", "link"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "button" }),
      },
      {
        id: "add-container",
        label: "Add container",
        category: "Insert",
        icon: "\u25a2",
        keywords: ["div", "section", "box"],
        handler: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { type: "container" }),
      },
      {
        id: "browse-templates",
        label: "Browse templates",
        category: "Tools",
        shortcut: "T",
        icon: "\ud83d\udcd0",
        keywords: ["template", "start", "design", "layout"],
        handler: () => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, {}),
      },
      // Settings navigation
      {
        id: "open-analytics",
        label: "Open analytics settings",
        category: "Tools",
        icon: "\ud83d\udcca",
        keywords: ["analytics", "google", "tracking", "pixel"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "analytics" }),
      },
      {
        // Per-page SEO/slug/status live in the Pages tab (each page's gear \u2192
        // Settings \u2192 SEO). Opening Pages is the honest target; deep-linking
        // straight to the SEO drawer needs PagesTab drawer-routing (follow-up).
        id: "open-seo",
        label: "Open page settings (SEO, slug, status)",
        category: "Tools",
        icon: "\ud83d\udd0d",
        keywords: ["seo", "meta", "title", "description", "search", "page", "settings", "slug"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" }),
      },
      {
        id: "open-export",
        label: "Open export settings",
        category: "Tools",
        icon: "\ud83d\udce6",
        keywords: ["export", "code", "download"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "export" }),
      },
      {
        id: "open-integrations",
        label: "Open integrations",
        category: "Tools",
        icon: "\ud83d\udd17",
        keywords: ["integrations", "api", "connect", "third-party"],
        handler: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings", screen: "integrations" }),
      },
      {
        id: "toggle-layers",
        label: "Toggle layers panel",
        category: "View",
        icon: "\u2630",
        keywords: ["layers", "tree", "structure"],
        handler: () => composer.emit(EVENTS.UI_TOGGLE_LAYERS, {}),
      },
      {
        id: "toggle-preview",
        label: "Preview site",
        category: "View",
        shortcut: "Cmd+P",
        icon: "\u25b6",
        keywords: ["preview", "view", "live"],
        handler: () => composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {}),
      },
      // Media commands
      {
        id: "open-media",
        label: "Open media library",
        category: "Tools",
        icon: "\ud83d\uddbc",
        keywords: ["assets", "images", "videos", "library"],
        handler: () => composer.emit("ui:switch-tab", { tab: "assets" }),
      },
      {
        id: "replace-media",
        label: "Replace selected media",
        category: "Tools",
        icon: "\ud83d\udd04",
        requiresSelection: true,
        keywords: ["change", "swap", "image", "replace"],
        handler: () => {
          if (!selectedId) return;
          const el = composer.elements.getElement(selectedId);
          composer.emit("ui:media-selection-request", {
            elementId: selectedId,
            label: el?.getType() === "image" ? "Image" : "Element",
          });
        },
      },
      {
        id: "search-stock",
        label: "Search stock photos",
        category: "Tools",
        icon: "\ud83d\udd0d",
        keywords: ["unsplash", "stock", "find", "discovery"],
        handler: () => {
          composer.emit("ui:switch-tab", { tab: "assets" });
        },
      },
    ];
  }, [composer, selectedId, clear]);

  return { isPaletteOpen, closePalette, openPalette, commands };
}
