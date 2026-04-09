/**
 * BuildTab — Quick-Grid element catalog shell
 * Matches .pen screens: RzB6V, nTVi6, SDgR2, fsI8j, GmdOe, QFUVG
 * @license BSD-3-Clause
 */

import { Settings } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import type { DragStartFn, ElClickFn } from "./hooks/useBuildTab";
import { CatAccordion } from "./components/CatAccordion";
import { QuickPicks } from "./components/QuickPicks";
import { PinPopover } from "./components/PinPopover";
import { SearchResults } from "./components/SearchResults";
import "./BuildTab.css";

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
      <PanelHeader title="Add" isPinned={isPinned} onPinToggle={onPinToggle} onClose={onClose}>
        <button
          className="bld-gear-btn"
          onClick={() => tab.setPinPopoverOpen(!tab.pinPopoverOpen)}
          title="Quick Picks settings"
          aria-label="Quick Picks settings"
        >
          <Settings size={16} />
        </button>
      </PanelHeader>

      <div className="bld-content">
        <div className="bld-search-wrap">
          <SearchBar
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder="Search elements..."
            debounceMs={0}
          />
        </div>

        {/* Mode Switch — Elements | Sections */}
        {!isSearching && (
          <div className="bld-mode-switch" role="tablist" aria-label="Add tab mode">
            <button
              className={`bld-mode-pill${tab.mode === "elements" ? " bld-mode-pill--active" : ""}`}
              onClick={() => tab.setMode("elements")}
              role="tab"
              aria-selected={tab.mode === "elements"}
            >
              Elements
            </button>
            <button
              className={`bld-mode-pill${tab.mode === "sections" ? " bld-mode-pill--active" : ""}`}
              onClick={() => tab.setMode("sections")}
              role="tab"
              aria-selected={tab.mode === "sections"}
            >
              Sections
            </button>
          </div>
        )}

        {isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              groups={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
            />
          </div>
        ) : tab.mode === "sections" ? (
          <div className="bld-scroll">
            <SectionsMode
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
            />
          </div>
        ) : (
          <div className="bld-scroll">
            <div className="bld-qp-wrap">
              <QuickPicks
                picks={tab.quickPicks}
                onRemove={tab.removeQuickPick}
                onPlusClick={() => tab.setPinPopoverOpen(true)}
                onDragStart={tab.handleDragStart}
                onElClick={tab.handleElClick}
                ftueSeen={tab.ftueSeen}
                onDismissFtue={tab.dismissFtue}
              />
              <PinPopover
                open={tab.pinPopoverOpen}
                onClose={() => tab.setPinPopoverOpen(false)}
                onPin={(blockId) => {
                  tab.addQuickPick(blockId);
                  if (!tab.ftueSeen) tab.dismissFtue();
                }}
                currentPicks={tab.quickPicks}
              />
            </div>

            <div className="bld-divider" />

            <div className="bld-cats">
              <div className="bld-sec-label">CATEGORIES</div>
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
      </div>
    </div>
  );
};

// ── Sections Mode Content (SDgR2) ──────────────────────────────────────────

const SECTION_FAMILIES = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
  { id: "footers", label: "Footers" },
];

const SECTION_CARDS = [
  { id: "hero-split", name: "Hero split", sub: "Two-column intro with CTA" },
  { id: "feature-band", name: "Feature band", sub: "Three feature cards with icons" },
  { id: "pricing-stack", name: "Pricing stack", sub: "Tiered pricing with comparison cards" },
];

interface SectionsModeProps {
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}

const SectionsMode: React.FC<SectionsModeProps> = ({ onDragStart: _onDragStart, onElClick: _onElClick }) => {
  const [activeFamily, setActiveFamily] = React.useState("hero");

  return (
    <>
      {/* Section families chips row */}
      <div className="bld-sec-label">SECTION FAMILIES</div>
      <div className="bld-sec-chips">
        {SECTION_FAMILIES.map((f) => (
          <button
            key={f.id}
            className={`bld-sec-chip${activeFamily === f.id ? " bld-sec-chip--active" : ""}`}
            onClick={() => setActiveFamily(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section cards */}
      <div className="bld-sec-label" style={{ marginTop: 12 }}>READY TO INSERT</div>
      <div className="bld-sec-cards">
        {SECTION_CARDS.map((card) => (
          <div
            key={card.id}
            className="bld-sec-card"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("block", JSON.stringify({ id: card.id, label: card.name, category: "sections" }));
              e.dataTransfer.setData("text/plain", card.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.preventDefault();
            }}
          >
            <div className="bld-sec-card-name">{card.name}</div>
            <div className="bld-sec-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="bld-sec-hint">
        <span className="bld-sec-hint-primary">Sections insert into the current page.</span>
        <span className="bld-sec-hint-muted">Use New Page › Templates for full-page starts.</span>
      </div>
    </>
  );
};

export default BuildTab;
