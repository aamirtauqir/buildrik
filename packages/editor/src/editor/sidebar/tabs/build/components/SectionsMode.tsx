/**
 * SectionsMode — Sections browser for the Add tab.
 * Browse-style layout: 9 families stacked top-to-bottom with sticky jump anchors.
 * 54 total cards across Hero, About, Features, Testimonials, Pricing, FAQ, CTA,
 * Contact, Footers. Click a jump chip to scrollIntoView the family header.
 *
 * Click-to-insert is wired through useSectionInsert which calls
 * composer.elements.insertHTMLToElement inside a transaction with toast feedback.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import {
  SECTION_FAMILIES,
  SECTION_CARDS,
  SECTION_CARDS_BY_FAMILY,
  type SectionCard,
} from "../catalog/sections";
import { useSectionInsert } from "../hooks/useSectionInsert";

interface SectionsModeProps {
  composer: Composer | null;
  /** Current search query from the BuildTab search bar. When non-empty,
   *  SectionsMode renders a flat filtered list instead of the browse layout. */
  searchQuery?: string;
}

/** Map family id → human label for the tiny family tag shown next to each
 *  card in search results (users need context about which family a result
 *  came from when the browse layout is collapsed to a flat list). */
const FAMILY_LABEL_BY_ID = new Map(SECTION_FAMILIES.map((f) => [f.id, f.label]));

/** Case-insensitive filter over card name + sub + family label. */
function filterSectionCards(query: string): SectionCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SECTION_CARDS.filter((card) => {
    const familyLabel = FAMILY_LABEL_BY_ID.get(card.familyId)?.toLowerCase() ?? "";
    return (
      card.name.toLowerCase().includes(q) ||
      card.sub.toLowerCase().includes(q) ||
      familyLabel.includes(q)
    );
  });
}

export const SectionsMode: React.FC<SectionsModeProps> = ({ composer, searchQuery = "" }) => {
  // Ref per family so jump anchors can scrollIntoView the matching header.
  const familyRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const { handleSectionClick, isInserting } = useSectionInsert(composer);

  const handleJumpTo = React.useCallback((familyId: string) => {
    const el = familyRefs.current[familyId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Cards pre-grouped at module load (SECTION_CARDS_BY_FAMILY). No per-mount
  // work, no useMemo churn.
  const cardsByFamily = SECTION_CARDS_BY_FAMILY;

  const handleDragStart = React.useCallback((e: React.DragEvent, card: SectionCard) => {
    // Sections reuse the existing template drop channel — a section is
    // functionally an HTML-blob insertion identical to a template. This lets
    // canvas handleTemplateDrop insert the section without any drop-side changes.
    e.dataTransfer.setData(
      "application/aquibra-template",
      JSON.stringify({ html: card.html, name: card.name, sectionId: card.id })
    );
    e.dataTransfer.setData("text/plain", card.name);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const onCardActivate = React.useCallback(
    (card: SectionCard) => {
      if (!isInserting) handleSectionClick(card);
    },
    [handleSectionClick, isInserting]
  );

  // Shared card renderer — used by both the browse layout and the filtered
  // search results so click/drag/keyboard behavior stays consistent.
  const renderCard = React.useCallback(
    (card: SectionCard, showFamilyTag: boolean) => (
      <div
        key={card.id}
        className={`bld-sec-card${isInserting ? " bld-sec-card--busy" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, card)}
        onClick={() => onCardActivate(card)}
        role="button"
        tabIndex={0}
        aria-label={`Insert ${card.name}. ${card.sub}`}
        aria-disabled={isInserting}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCardActivate(card);
          }
        }}
      >
        <div className="bld-sec-card-name">
          {card.name}
          {showFamilyTag && (
            <span className="bld-sec-card-family-tag">
              {FAMILY_LABEL_BY_ID.get(card.familyId)}
            </span>
          )}
        </div>
        <div className="bld-sec-card-sub">{card.sub}</div>
      </div>
    ),
    [handleDragStart, isInserting, onCardActivate]
  );

  // Search mode: flat filtered list, no family headers, no jump anchors.
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const filteredCards = React.useMemo(
    () => (isSearching ? filterSectionCards(trimmedQuery) : []),
    [isSearching, trimmedQuery]
  );

  if (isSearching) {
    return (
      <div className="bld-sections-mode">
        <div className="bld-sections-scroll">
          {filteredCards.length === 0 ? (
            <div className="bld-sections-empty" role="status">
              <div className="bld-sections-empty-headline">
                No sections match "{trimmedQuery}"
              </div>
              <div className="bld-sections-empty-sub">
                Try a different keyword, or clear the search to browse all sections.
              </div>
            </div>
          ) : (
            <>
              <div className="bld-sections-family-header" aria-live="polite">
                {filteredCards.length} result{filteredCards.length === 1 ? "" : "s"} for "{trimmedQuery}"
              </div>
              <div className="bld-sec-cards">
                {filteredCards.map((card) => renderCard(card, /* showFamilyTag */ true))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Browse mode: all 9 families stacked with sticky jump anchors.
  return (
    <div className="bld-sections-mode">
      {/* Sticky jump-to anchors — not a real tablist since nothing is filtered. */}
      <div className="bld-sections-jump" role="tablist" aria-label="Jump to section family">
        {SECTION_FAMILIES.map((family) => (
          <button
            key={family.id}
            type="button"
            className="bld-sec-chip"
            onClick={() => handleJumpTo(family.id)}
            aria-label={`Jump to ${family.label} sections`}
          >
            {family.label}
          </button>
        ))}
      </div>

      {/* Scrollable body — all 9 families stacked, each with its own header. */}
      <div className="bld-sections-scroll">
        {SECTION_FAMILIES.map((family) => (
          <section
            key={family.id}
            ref={(el) => {
              familyRefs.current[family.id] = el;
            }}
            className="bld-sections-family"
            aria-labelledby={`sections-family-${family.id}-header`}
          >
            <h3
              id={`sections-family-${family.id}-header`}
              className="bld-sections-family-header"
            >
              {family.label}
            </h3>
            <div className="bld-sec-cards">
              {cardsByFamily[family.id].map((card) => renderCard(card, /* showFamilyTag */ false))}
            </div>
          </section>
        ))}

        <div className="bld-sec-hint">
          <span className="bld-sec-hint-primary">Sections insert into the current page.</span>
          <span className="bld-sec-hint-muted">Use New Page › Templates for full-page starts.</span>
        </div>
      </div>
    </div>
  );
};
