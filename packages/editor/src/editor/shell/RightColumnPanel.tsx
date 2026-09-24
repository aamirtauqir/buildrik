/**
 * The right column's host for Publish · Review · History.
 *
 * Those tabs are React.lazy chunks. In the drawer they sat under LeftSidebar's
 * Suspense + error boundary; moved into the right column they sat under
 * neither. So the first open SUSPENDED to the nearest boundary above the
 * studio — in the dashboard that is next/dynamic's loader around
 * AquibraStudio — which unmounted the whole editor and mounted it again: a
 * full project reload on opening Publish ("Untitled Project", no page tabs,
 * the migration modal again; re-walk 2026-09-24). A crash had the same reach.
 * This host keeps both inside the column: a skeleton while the chunk loads, a
 * retryable panel error if it throws.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { PanelHeaderSize } from "@/editor/chrome-ui";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "../sidebar/SidebarFallbacks";

export const RightColumnPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errorKey, setErrorKey] = React.useState(0);
  return (
    <PanelHeaderSize.Provider value="column">
      <InspectorErrorBoundary key={errorKey} fallback={<SidebarErrorFallback onRetry={() => setErrorKey((k) => k + 1)} />}>
        <React.Suspense fallback={<PanelSkeleton />}>{children}</React.Suspense>
      </InspectorErrorBoundary>
    </PanelHeaderSize.Provider>
  );
};
