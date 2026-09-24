/**
 * ComponentsTab - Reusable components library (orchestrator)
 * Displays, creates, and manages saved components.
 *
 * Sub-components live in ./component-library/:
 *   ComponentIcon, ComponentDetailScreen, useComponentsState
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, PanelFrame, SkeletonListItem, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { ComponentDetailScreen, componentDeleteCopy } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import type { ComponentsTabProps } from "./component-library/types";
import { useComponentsState } from "./component-library/useComponentsState";

import "./component-library/ComponentsTab.css";
export type { ComponentsTabProps };


export const ComponentsTab: React.FC<ComponentsTabProps> = ({
  composer,
  compactMode = false,
  onCreateNew,
  onComponentSelect,
  selectedComponentId,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
}) => {
  const state = useComponentsState({
    composer,
    selectedComponentId,
    onComponentSelect,
    onClose,
    onExpandToggle,
    onHelpClick,
  });
  const { addToast } = useToast();

  const { pendingToast, setPendingToast } = state;
  React.useEffect(() => {
    if (pendingToast) {
      addToast({ description: pendingToast.message, tone: pendingToast.variant });
      setPendingToast(null);
    }
  }, [pendingToast, addToast, setPendingToast]);

  // ── Guard: components not available ──────────────────────────────────────────

  if (!composer?.components?.isAvailable()) {
    return (
      <PanelFrame>
        {state.isStandaloneMode && (
          <PanelFrame.Header
            title="Components"
            isExpanded={isExpanded}
            onExpandToggle={onExpandToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
        )}
        <EmptyState icon={<ComponentIcon />}>
          <EmptyStateTitle>Components not available</EmptyStateTitle>
          <EmptyStateDesc>
            Components require storage access.
            <br />
            Try opening in a regular browser window.
          </EmptyStateDesc>
        </EmptyState>
      </PanelFrame>
    );
  }

  if (state.error) {
    return (
      <PanelFrame>
        {state.isStandaloneMode && (
          <PanelFrame.Header
            title="Components"
            isExpanded={isExpanded}
            onExpandToggle={onExpandToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
        )}
        {/* Board 781:4433 writes its own headline and body; the raw thrown
            message ("Failed to load components") is not what it draws, and
            PanelErrorState's `title` default is the generic "Something went
            wrong" every panel is supposed to override. Brand already does
            this at DesignSystemTab.tsx:672. */}
        <PanelErrorState
          title="Couldn't load your components."
          message="Your components are safe — only this list failed."
          onRetry={() => state.setError(null)}
        />
      </PanelFrame>
    );
  }

  // ── Drill-in detail view ──────────────────────────────────────────────────────

  if (state.detailComponent) {
    return (
      <ComponentDetailScreen
        component={state.detailComponent}
        composer={composer}
        onBack={state.handleBackFromDetail}
        onClose={onClose}
        onInsert={state.handleDetailInsert}
        onDelete={state.handleDetailDelete}
        selectedElementId={state.canvasSelection[0] ?? null}
      />
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (state.components.length === 0) {
    if (compactMode) {
      /* Was bare unstyled markup — the audits' "fifth empty-state language".
         The shared EmptyState is the only one. */
      return (
        <EmptyState
          size="sm"
          align="start"
          body="No components saved yet."
          action={
            onCreateNew && (
              <Button
                variant="link"
                size="xs"
                onClick={onCreateNew}
                title="Right-click any element to save as component"
              >
                + New
              </Button>
            )
          }
        />
      );
    }
    return (
      <PanelFrame>
        {state.isStandaloneMode && (
          <>
            <PanelFrame.Header
              title="Components"
              isExpanded={isExpanded}
              onExpandToggle={onExpandToggle}
              onHelpClick={state.handleHelpClick}
              onClose={onClose}
            />
          </>
        )}
        {/* Board 1138:13394. Left-aligned copy at the top of the panel, not a
            centred card with a glyph — and the same bordered footer the list
            view has, so the primary action does not move when the first
            component appears.

            Gone with the rebuild: a search field over zero components, a
            "Selected: N layers" block that duplicated the footer button, and a
            "Learn more" link whose onClick was `e.preventDefault()` and
            nothing else. It had no destination to go to. */}
        <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-1 tw:px-4 tw:py-3">
          <EmptyStateTitle className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
            No components yet.
          </EmptyStateTitle>
          <EmptyStateDesc className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
            Select an element on the canvas and save it as a component to reuse
            it everywhere.
          </EmptyStateDesc>
          {onCreateNew && (
            <Button
              color="light"
              onClick={onCreateNew}
              data-testid="comp-empty-create-link"
              className="tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent)] tw:hover:underline"
            >
              Create component
            </Button>
          )}
        </div>
        {onCreateNew && (
          <div
            className="tw:flex tw:bg-[var(--bk-bg-panel)] tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-2.5 tw:shrink-0"
            data-testid="comp-footer"
          >
            <Button
              size="xs"
              className="tw:h-7 tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium"
              data-testid="comp-create"
              onClick={onCreateNew}
            >
              + Create component
            </Button>
          </div>
        )}
      </PanelFrame>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────

  return (
    <PanelFrame data-testid="comp-panel">
      {state.isStandaloneMode && (
        <>
          <PanelFrame.Header
            title="Components"
            isExpanded={isExpanded}
            onExpandToggle={onExpandToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
        </>
      )}
      {/* Board 641:2546 (Components · library): no search, no filter chips —
          one "YOUR COMPONENTS" section of 32h rows (name · "N on this site" · ›)
          and a bordered footer with the one primary button. The FROM BRAND
          section ships when a brand-linked source exists; today's registry
          has none, so it would always be empty chrome. */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {!state.isLoaded && (
          <div style={{ padding: "12px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
            ))}
          </div>
        )}

        <div aria-live="polite">
          <span className="bd-sr-only">{state.components.length} components found</span>
          <div
            className="tw:flex tw:items-center tw:gap-2 tw:h-7 tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]"
            data-testid="comp-section-header"
          >
            YOUR COMPONENTS
          </div>
          {state.components.map((component) => {
            const n = composer?.components?.getInstancesOfComponent?.(component.id)?.length || 0;
            return (
              <div
                key={component.id}
                role="button"
                tabIndex={0}
                draggable
                className="tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-4 tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
                data-testid={`comp-row-${component.id}`}
                onClick={() => state.handleViewDetail(component)}
                onDragStart={(e) => state.handleDragStart(e, component)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.handleViewDetail(component); }
                }}
              >
                <span
                  className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]"
                  data-testid={`comp-row-name-${component.id}`}
                >
                  {component.name}
                </span>
                {/* Board 641:2564 writes the count as "6 on this site", not
                    "6 instances". The number is sample data; the words are the
                    label, and copy on screen is decided by the board. */}
                <span
                  className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                  data-testid={`comp-row-count-${component.id}`}
                >
                  {n} on this site
                </span>
                <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" aria-hidden="true">›</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Board 641:2596 panel footer — the screen's ONE primary button. */}
      {onCreateNew && (
        <div
          className="tw:flex tw:bg-[var(--bk-bg-panel)] tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-2.5 tw:shrink-0"
          data-testid="comp-footer"
        >
          <Button
            size="xs"
            className="tw:h-7 tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium"
            data-testid="comp-create"
            onClick={onCreateNew}
          >
            + Create component
          </Button>
        </div>
      )}
      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!state.confirmDelete}
        onClose={() => state.setConfirmDelete(null)}
        onConfirm={() => {
          const name = state.confirmDelete?.name;
          state.confirmDeleteAction();
          addToast({ description: `"${name}" deleted`, tone: "warning", duration: 4000 });
        }}
        {...componentDeleteCopy(
          state.confirmDelete?.name ?? "",
          (state.confirmDelete && composer?.components?.getInstancesOfComponent?.(state.confirmDelete.id)?.length) || 0,
        )}
        confirmLabel="Delete"
        tone="destructive"
      />
    </PanelFrame>
  );
};

export default ComponentsTab;
