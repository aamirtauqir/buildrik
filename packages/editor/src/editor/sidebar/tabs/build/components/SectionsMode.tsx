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
import { Chevron } from "lucide-react";
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

const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  hero: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
  about: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>,
  features: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  testimonials: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  pricing: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  faq: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  cta: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  contact: <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  footers: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
};

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
  // Active section type for icon grid + accordion layout.
  const [activeSectionType, setActiveSectionType] = React.useState<string>("hero");

  const { handleSectionClick, isInserting } = useSectionInsert(composer);

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

  // Browse mode: icon grid + accordion for section families.
  return (
    <div className="bld-sections-mode">
      {/* SECTION TYPES label */}
      <div className="bld-sec-label">SECTION TYPES</div>

      {/* Icon grid */}
      <div className="bld-sec-type-grid">
        {SECTION_FAMILIES.map((family) => (
          <button
            key={family.id}
            className={`bld-sec-type-card${activeSectionType === family.id ? ' bld-sec-type-card--active' : ''}`}
            onClick={() => setActiveSectionType(family.id)}
            aria-pressed={activeSectionType === family.id}
          >
            <div className="bld-sec-type-icon">
              {SECTION_TYPE_ICONS[family.id]}
            </div>
            <span className="bld-sec-type-name">{family.label}</span>
          </button>
        ))}
      </div>

      {/* Accordion sections - only active one open */}
      {SECTION_FAMILIES.map((family) => {
        const isOpen = activeSectionType === family.id;
        return (
          <section
            key={family.id}
            className="bld-sections-family"
            aria-labelledby={`sections-family-${family.id}-header`}
          >
            <button
              className={`bld-cat-row${isOpen ? ' open' : ''}`}
              onClick={() => setActiveSectionType(isOpen ? '' : family.id)}
              aria-expanded={isOpen}
            >
              <span className="bld-cat-name">{family.label}</span>
              <span className="bld-cat-count">{cardsByFamily[family.id].length}</span>
              <Chevron className="bld-cat-chev" />
            </button>
            <div className={`bld-cat-body${isOpen ? ' open' : ''}`}>
              <div className="bld-cat-body-inner">
                <div className="bld-sec-cards">
                  {cardsByFamily[family.id].map((card) => renderCard(card, false))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Bottom hint */}
      <div className="bld-sec-hint">
        <span className="bld-sec-hint-primary">Sections insert into the current page.</span>
        <span className="bld-sec-hint-muted">Use New Page › Templates for full-page starts.</span>
      </div>
    </div>
  );
};
