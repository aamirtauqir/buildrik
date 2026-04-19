/**
 * ElementsTab - Block library (orchestrator)
 * Quick Access Pills, animated accordion by category, favorites, recents.
 *
 * State & data live in ./elements/:
 *   useElementsState, constants, ElementCard, AnimatedAccordionContent, ChevronIcon
 *
 * @license BSD-3-Clause
 */

import { History, Star, X, Lightbulb } from "lucide-react";
import * as React from "react";
import { CATEGORY_ICONS } from "./elements/constants";
import { ElementCard, AnimatedAccordionContent, ChevronIcon } from "./elements/ElementCard";
import type { ElementsTabProps } from "./elements/types";
import { useElementsState } from "./elements/useElementsState";

export type { ElementsTabProps };

export const ElementsTab: React.FC<ElementsTabProps> = ({
  searchQuery,
  onBlockClick,
  categoryFilter,
}) => {
  const state = useElementsState({ searchQuery, categoryFilter, onBlockClick });
  const {
    expandedCategory,
    recentIds,
    favorites,
    showTip,
    showRecentsOverlay,
    showFavoritesOverlay,
    setShowRecentsOverlay,
    setShowFavoritesOverlay,
    toggleFavorite,
    isFavorite,
    dismissTip,
    toggleCategory,
    handleClick,
    handleDragStart,
    recentBlocks,
    favoriteBlocks,
    sortedCategories,
    filtered,
  } = state;

  return (
    <div className="buildrick-sidebar-container">
      {/* Quick Access Pills */}
      <div className="buildrick-quick-pills">
        <button
          className={`buildrick-pill ${showRecentsOverlay ? "active" : ""}`}
          onClick={() => {
            setShowRecentsOverlay(!showRecentsOverlay);
            setShowFavoritesOverlay(false);
          }}
        >
          <History size={14} />
          Recents
          {recentIds.length > 0 && <span className="buildrick-pill-badge">{recentIds.length}</span>}
        </button>

        <button
          className={`buildrick-pill ${showFavoritesOverlay ? "active" : ""}`}
          onClick={() => {
            setShowFavoritesOverlay(!showFavoritesOverlay);
            setShowRecentsOverlay(false);
          }}
        >
          <Star size={14} />
          Favorites
          {favorites.length > 0 && <span className="buildrick-pill-badge">{favorites.length}</span>}
        </button>

        {showTip && (
          <button className="buildrick-pill buildrick-pill-tip" onClick={dismissTip}>
            <Lightbulb size={14} />
            Drag onto canvas
            <X size={12} className="buildrick-pill-dismiss" />
          </button>
        )}
      </div>

      {/* Recents overlay */}
      {showRecentsOverlay && (
        <div className="buildrick-quick-overlay">
          <div className="buildrick-overlay-header">
            <span>Recent Elements</span>
            <button onClick={() => setShowRecentsOverlay(false)}>
              <X size={14} />
            </button>
          </div>
          {recentBlocks.length > 0 ? (
            <div className="buildrick-overlay-grid">
              {recentBlocks.map((block) => (
                <ElementCard
                  key={block.id}
                  block={block}
                  isFavorite={isFavorite(block.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={handleClick}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          ) : (
            <div className="buildrick-overlay-empty">
              <History size={24} strokeWidth={1.5} />
              <span>No recent elements</span>
            </div>
          )}
        </div>
      )}

      {/* Favorites overlay */}
      {showFavoritesOverlay && (
        <div className="buildrick-quick-overlay">
          <div className="buildrick-overlay-header">
            <span>Favorite Elements</span>
            <button onClick={() => setShowFavoritesOverlay(false)}>
              <X size={14} />
            </button>
          </div>
          {favoriteBlocks.length > 0 ? (
            <div className="buildrick-overlay-grid">
              {favoriteBlocks.map((block) => (
                <ElementCard
                  key={block.id}
                  block={block}
                  isFavorite={isFavorite(block.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={handleClick}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          ) : (
            <div className="buildrick-overlay-empty">
              <Star size={24} strokeWidth={1.5} />
              <span>No favorites yet</span>
              <span className="buildrick-overlay-hint">Click the star on any element</span>
            </div>
          )}
        </div>
      )}

      {/* Main content — category accordions */}
      {!showRecentsOverlay && !showFavoritesOverlay && (
        <div className="buildrick-sidebar-content buildrick-scrollbar" aria-live="polite">
          {sortedCategories.map((cat) => {
            const isOpen = expandedCategory === cat;
            const CategoryIcon = CATEGORY_ICONS[cat];
            return (
              <div key={cat} className="buildrick-accordion">
                <button
                  className={`buildrick-accordion-header ${isOpen ? "open" : ""}`}
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isOpen}
                >
                  <span className="buildrick-accordion-label">
                    {CategoryIcon && (
                      <CategoryIcon size={18} strokeWidth={2} className="buildrick-accordion-icon" />
                    )}
                    {cat}
                    <span className="buildrick-accordion-count">{filtered[cat].length}</span>
                  </span>
                  <ChevronIcon expanded={isOpen} />
                </button>
                <AnimatedAccordionContent isOpen={isOpen}>
                  <div className="buildrick-element-grid">
                    {filtered[cat].map((block) => (
                      <ElementCard
                        key={block.id}
                        block={block}
                        fullWidth={block.id === "flex"}
                        isFavorite={isFavorite(block.id)}
                        onToggleFavorite={toggleFavorite}
                        onClick={handleClick}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                </AnimatedAccordionContent>
              </div>
            );
          })}

          {sortedCategories.length === 0 && (
            <div className="buildrick-empty-state">
              <p>No elements found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementsTab;
