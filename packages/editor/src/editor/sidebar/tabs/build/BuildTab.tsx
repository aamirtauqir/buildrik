/**
 * BuildTab — Add tab shell.
 *
 * Layout: PanelHeader / SearchBar / panel-scroll / panel-bottom
 * where panel-bottom is pinned (flex-shrink: 0) and hidden during search.
 *
 * Sections mode (pre-built sections catalog + lazy chunk) was removed on
 * 2026-04-23 — the UI switch had been stripped earlier and ~1300 lines
 * across catalog/sections.ts, components/SectionsMode.tsx, and the
 * accompanying hook were unreachable dead code. Only the elements grid
 * remains.
 */

import * as React from "react";
import { PanelFrame } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG, flatCatalog } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import { useCallout } from "./hooks/useCallout";
import { TipsFooter } from "./components/TipsFooter";
import { CatAccordion } from "./components/CatAccordion";
import { SearchResults } from "./components/SearchResults";
import { TransitionCallout } from "./components/TransitionCallout";
import "./BuildTab.css";

export interface BuildTabProps {
  composer: Composer | null;
  onBlockClick?: (data: BlockData) => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const BuildTab: React.FC<BuildTabProps> = ({ composer, onBlockClick, onHelpClick, onClose }) => {
  const tab = useBuildTab(composer, onBlockClick);
  const callout = useCallout();
  const isSearching = tab.searchQuery.trim().length > 0;

  // Search focus shortcuts: "/" (typing-context-safe) and ⌘F (board 137:10 —
  // hijacks browser find while the Insert panel is mounted, same as Figma).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdF = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f";
      if (e.key !== "/" && !isCmdF) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!isCmdF) {
        const tag = target.tagName;
        const inTypingContext =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
        if (inTypingContext) return;
      }
      const input = document.getElementById("bld-search-input") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const blocksSubtitle = `${flatCatalog.length} blocks · ${CATALOG.length} categories`;

  return (
    <PanelFrame className="bld-container">
      {/* 10A: Insert gets the full 16:6 header — help + close come from
          PanelHeader itself (the `onHelpClick`/`onClose` PROPS; children are
          silently dropped by this API). */}
      <PanelFrame.Header title="Insert" subtitle={blocksSubtitle} onHelpClick={onHelpClick} onClose={onClose} />

      <div className="bld-content">
        <div
          className="bld-search-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape" && tab.searchQuery.length > 0) {
              e.stopPropagation();
              tab.setSearchQuery("");
            }
          }}
        >
          <SearchBar
            id="bld-search-input"
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder="Search elements"
            debounceMs={150}
            kbdHint="⌘F"
          />
        </div>

        {isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              groups={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
              onClearSearch={() => tab.setSearchQuery("")}
            />
          </div>
        ) : (
          <div className="bld-scroll">
            {callout.visible && <TransitionCallout />}

            <div className="bld-cats">
              {CATALOG.map((cat) => (
                <CatAccordion
                  key={cat.id}
                  cat={cat}
                  isOpen={tab.openCats.has(cat.id)}
                  onToggle={() => tab.toggleCat(cat.id)}
                  onDragStart={tab.handleDragStart}
                  onElClick={tab.handleElClick}
                />
              ))}
            </div>
          </div>
        )}

        {!isSearching && (
          <div className="bld-panel-bottom">
            <TipsFooter
              tipIdx={tab.tipIdx}
              onPrev={tab.tipPrev}
              onNext={tab.tipNext}
              onDotClick={tab.tipSetAt}
              dismissed={tab.tipDismissed}
              onDismiss={tab.dismissTip}
              collapsed={tab.tipsCollapsed}
              onToggleCollapsed={tab.toggleTipsCollapsed}
            />
          </div>
        )}
      </div>
    </PanelFrame>
  );
};

export default BuildTab;
