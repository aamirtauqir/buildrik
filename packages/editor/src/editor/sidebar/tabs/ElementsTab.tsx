import { Button } from "@/editor/shared/vibcoder/Button";
import { EmptyState, EmptyStateDesc } from "@/editor/shared/vibcoder";
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
    <div>
      {/* Quick Access Pills */}
      <div>
        <Button
          className={`bd-pill ${showRecentsOverlay ? "active" : ""}`}
          onClick={() => {
            setShowRecentsOverlay(!showRecentsOverlay);
            setShowFavoritesOverlay(false);
          }}
        >
          <History size={14} />
          Recents
          {recentIds.length > 0 && <span>{recentIds.length}</span>}
        </Button>

        <Button
          className={`bd-pill ${showFavoritesOverlay ? "active" : ""}`}
          onClick={() => {
            setShowFavoritesOverlay(!showFavoritesOverlay);
            setShowRecentsOverlay(false);
          }}
        >
          <Star size={14} />
          Favorites
          {favorites.length > 0 && <span>{favorites.length}</span>}
        </Button>

        {showTip && (
          <Button className="bd-pill-tip" onClick={dismissTip}>
            <Lightbulb size={14} />
            Drag onto canvas
            <X size={12} />
          </Button>
        )}
      </div>
      {/* Recents overlay */}
      {showRecentsOverlay && (
        <div>
          <div>
            <span>Recent Elements</span>
            <Button onClick={() => setShowRecentsOverlay(false)}>
              <X size={14} />
            </Button>
          </div>
          {recentBlocks.length > 0 ? (
            <div>
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
            <div>
              <History size={24} strokeWidth={1.5} />
              <span>No recent elements</span>
            </div>
          )}
        </div>
      )}
      {/* Favorites overlay */}
      {showFavoritesOverlay && (
        <div>
          <div>
            <span>Favorite Elements</span>
            <Button onClick={() => setShowFavoritesOverlay(false)}>
              <X size={14} />
            </Button>
          </div>
          {favoriteBlocks.length > 0 ? (
            <div>
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
            <div>
              <Star size={24} strokeWidth={1.5} />
              <span>No favorites yet</span>
              <span>Click the star on any element</span>
            </div>
          )}
        </div>
      )}
      {/* Main content — category accordions */}
      {!showRecentsOverlay && !showFavoritesOverlay && (
        <div aria-live="polite">
          {sortedCategories.map((cat) => {
            const isOpen = expandedCategory === cat;
            const CategoryIcon = CATEGORY_ICONS[cat];
            return (
              <div key={cat}>
                <Button
                  className={`bd-accordion-header ${isOpen ? "open" : ""}`}
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isOpen}
                >
                  <span>
                    {CategoryIcon && (
                      <CategoryIcon size={18} strokeWidth={2} />
                    )}
                    {cat}
                    <span>{filtered[cat].length}</span>
                  </span>
                  <ChevronIcon expanded={isOpen} />
                </Button>
                <AnimatedAccordionContent isOpen={isOpen}>
                  <div>
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
            <EmptyState size="compact">
              <EmptyStateDesc>No elements found</EmptyStateDesc>
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementsTab;
