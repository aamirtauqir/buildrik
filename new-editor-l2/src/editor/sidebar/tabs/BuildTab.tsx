/**
 * BuildTab v6 — Accordion + Dual-Scroll (7 categories, 52 elements)
 * Drag: dataTransfer "block" → {id, label, category}; Favs: localStorage "bld_favs"
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { BlockData } from "../../../shared/types";
import { PanelHeader } from "../shared/PanelHeader";
import { SearchBar } from "../shared/SearchBar";
import { CATS, BLD_ELEMENTS, TIPS, getAllElements, type ElDef, type CatDef } from "./buildTabData";
import type { TemplateItem } from "./templates";
import "./BuildTab.css";

export interface BuildTabProps {
  composer: Composer | null;
  onBlockClick?: (data: BlockData) => void;
  /** Kept for interface compatibility — Templates is now a standalone tab */
  onTemplateSelect?: (item: TemplateItem | null) => void;
  selectedTemplateId?: string | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

type DragStartFn = (e: React.DragEvent, el: ElDef, catId: string) => void;
type ElClickFn = (el: ElDef, catId: string) => void;
type ToggleFavFn = (name: string) => void;

// SvgIcon — renders hardcoded SVG strings (buildTabData.ts) via DOMParser + replaceChildren
const SvgIcon: React.FC<{ html: string }> = ({ html }) => {
  const ref = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`,
      "image/svg+xml"
    );
    svg.replaceChildren(...Array.from(doc.documentElement.childNodes));
  }, [html]);
  return <svg ref={ref} viewBox="0 0 24 24" />;
};

// parseTip — tips follow "<strong>Bold</strong> rest" pattern; parsed safely via regex
function parseTip(html: string): React.ReactNode {
  const m = html.match(/^<strong>(.*?)<\/strong>(.*)/s);
  return m ? (
    <>
      <strong>{m[1]}</strong>
      {m[2]}
    </>
  ) : (
    html
  );
}

// ElCard
interface ElCardProps {
  el: ElDef;
  catId: string;
  isFav: boolean;
  onDragStart: DragStartFn;
  onClick: ElClickFn;
  onToggleFav: ToggleFavFn;
  showCatBadge?: boolean;
  showRemove?: boolean;
}
const ElCard: React.FC<ElCardProps> = ({
  el,
  catId,
  isFav,
  onDragStart,
  onClick,
  onToggleFav,
  showCatBadge,
  showRemove,
}) => {
  const [dragging, setDragging] = React.useState(false);
  return (
    <div
      className={`bld-el-card${dragging ? " dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        setDragging(true);
        onDragStart(e, el, catId);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={() => onClick(el, catId)}
      role="button"
      tabIndex={0}
      aria-label={`Add ${el.n}`}
    >
      <div className="bld-el-icon">
        <SvgIcon html={el.icon} />
      </div>
      <span className="bld-el-name">{el.n}</span>
      {showCatBadge && <span className="bld-el-cat-badge">{catId}</span>}
      {showRemove ? (
        <button
          className="bld-fav-remove"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(el.n);
          }}
          aria-label={`Remove ${el.n} from favorites`}
        >
          <svg viewBox="0 0 12 12">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      ) : (
        <button
          className={`bld-el-fav${isFav ? " on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(el.n);
          }}
          aria-label={isFav ? `Remove ${el.n} from favorites` : `Add ${el.n} to favorites`}
        >
          <svg viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      )}
    </div>
  );
};

// CatAccordion
interface CatAccordionProps {
  cat: CatDef;
  elements: ElDef[];
  isOpen: boolean;
  onToggle: () => void;
  favs: Set<string>;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onToggleFav: ToggleFavFn;
}
const CatAccordion: React.FC<CatAccordionProps> = ({
  cat,
  elements,
  isOpen,
  onToggle,
  favs,
  onDragStart,
  onElClick,
  onToggleFav,
}) => (
  <div className="bld-cat-item">
    <div
      className={`bld-cat-row${isOpen ? " open" : ""}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
    >
      <div className="bld-cat-icon">
        <SvgIcon html={cat.iconHtml} />
      </div>
      <div className="bld-cat-info">
        <div className="bld-cat-name">{cat.name}</div>
      </div>
      <span className="bld-cat-count">{elements.length}</span>
      <svg className="bld-cat-chev" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
    <div className={`bld-cat-body${isOpen ? " open" : ""}`}>
      <div className="bld-cat-body-inner">
        <div className="bld-el-grid">
          {elements.map((el) => (
            <ElCard
              key={el.n}
              el={el}
              catId={cat.id}
              isFav={favs.has(el.n)}
              onDragStart={onDragStart}
              onClick={onElClick}
              onToggleFav={onToggleFav}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// MyComponents — stub; populated via "Save as Component" flow in ProInspector
const MyComponents: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
  <div>
    <div
      className="bld-mycomp-hdr"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={open}
    >
      <svg className={`bld-mycomp-chev${open ? " open" : ""}`} viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" />
      </svg>
      <span className="bld-sec-lbl">My Components</span>
    </div>
    <div className={`bld-mycomp-body${open ? " open" : ""}`}>
      <div className="bld-empty-comp">
        <span style={{ fontSize: 11, color: "var(--aqb-text-muted)", lineHeight: 1.5 }}>
          Select any element → Properties → &quot;Save as Component&quot; to add reusable components
          here.
        </span>
      </div>
    </div>
  </div>
);

// SearchResults
interface SearchResultsProps {
  query: string;
  favs: Set<string>;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onToggleFav: ToggleFavFn;
}
const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  favs,
  onDragStart,
  onElClick,
  onToggleFav,
}) => {
  const q = query.toLowerCase().trim();
  const results = getAllElements().filter(
    (el) => el.n.toLowerCase().includes(q) || el.catName.toLowerCase().includes(q)
  );
  if (!results.length) {
    return (
      <div className="bld-search-empty">
        <span>🔍</span>
        <span>No elements matching &ldquo;{query}&rdquo;</span>
      </div>
    );
  }
  return (
    <div className="bld-search-results">
      <div className="bld-el-grid">
        {results.map((el) => (
          <ElCard
            key={`${el.catId}-${el.n}`}
            el={el}
            catId={el.catId}
            isFav={favs.has(el.n)}
            onDragStart={onDragStart}
            onClick={onElClick}
            onToggleFav={onToggleFav}
            showCatBadge
          />
        ))}
      </div>
    </div>
  );
};

// FavZone
interface FavZoneProps {
  favs: Set<string>;
  allElements: ReturnType<typeof getAllElements>;
  open: boolean;
  onToggle: () => void;
  onRemoveFav: ToggleFavFn;
  onClearAll: () => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}
const FavZone: React.FC<FavZoneProps> = ({
  favs,
  allElements,
  open,
  onToggle,
  onRemoveFav,
  onClearAll,
  onDragStart,
  onElClick,
}) => {
  const favItems = allElements.filter((el) => favs.has(el.n));
  return (
    <>
      <div
        className={`bld-fav-hdr${open ? " open" : ""}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <div className="bld-fav-icon">⭐</div>
        <span className="bld-fav-lbl">My Favorites</span>
        {favItems.length > 0 && <span className="bld-fav-badge">{favItems.length}</span>}
        {favItems.length > 0 && open && (
          <button
            className="bld-fav-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            aria-label="Clear all favorites"
          >
            clear
          </button>
        )}
        <svg className="bld-fav-chev" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div className={`bld-fav-body${open ? " open" : ""}`}>
        <div className="bld-fav-scroll">
          {favItems.length === 0 ? (
            <div className="bld-favs-empty">
              <span>⭐</span>
              <span>Hover an element and click ★ to favorite it</span>
            </div>
          ) : (
            <div className="bld-favs-grid">
              {favItems.map((el) => (
                <ElCard
                  key={el.n}
                  el={el}
                  catId={el.catId}
                  isFav
                  onDragStart={onDragStart}
                  onClick={onElClick}
                  onToggleFav={onRemoveFav}
                  showRemove
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// TipsFooter
interface TipsFooterProps {
  tipIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (i: number) => void;
}
const TipsFooter: React.FC<TipsFooterProps> = ({ tipIdx, onPrev, onNext, onDotClick }) => (
  <>
    <div className="bld-tips-hd">
      <span className="bld-tips-lbl">💡 Pro Tip</span>
      <div className="bld-tips-nav">
        <button className="bld-tip-arr" onClick={onPrev} aria-label="Previous tip">
          ‹
        </button>
        <button className="bld-tip-arr" onClick={onNext} aria-label="Next tip">
          ›
        </button>
      </div>
    </div>
    <div className="bld-tip-card">{parseTip(TIPS[tipIdx])}</div>
    <div className="bld-tip-dots">
      {TIPS.map((_, i) => (
        <button
          key={i}
          className={`bld-tip-dot${i === tipIdx ? " on" : ""}`}
          onClick={() => onDotClick(i)}
          aria-label={`Tip ${i + 1}`}
        />
      ))}
    </div>
  </>
);

// ── Main ──────────────────────────────────────────────────────────────────────

export const BuildTab: React.FC<BuildTabProps> = ({
  onBlockClick,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const [openCat, setOpenCat] = React.useState<string | null>(null);
  const [myCompOpen, setMyCompOpen] = React.useState(false);
  const [favOpen, setFavOpen] = React.useState(false);
  const [favs, setFavs] = React.useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("bld_favs") ?? "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tipIdx, setTipIdx] = React.useState(0);

  React.useEffect(() => {
    localStorage.setItem("bld_favs", JSON.stringify([...favs]));
  }, [favs]);

  const toggleFav = React.useCallback((name: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleDragStart: DragStartFn = (e, el, catId) => {
    e.dataTransfer.setData(
      "block",
      JSON.stringify({ id: el.blockId, label: el.n, category: catId })
    );
    e.dataTransfer.setData("text/plain", el.blockId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleElClick: ElClickFn = (el, catId) => {
    onBlockClick?.({ id: el.blockId, label: el.n, category: catId });
  };

  const toggleCat = (catId: string) => setOpenCat((prev) => (prev === catId ? null : catId));
  const allElements = React.useMemo(() => getAllElements(), []);

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
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search elements..."
          debounceMs={0}
        />
      </div>
      <div className="bld-shell">
        {/* Zone 1 — Elements (scrolls independently) */}
        <div className="bld-elements-zone">
          {searchQuery.trim() ? (
            <SearchResults
              query={searchQuery}
              favs={favs}
              onDragStart={handleDragStart}
              onElClick={handleElClick}
              onToggleFav={toggleFav}
            />
          ) : (
            <>
              <MyComponents open={myCompOpen} onToggle={() => setMyCompOpen((o) => !o)} />
              {CATS.map((cat) => (
                <CatAccordion
                  key={cat.id}
                  cat={cat}
                  elements={BLD_ELEMENTS[cat.id] ?? []}
                  isOpen={openCat === cat.id}
                  onToggle={() => toggleCat(cat.id)}
                  favs={favs}
                  onDragStart={handleDragStart}
                  onElClick={handleElClick}
                  onToggleFav={toggleFav}
                />
              ))}
            </>
          )}
        </div>
        {/* Zone 2 — My Favorites (pinned) */}
        <div className={`bld-fav-zone${searchQuery ? " dimmed" : ""}`}>
          <FavZone
            favs={favs}
            allElements={allElements}
            open={favOpen}
            onToggle={() => setFavOpen((o) => !o)}
            onRemoveFav={toggleFav}
            onClearAll={() => setFavs(new Set<string>())}
            onDragStart={handleDragStart}
            onElClick={handleElClick}
          />
        </div>
        {/* Zone 3 — Pro Tips (always visible) */}
        <div className="bld-tips">
          <TipsFooter
            tipIdx={tipIdx}
            onPrev={() => setTipIdx((i) => (i - 1 + TIPS.length) % TIPS.length)}
            onNext={() => setTipIdx((i) => (i + 1) % TIPS.length)}
            onDotClick={setTipIdx}
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
