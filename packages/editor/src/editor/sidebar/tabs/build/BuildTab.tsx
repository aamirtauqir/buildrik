/**
 * BuildTab — Add tab shell
 * Matches §10.1 visual hierarchy: Mode switch → Search → Quick Picks (always) → Category browse
 * Screens: RzB6V, nTVi6, SDgR2, fsI8j, GmdOe, gnyrB, QFUVG
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import { CatAccordion } from "./components/CatAccordion";
import { SearchResults } from "./components/SearchResults";
import { TipsFooter } from "./components/TipsFooter";
import { QuickPicks } from "./components/QuickPicks";
import { AISuggestions } from "./components/AISuggestions";
import { MyComponents } from "./components/MyComponents";
import "./BuildTab.css";

// SectionsMode pulls in ~92 KB of inline HTML (54 section templates).
// Lazy-load it so users who stay in Elements mode never pay that cost.
// The chunk is fetched on first click of the "Sections" mode tab.
const SectionsMode = React.lazy(() =>
  import("./components/SectionsMode").then((m) => ({ default: m.SectionsMode }))
);

const SectionsFallback: React.FC = () => (
  <div className="bld-sections-mode" aria-busy="true">
    <div className="bld-sections-scroll">
      <div className="bld-sections-family-header">Loading sections...</div>
    </div>
  </div>
);

export interface BuildTabProps {
  composer: Composer | null;
  onBlockClick?: (data: BlockData) => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  aiEnabled?: boolean;
}

export const BuildTab: React.FC<BuildTabProps> = ({
  composer,
  onBlockClick,
  isPinned,
  onPinToggle,
  onClose,
  aiEnabled,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const isSearching = tab.searchQuery.trim().length > 0;

  // Global "/" shortcut: focus the Build tab search bar. Only fires when focus
  // is not already inside an input/textarea/contentEditable so it doesn't steal
  // keystrokes from any form the user is actively typing in.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const inTypingContext =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      if (inTypingContext) return;
      const input = document.getElementById("bld-search-input") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="bld-container">
      <PanelHeader title="Add" isPinned={isPinned} onPinToggle={onPinToggle} onClose={onClose} />

      <div className="bld-content">
        {/* 1. Mode Switch — top of panel per design (RzB6V, nTVi6, SDgR2)
            Arrow keys, Home/End per §10.1 keyboard spec. */}
        <div className="bld-mode-switch" role="tablist" aria-label="Add tab mode">
          {(["elements", "sections"] as const).map((m) => (
            <button
              key={m}
              className={`bld-mode-pill${tab.mode === m ? " bld-mode-pill--active" : ""}`}
              onClick={() => tab.setMode(m)}
              role="tab"
              aria-selected={tab.mode === m}
              tabIndex={tab.mode === m ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  tab.setMode(m === "elements" ? "sections" : "elements");
                } else if (e.key === "Home") {
                  e.preventDefault();
                  tab.setMode("elements");
                } else if (e.key === "End") {
                  e.preventDefault();
                  tab.setMode("sections");
                }
              }}
            >
              {m === "elements" ? "Elements" : "Sections"}
            </button>
          ))}
        </div>

        {/* 2. Search bar — Escape clears query */}
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
            placeholder={tab.mode === "sections" ? "Search sections..." : "Search elements..."}
            debounceMs={150}
          />
        </div>

        {/* Quick Picks — always visible in Elements mode */}
        {!isSearching && tab.mode === "elements" && (
          <QuickPicks
            picks={tab.picks}
            onRemove={tab.removePick}
            onPlusClick={() => {
              tab.setSearchQuery("");
              tab.setMode("elements");
            }}
            onDragStart={tab.handleDragStart}
            onElClick={tab.handleElClick}
            ftueSeen={tab.ftueSeen}
            onDismissFtue={tab.dismissFtue}
          />
        )}

        {/* TipsFooter — only shown in Elements mode, not during search */}
        {!isSearching && tab.mode === "elements" && (
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
        )}

        {/* MyComponents — only shown in Elements mode, not during search */}
        {!isSearching && tab.mode === "elements" && (
          <MyComponents
            open={tab.myCompOpen}
            onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
            composer={composer}
          />
        )}

        {/* AI Suggestions — only shown in Elements mode, not during search */}
        {!isSearching && tab.mode === "elements" && (
          <AISuggestions enabled={aiEnabled !== false} />
        )}

        {/* 3. Scrollable content area — mode-aware:
              - Sections mode ALWAYS renders SectionsMode (pass searchQuery so
                it can filter sections inline when user types in the search bar).
              - Elements mode: search renders SearchResults, else renders browse. */}
        {tab.mode === "sections" ? (
          <React.Suspense fallback={<SectionsFallback />}>
            <SectionsMode composer={composer} searchQuery={tab.searchQuery} />
          </React.Suspense>
        ) : isSearching ? (
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
          <>
            {/* Category Browse — scrollable area */}
            <div className="bld-cats-scroll">
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
          </>
        )}
      </div>
    </div>
  );
};

export default BuildTab;
