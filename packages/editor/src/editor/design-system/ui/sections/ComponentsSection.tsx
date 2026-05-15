/**
 * ComponentsSection (Arc B2) — functional catalog body for the DS panel's
 * Components sub-tab.
 *
 * Replaces the prior 3 read-only info cards with the live catalog body:
 * DSStatusChip + filter pills (All|DS|Yours) + search + CatalogSection +
 * UserSavedSection. Mirrors ComponentsPanelV2 (rail tab) shape but omits
 * the PanelHeader because the DS panel already renders panel chrome above
 * (Design label, Beginner/Pro + Light/Dark + section tabs).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import { Input } from "@/editor/shared/vibcoder/Input";
import { CatalogSection } from "../../../components-catalog/ui/CatalogSection";
import { UserSavedSection } from "../../../components-catalog/ui/UserSavedSection";
import { DSStatusChip } from "../../../components-catalog/ui/DSStatusChip";

type FilterMode = "all" | "ds" | "yours";

export interface ComponentsSectionProps {
  composer: Composer | null;
}

const FILTERS: Array<{ id: FilterMode; label: string }> = [
  { id: "all", label: "All" },
  { id: "ds", label: "DS" },
  { id: "yours", label: "Yours" },
];

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderBottom: "1px solid var(--bd-border)",
  flexWrap: "wrap",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "8px 12px",
  borderBottom: "1px solid var(--bd-border)",
};

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: "3px 10px",
  background: active ? "var(--bd-accent)" : "transparent",
  color: active ? "#fff" : "var(--bd-fg-secondary)",
  border: "1px solid",
  borderColor: active ? "var(--bd-accent)" : "var(--bd-border)",
  borderRadius: 12,
  fontSize: 11,
  cursor: "pointer",
});

const searchWrapStyle: React.CSSProperties = {
  padding: "8px 12px 0",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 10px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  fontSize: 12,
  boxSizing: "border-box",
};

const bodyScrollStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};

export const ComponentsSection: React.FC<ComponentsSectionProps> = ({ composer }) => {
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [search, setSearch] = React.useState("");

  const showCatalog = filter === "all" || filter === "ds";
  const showUserSaved = filter === "all" || filter === "yours";

  return (
    <div style={containerStyle} data-components-catalog>
      <div style={chipRowStyle}>
        <DSStatusChip />
      </div>

      <div style={filterRowStyle} role="radiogroup" aria-label="Filter components">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            onClick={() => setFilter(f.id)}
            data-filter-pill={f.id}
            style={pillStyle(filter === f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={searchWrapStyle}>
        <Input
          type="search"
          placeholder="Search components…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search components"
          style={searchInputStyle}
        />
      </div>

      <div style={bodyScrollStyle}>
        {showCatalog && <CatalogSection searchQuery={search} />}
        {showUserSaved && (
          <UserSavedSection composer={composer} searchQuery={search} />
        )}
      </div>
    </div>
  );
};
