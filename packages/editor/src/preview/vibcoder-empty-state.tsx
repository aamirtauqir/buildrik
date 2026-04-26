/**
 * EmptyState gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  EmptyState,
  EmptyStateArt,
  EmptyStateSpot,
  EmptyStateTitle,
  EmptyStateDesc,
  EmptyStateActions,
  EmptyStateCode,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — zero state</p>
      <EmptyState>
        <EmptyStateArt>
          <EmptyStateSpot tone="accent">＋</EmptyStateSpot>
        </EmptyStateArt>
        <EmptyStateTitle>No pages yet</EmptyStateTitle>
        <EmptyStateDesc>Create your first page to get started.</EmptyStateDesc>
        <EmptyStateActions>
          <button className="bd-btn bd-btn--primary">+ New page</button>
        </EmptyStateActions>
      </EmptyState>

      <p style={{ ...sectionLabel, marginTop: 24 }}>Compact — search no-results</p>
      <EmptyState size="compact">
        <EmptyStateArt>
          <EmptyStateSpot>?</EmptyStateSpot>
        </EmptyStateArt>
        <EmptyStateTitle>Nothing found</EmptyStateTitle>
        <EmptyStateDesc>Try a different search.</EmptyStateDesc>
      </EmptyState>

      <p style={{ ...sectionLabel, marginTop: 24 }}>Tall — error state</p>
      <EmptyState size="tall">
        <EmptyStateArt>
          <EmptyStateSpot tone="error">!</EmptyStateSpot>
        </EmptyStateArt>
        <EmptyStateTitle>Something went wrong</EmptyStateTitle>
        <EmptyStateDesc>Try refreshing or contact support.</EmptyStateDesc>
        <EmptyStateActions>
          <button className="bd-btn">Retry</button>
        </EmptyStateActions>
        <EmptyStateCode>E-500</EmptyStateCode>
      </EmptyState>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
