/**
 * useTemplateSelection — selected/preview state, modal flags, and filtered list.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { type SiteCategory, type TemplateItem, SITE_TEMPLATES } from "../templatesData";

export interface UseTemplateSelectionReturn {
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  previewId: string | null;
  setPreviewId: React.Dispatch<React.SetStateAction<string | null>>;
  showReplace: boolean;
  setShowReplace: React.Dispatch<React.SetStateAction<boolean>>;
  showUpgrade: boolean;
  setShowUpgrade: React.Dispatch<React.SetStateAction<boolean>>;
  searchQ: string;
  setSearchQ: React.Dispatch<React.SetStateAction<string>>;
  activeFilter: SiteCategory;
  setActiveFilter: React.Dispatch<React.SetStateAction<SiteCategory>>;
  /** Filtered + searched template list — derived from searchQ and activeFilter */
  filteredTemplates: TemplateItem[];
  clearAll: () => void;
}

export function useTemplateSelection(showProgress: boolean): UseTemplateSelectionReturn {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [showReplace, setShowReplace] = React.useState(false);
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const [searchQ, setSearchQ] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<SiteCategory>("all");

  const filteredTemplates = React.useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    return SITE_TEMPLATES.filter((t) => {
      const mq = !q || t.name.toLowerCase().includes(q);
      const mc = activeFilter === "all" || t.category === activeFilter;
      return mq && mc;
    });
  }, [searchQ, activeFilter]);

  // Keyboard navigation: Escape dismisses overlays in priority order; Arrow keys move selection.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        if (showProgress) return; // overlay handles its own Cancel
        if (previewId) { setPreviewId(null); return; }
        if (showUpgrade) { setShowUpgrade(false); return; }
        if (showReplace) { setShowReplace(false); return; }
        if (selectedId) { setSelectedId(null); return; }
        return;
      }
      if (inInput) return;
      if (previewId) return;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (showReplace || showUpgrade || showProgress) return;
        e.preventDefault();
        const idx = selectedId ? filteredTemplates.findIndex((t) => t.id === selectedId) : -1;
        const next = e.key === "ArrowRight" ? filteredTemplates[idx + 1] : filteredTemplates[idx - 1];
        if (next) setSelectedId(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewId, showUpgrade, showReplace, selectedId, filteredTemplates, showProgress]);

  const clearAll = React.useCallback(() => {
    setSearchQ("");
    setActiveFilter("all");
  }, []);

  return {
    selectedId,
    setSelectedId,
    previewId,
    setPreviewId,
    showReplace,
    setShowReplace,
    showUpgrade,
    setShowUpgrade,
    searchQ,
    setSearchQ,
    activeFilter,
    setActiveFilter,
    filteredTemplates,
    clearAll,
  };
}
