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
import { EmptyState, EmptyStateDesc, Button } from "@/editor/chrome-ui";
import { CATEGORY_ICONS } from "./elements/constants";
import { ElementCard, AnimatedAccordionContent, ChevronIcon } from "./elements/ElementCard";
import type { ElementsTabProps } from "./elements/types";
import { useElementsState } from "./elements/useElementsState";
export type { ElementsTabProps };

/*
  `tw:` utilities, not a companion stylesheet.

  These classes shipped as ElementsTab.css carrying the same claim as the media
  context menu — that real CSS was required because flowbite's Button theme
  "beats `tw:` overrides". chrome-ui/__tests__/className-precedence.test.tsx
  asserts the opposite and is the contract: a caller's utilities survive the
  merge AND evict flowbite's conflicting ones, because twMerge runs on our own
  `tw` prefix.

  The bug the stylesheet fixed was real — these classNames had no rules
  anywhere, so pills rendered as full-height centred flowbite buttons and the
  chevron never rotated. Keeping the fix, dropping the file.
*/
const PILL_BASE =
  "tw:inline-flex tw:items-center tw:gap-[var(--bk-space-4)] tw:h-[24px] " +
  "tw:px-[var(--bk-space-8)] tw:rounded-full tw:text-[12px] tw:font-normal " +
  "tw:[font-family:var(--bk-font-ui)] tw:cursor-pointer";

const PILL =
  `${PILL_BASE} tw:border tw:border-[var(--bk-border)] tw:bg-transparent ` +
  "tw:text-[var(--bk-ink-soft)] tw:enabled:hover:text-[var(--bk-ink)] " +
  "tw:focus-visible:outline-none tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

const PILL_ACTIVE =
  "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent)] " +
  "tw:text-[var(--bk-accent-on)] tw:font-medium";

/* The dismissible "Drag onto canvas" hint — a pill, but advisory, so it carries
   the warning wash rather than the accent. */
const PILL_TIP =
  `${PILL_BASE} tw:border tw:border-transparent ` +
  "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]";

/* Category accordion header. Full-bleed row, label left, chevron right. */
const ACCORDION_HEADER =
  "tw:flex tw:items-center tw:justify-between tw:w-full tw:h-[var(--bk-size-row-dense)] " +
  "tw:px-[var(--bk-space-8)] tw:border-0 tw:rounded-none tw:bg-transparent " +
  "tw:text-[var(--bk-ink)] tw:text-[12px] tw:font-medium " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-left tw:cursor-pointer " +
  "tw:hover:bg-[var(--bk-bg-subtle)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

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
          className={`${PILL} ${showRecentsOverlay ? PILL_ACTIVE : ""}`}
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
          className={`${PILL} ${showFavoritesOverlay ? PILL_ACTIVE : ""}`}
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
          <Button className={PILL_TIP} onClick={dismissTip}>
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
                  className={ACCORDION_HEADER}
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
