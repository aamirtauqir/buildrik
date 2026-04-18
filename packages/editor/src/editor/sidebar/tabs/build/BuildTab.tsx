/**
 * BuildTab — Add tab shell (v4)
 *
 * Layout: PanelHeader / ModeSwitch / SearchBar / panel-scroll / panel-bottom
 * where panel-bottom is pinned (flex-shrink: 0) and hidden during search.
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import { useCallout } from "./hooks/useCallout";
import { CatAccordion } from "./components/CatAccordion";
import { SearchResults } from "./components/SearchResults";
import { TipsFooter } from "./components/TipsFooter";
import { MyComponents } from "./components/MyComponents";
import { TransitionCallout } from "./components/TransitionCallout";
import "./BuildTab.css";

// SectionsMode pulls in ~92 KB of inline HTML. Lazy-load it.
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

/**
 * Error boundary for the lazy SectionsMode chunk — if the chunk fails
 * to load (network error, dev server restart), show a retry affordance
 * instead of an infinite spinner.
 */
class SectionsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("[buildtab] SectionsMode failed to load", error);
  }
  handleRetry = () => {
    this.setState({ error: null });
  };
  render() {
    if (this.state.error) {
      return (
        <div className="bld-sections-mode" role="alert">
          <div className="bld-sections-scroll">
            <div className="bld-sections-family-header">
              Failed to load Sections.{" "}
              <button
                type="button"
                className="bld-retry-btn"
                onClick={this.handleRetry}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const callout = useCallout();
  const isSearching = tab.searchQuery.trim().length > 0;

  // Global "/" shortcut: focus the Build tab search bar.
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
        {/* Mode Switch */}
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

        {/* Search */}
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
            kbdHint="/"
          />
        </div>

        {/* Scroll region */}
        {tab.mode === "sections" ? (
          <SectionsErrorBoundary>
            <React.Suspense fallback={<SectionsFallback />}>
              <SectionsMode composer={composer} searchQuery={tab.searchQuery} />
            </React.Suspense>
          </SectionsErrorBoundary>
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
          <div className="bld-scroll">
            {callout.visible && <TransitionCallout />}

            <MyComponents
              open={tab.myCompOpen}
              onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
              composer={composer}
            />

            <div className="bld-divider" />
            <div className="bld-sec-label">Categories</div>

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

        {/* Pinned bottom strip — hidden during search, hidden in Sections mode */}
        {!isSearching && tab.mode === "elements" && (
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
            <div className="bld-footer-hint" role="note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Drag elements onto canvas or click to insert</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildTab;
