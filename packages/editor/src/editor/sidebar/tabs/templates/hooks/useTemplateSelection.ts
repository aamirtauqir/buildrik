/**
 * useTemplateSelection — preview/detail state, modal flags, and filtered list.
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  type SiteCategory,
  type TemplateItem,
  type TemplateType,
  SITE_TEMPLATES,
} from "../templatesData";

const PAGE_SIZE = 12;

export interface UseTemplateSelectionReturn {
  previewId: string | null;
  setPreviewId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Currently expanded card → drives the inline TemplateDetail panel. */
  detailId: string | null;
  setDetailId: React.Dispatch<React.SetStateAction<string | null>>;
  showReplace: boolean;
  setShowReplace: React.Dispatch<React.SetStateAction<boolean>>;
  showUpgrade: boolean;
  setShowUpgrade: React.Dispatch<React.SetStateAction<boolean>>;
  searchQ: string;
  setSearchQ: React.Dispatch<React.SetStateAction<string>>;
  activeFilter: SiteCategory;
  setActiveFilter: React.Dispatch<React.SetStateAction<SiteCategory>>;
  /** null = browse all categories. Set = drilled into Page or Section templates. */
  templateType: TemplateType | null;
  setTemplateType: React.Dispatch<React.SetStateAction<TemplateType | null>>;
  /** Selected sub-category tag id (hero, features, pricing…). */
  subCategory: string | null;
  setSubCategory: React.Dispatch<React.SetStateAction<string | null>>;
  /** 1-indexed current page. */
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  /** Filtered + searched template list — derived from searchQ and activeFilter */
  filteredTemplates: TemplateItem[];
  /** Slice of filteredTemplates for the current page. */
  paginatedTemplates: TemplateItem[];
  clearAll: () => void;
}

export function useTemplateSelection(showProgress: boolean): UseTemplateSelectionReturn {
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [showReplace, setShowReplace] = React.useState(false);
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const [searchQ, setSearchQ] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<SiteCategory>("all");
  const [templateType, setTemplateType] = React.useState<TemplateType | null>(null);
  const [subCategory, setSubCategory] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Auto-set templateType when top-level pill changes.
  React.useEffect(() => {
    if (activeFilter === "site-pages") setTemplateType("page");
    else if (activeFilter === "sections") setTemplateType("section");
    else setTemplateType(null);
  }, [activeFilter]);

  const filteredTemplates = React.useMemo(() => {
    // "my-templates" is a placeholder — user-saved templates are a separate arc.
    if (activeFilter === "my-templates") return [];
    const q = searchQ.toLowerCase().trim();
    return SITE_TEMPLATES.filter((t) => {
      const mq = !q || t.name.toLowerCase().includes(q);
      const mc = activeFilter === "all" || t.category === activeFilter;
      const mt = !templateType || t.type === templateType;
      const ms = !subCategory || t.subCategory === subCategory;
      return mq && mc && mt && ms;
    });
  }, [searchQ, activeFilter, templateType, subCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));

  // Reset to page 1 when filters change so the user isn't stranded on an
  // empty page after narrowing the result set.
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQ, activeFilter, templateType, subCategory]);

  const paginatedTemplates = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTemplates.slice(start, start + PAGE_SIZE);
  }, [filteredTemplates, currentPage]);

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
        if (detailId) { setDetailId(null); return; }
        return;
      }
      if (inInput) return;
      if (previewId) return;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (showReplace || showUpgrade || showProgress) return;
        e.preventDefault();
        const idx = detailId ? filteredTemplates.findIndex((t) => t.id === detailId) : -1;
        const next = e.key === "ArrowRight" ? filteredTemplates[idx + 1] : filteredTemplates[idx - 1];
        if (next) setDetailId(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewId, showUpgrade, showReplace, detailId, filteredTemplates, showProgress]);

  const clearAll = React.useCallback(() => {
    setSearchQ("");
    setActiveFilter("all");
    setTemplateType(null);
    setSubCategory(null);
    setDetailId(null);
    setCurrentPage(1);
  }, []);

  return {
    previewId,
    setPreviewId,
    detailId,
    setDetailId,
    showReplace,
    setShowReplace,
    showUpgrade,
    setShowUpgrade,
    searchQ,
    setSearchQ,
    activeFilter,
    setActiveFilter,
    templateType,
    setTemplateType,
    subCategory,
    setSubCategory,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredTemplates,
    paginatedTemplates,
    clearAll,
  };
}
