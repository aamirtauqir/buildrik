/**
 * BuildTab — element catalog shell (~90 lines)
 * All state via useBuildTab; sub-components handle rendering.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { useToast } from "../../../../shared/ui/Toast";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import { CatAccordion } from "./components/CatAccordion";
import { FavZone } from "./components/FavZone";
import { MyComponents } from "./components/MyComponents";
import { OnboardingTip } from "./components/OnboardingTip";
import { SearchResults } from "./components/SearchResults";
import { TipsFooter } from "./components/TipsFooter";
import "../BuildTab.css";

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
  onHelpClick,
  onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const { addToast } = useToast();
  const isSearching = tab.searchQuery.trim().length > 0;

  const handleToggleFav = React.useCallback(
    (name: string) => {
      tab.toggleFav(name);
      if (!tab.favsInformed) {
        tab.markFavsInformed();
        addToast({
          message: "Favorites are saved in this browser only.",
          variant: "info",
          duration: 4000,
        });
      }
    },
    [tab, addToast]
  );

  const handleClearFavs = React.useCallback(() => {
    const snapshot = new Set(tab.favs);
    tab.clearFavs();
    addToast({
      message: "Favorites cleared",
      variant: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => tab.restoreFavs(snapshot),
      },
    });
  }, [tab, addToast]);

  return (
    <div style={containerStyles}>
      <PanelHeader
        title="Build"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <div style={searchWrapStyles}>
        <SearchBar
          value={tab.searchQuery}
          onChange={tab.setSearchQuery}
          placeholder="Search elements..."
          debounceMs={0}
        />
      </div>
      {tab.insertionContext && (
        <div className="bld-insert-ctx" aria-live="polite">
          <span className="bld-insert-ctx-icon">📍</span>
          <span className="bld-insert-ctx-text">
            Adding inside: <strong>{tab.insertionContext.label}</strong>
          </span>
        </div>
      )}
      <div className="bld-shell">
        <div className="bld-elements-zone">
          {isSearching ? (
            <SearchResults
              query={tab.searchQuery}
              groups={tab.searchResults}
              favs={tab.favs}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
              onToggleFav={handleToggleFav}
            />
          ) : (
            <>
              <OnboardingTip dismissed={tab.tipDismissed} onDismiss={tab.dismissTip} />
              <MyComponents
                open={tab.myCompOpen}
                onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
                composer={composer}
              />
              {CATALOG.map((cat) => (
                <CatAccordion
                  key={cat.id}
                  cat={cat}
                  isOpen={tab.openCats.has(cat.id)}
                  onToggle={() => tab.toggleCat(cat.id)}
                  favs={tab.favs}
                  onDragStart={tab.handleDragStart}
                  onElClick={tab.handleElClick}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </>
          )}
        </div>
        <FavZone
          favs={tab.favs}
          allElements={tab.allElements}
          open={tab.favOpen}
          dimmed={isSearching}
          onToggle={() => tab.setFavOpen(!tab.favOpen)}
          onRemoveFav={handleToggleFav}
          onClearAll={handleClearFavs}
          onDragStart={tab.handleDragStart}
          onElClick={tab.handleElClick}
        />
        <div className="bld-tips">
          <TipsFooter
            tipIdx={tab.tipIdx}
            onPrev={tab.tipPrev}
            onNext={tab.tipNext}
            onDotClick={tab.tipSetAt}
            dismissed={tab.tipDismissed}
            onDismiss={tab.dismissTip}
          />
        </div>
      </div>
    </div>
  );
};

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};
const searchWrapStyles: React.CSSProperties = { padding: "6px 10px", flexShrink: 0 };

export default BuildTab;
