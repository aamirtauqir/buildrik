/**
 * CatalogSection (S6 CU2) — three tier groups (Atoms / Molecules / Organisms)
 * each with its catalog rows. Filtered by the parent search query.
 *
 * Drag → place wiring is stubbed at CatalogRow (sets dataTransfer payload);
 * Canvas-side drop handler ships in a separate arc.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCatalog } from "../useCatalog";
import { CatalogRow } from "./CatalogRow";
import type { ComponentTier, ComponentType } from "../types";

interface CatalogSectionProps {
  searchQuery?: string;
  onComponentSelect?: (id: string) => void;
}

const TIER_ORDER: Array<{ tier: ComponentTier; label: string }> = [
  { tier: "atom",     label: "Atoms" },
  { tier: "molecule", label: "Molecules" },
  { tier: "organism", label: "Organisms" },
];

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--bd-fg-secondary)",
  margin: "12px 0 6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tierBodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const emptyTierStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  padding: "4px 0",
};

const containerStyle: React.CSSProperties = {
  padding: "8px 12px",
};

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  searchQuery = "",
  onComponentSelect,
}) => {
  const catalog = useCatalog();

  const filtered: ComponentType[] = React.useMemo(
    () => catalog.search(searchQuery),
    [catalog, searchQuery],
  );

  const totalCount = filtered.length;

  return (
    <div style={containerStyle} data-catalog-section>
      <div style={sectionHeaderStyle}>From your Design System · {totalCount}</div>
      {TIER_ORDER.map(({ tier, label }) => {
        const tierMatches = filtered.filter((c) => c.category === tier);
        return (
          <div key={tier} data-catalog-tier={tier}>
            <div style={{ ...sectionHeaderStyle, marginTop: 8 }}>
              {label} ({tierMatches.length})
            </div>
            <div style={tierBodyStyle}>
              {tierMatches.length === 0 ? (
                <div style={emptyTierStyle}>
                  {searchQuery ? "No matches in this tier" : "No components yet"}
                </div>
              ) : (
                tierMatches.map((c) => (
                  <CatalogRow key={c.id} component={c} onSelect={onComponentSelect} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
