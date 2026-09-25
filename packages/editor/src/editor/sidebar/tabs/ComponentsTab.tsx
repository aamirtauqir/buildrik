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
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, PanelBackRow, PanelFrame, SkeletonListItem, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { ComponentDetailScreen, componentDeleteCopy } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import type { ComponentsTabProps } from "./component-library/types";
import { useComponentsState } from "./component-library/useComponentsState";

import "./component-library/ComponentsTab.css";
import { EVENTS } from "@/shared/constants";
import { fetchComponentLibrary, type LibraryComponentEntry } from "@/services/componentSync";
export type { ComponentsTabProps };


/** Masters created since this page loaded are badged New (board 4418:166980). */
const isNew = (createdAt: number) => createdAt >= performance.timeOrigin;

const SECTION_HEADER =
  "tw:flex tw:items-center tw:gap-2 tw:h-7 tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-muted)]";

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

  // Board 4418:143126: the last Detach all, reported at the top of the list.
  const [detached, setDetached] = React.useState<{ id: string; name: string; count: number } | null>(null);
  React.useEffect(() => {
    if (state.detailComponent) setDetached(null);
  }, [state.detailComponent]);

  /* Board 4418:142419: Components is reached from Add ("Manage components ›"),
     and the drawer says so with a back row above its header. */
  const backRow = composer && (
    <PanelBackRow
      label="Add"
      data-testid="comp-back-row"
      onClick={() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" })}
    />
  );

  // Which of this site's masters are shared from the workspace library.
  const [library, setLibrary] = React.useState<LibraryComponentEntry[]>([]);
  React.useEffect(() => {
    if (!composer) return;
    const load = () => void fetchComponentLibrary().then(setLibrary);
    load();
    composer.on(EVENTS.COMPONENT_LIST_UPDATED, load);
    return () => {
      composer.off(EVENTS.COMPONENT_LIST_UPDATED, load);
    };
  }, [composer]);

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
        {backRow}
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
        {backRow}
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
        onDetachedAll={(count) => {
          const { id, name } = state.detailComponent!;
          setDetached({ id, name, count });
        }}
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
      <PanelFrame className="tw:h-full">
        {backRow}
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

  /* Board 4418:142419: YOUR COMPONENTS, then LINKED FROM LIBRARY — masters this
     site shares with other sites of the workspace ("24 on this site · linked"). */
  const linkedIds = new Set(library.filter((l) => l.onThisSite).map((l) => l.componentId));
  const own = state.components.filter((c) => !linkedIds.has(c.id));
  const linked = state.components.filter((c) => linkedIds.has(c.id));
  const renderRow = (component: (typeof state.components)[number], isLinked: boolean) => {
    const n = composer?.components?.getInstancesOfComponent?.(component.id)?.length || 0;
    const justDetached = detached?.id === component.id && n === 0;
    return (
              <div
                key={component.id}
                role="button"
                tabIndex={0}
                draggable
                className={`tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-4 tw:cursor-pointer tw:select-none tw:hover:bg-[var(--bk-bg-subtle)]${justDetached ? " tw:opacity-40" : ""}`}
                data-testid={`comp-row-${component.id}`}
                onClick={() => state.handleViewDetail(component)}
                onDragStart={(e) => state.handleDragStart(e, component)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.handleViewDetail(component); }
                }}
              >
                <span
                  className="tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]"
                  data-testid={`comp-row-name-${component.id}`}
                >
                  {component.name}
                </span>
                {isNew(component.createdAt) && (
                  <span
                    className="tw:flex tw:h-5 tw:shrink-0 tw:items-center tw:rounded tw:bg-[var(--bk-accent-tint)] tw:px-1.5 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-accent)]"
                    data-testid={`comp-row-new-${component.id}`}
                  >
                    New
                  </span>
                )}
                <span className="tw:flex-1" aria-hidden="true" />
                {/* Board 641:2564 writes the count as "6 on this site", not
                    "6 instances". The number is sample data; the words are the
                    label, and copy on screen is decided by the board. */}
                <span
                  className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                  data-testid={`comp-row-count-${component.id}`}
                >
                  {justDetached ? "0 linked instances" : `${n} on this site${isLinked ? " · linked" : ""}`}
                </span>
              </div>
    );
  };

  return (
    <PanelFrame className="tw:h-full" data-testid="comp-panel">
      {backRow}
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
          {detached && (
            <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:py-2 tw:text-[var(--bk-ink)]" role="status" data-testid="comp-detach-notice">
              <p className="tw:m-0 tw:text-[14px] tw:leading-[normal]">
                {detached.count} instance{detached.count === 1 ? "" : "s"} detached
              </p>
              <p className="tw:m-0 tw:text-[12px] tw:leading-[normal]">
                {detached.name} is still saved. Existing page content keeps its appearance.
              </p>
            </div>
          )}
          <p className="tw:m-0 tw:px-3 tw:py-2 tw:text-[11px] tw:leading-[normal] tw:text-[var(--bk-ink)]" data-testid="comp-intro">
            Manage saved masters for this site. Insert places an instance; edits to a master affect its instances.
          </p>
          <div className={SECTION_HEADER} data-testid="comp-section-header">
            <span className="tw:flex-1 tw:tracking-[0.88px]">YOUR COMPONENTS</span>
            <span className="tw:[font-family:var(--bk-font-mono)]">{own.length}</span>
          </div>
          {own.map((component) => renderRow(component, false))}
          {linked.length > 0 && (
            <>
              <div className={SECTION_HEADER} data-testid="comp-section-linked">
                <span className="tw:flex-1 tw:tracking-[0.88px]">LINKED FROM LIBRARY</span>
                <span className="tw:[font-family:var(--bk-font-mono)]">{linked.length}</span>
              </div>
              {linked.map((component) => renderRow(component, true))}
            </>
          )}
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
          void state.confirmDeleteAction().then((toast) => toast && addToast(toast));
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
