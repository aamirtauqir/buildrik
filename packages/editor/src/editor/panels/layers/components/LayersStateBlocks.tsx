/**
 * Layers panel state blocks — v3 boards 4418:83074 (loading), 4418:83295
 * (load-error), 4418:83498 (no-results: "No matching layers" + Clear search,
 * L2-031, owner 2026-10-10). The blocks themselves are shared
 * with Pages (`@/editor/shared/PanelStates`); these bind the Layers copy and
 * the testIds the conformance recipes measure.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { PanelLoadError, PanelLoadingSkeleton, PanelNoResults } from "@/editor/shared/PanelStates";

export const LayersLoadingSkeleton: React.FC = () => (
  <PanelLoadingSkeleton label="Loading layers" testId="layers-loading" barTestId="layers-sk-bar" />
);

export const LayersLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <PanelLoadError
    title="Couldn’t load layers"
    rest="to load this page’s layer tree."
    testId="layers-load-error"
    retryTestId="layers-load-retry"
    onRetry={onRetry}
  />
);

export const LayersNoResults: React.FC<{
  search: string;
  onSearchEverywhere?: (query: string) => void;
  onClear?: () => void;
}> = ({ search, onSearchEverywhere, onClear }) => (
  <PanelNoResults
    search={search}
    title="No matching layers"
    message="Try a different name, or clear the search."
    onClear={onClear}
    testId="layers-no-results"
    everywhereTestId="layers-search-everywhere"
    onSearchEverywhere={onSearchEverywhere}
  />
);
