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
}

export const BuildTab: React.FC<BuildTabProps> = ({
  composer,
  onBlockClick,
  isPinned,
  onPinToggle,
  onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const isSearching = tab.searchQuery.trim().length > 0;

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
              className={`bld-mode-tab${tab.mode === m ? " bld-mode-tab--active" : ""}`}
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
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder={tab.mode === "sections" ? "Search sections..." : "Search elements..."}
            debounceMs={150}
          />
        </div>

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
            />
          </div>
        ) : (
          <>
            {/* Category Browse — scrollable area */}
            <div className="bld-cats-scroll">
              <div className="bld-cats">
                <div className="bld-sec-label">Browse</div>
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
