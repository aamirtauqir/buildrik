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
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, PanelBackRow, PanelFrame, PanelSearch, Select, SkeletonListItem, Tabs, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { ComponentDetailScreen, componentDeleteCopy } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import type { ComponentsTabProps } from "./component-library/types";
import { useComponentsState } from "./component-library/useComponentsState";
import { ImportPackageDialog } from "./component-library/ImportPackageDialog";

import "./component-library/ComponentsTab.css";
import { EVENTS } from "@/shared/constants";
export type { ComponentsTabProps };


/** Masters created since this page loaded are badged New (board 4418:166980). */
const isNew = (createdAt: number) => createdAt >= performance.timeOrigin;

/** 2L9 215:43588 — the workspace's three places a master can live. */
type Scope = "page" | "site" | "library";
/** "Sort: Most used ▾" (215:43588) plus the two orders a list of names needs. */
type SortKey = "used" | "name" | "newest";

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
  const [scope, setScope] = React.useState<Scope>("site");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("used");
  const [importing, setImporting] = React.useState(false);

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
  // v3 FC-10: read from useComponentsState (→ useComponentList) instead of
  // fetching it a second time in the same mounted tree.
  const { library } = state;

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
        onBackToInstance={state.backToInstance}
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

  /* 2L9 215:43588 / 215:43978 — This page · This site · Component library,
     each with its count; search and sort apply to the list shown. A linked
     master lists under This site with its source named. */
  const linkedIds = new Set(library.filter((l) => l.onThisSite).map((l) => l.componentId));
  const uses = (id: string) => composer?.components?.getInstancesOfComponent?.(id)?.length || 0;
  const onPage = state.components.filter((c) => c.pageId);
  const onSite = state.components.filter((c) => !c.pageId);
  const needle = query.trim().toLowerCase();
  const shown = (scope === "page" ? onPage : onSite)
    .filter((c) => !needle || c.name.toLowerCase().includes(needle))
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "newest" ? b.createdAt - a.createdAt : uses(b.id) - uses(a.id),
    );
  const libraryShown = library.filter((l) => !needle || l.name.toLowerCase().includes(needle));
  const SCOPES = [
    { id: "page", label: `This page · ${onPage.length}` },
    { id: "site", label: `This site · ${onSite.length}` },
    /* 217:43415: a library that did not load has no count. */
    { id: "library", label: `Component library · ${state.libraryLoadFailed ? "—" : library.length}` },
  ] as const;
  const renderRow = (component: (typeof state.components)[number], isLinked: boolean) => {
    const n = uses(component.id);
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
                {/* 2L9 217:43947 — a cut-off name is read in full on hover. */}
                <span
                  className="tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]"
                  title={component.name}
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
                {/* 2L9 217:43947 writes the count as "12 uses" and names a
                    library master's source ("Component library"). The number
                    is sample data; the words are the label. */}
                <span
                  className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                  data-testid={`comp-row-count-${component.id}`}
                >
                  {justDetached ? "0 linked instances" : `${n} ${n === 1 ? "use" : "uses"}${isLinked ? " · Component library" : ""}`}
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
      <div className="tw:flex-1 tw:overflow-auto">
        {!state.isLoaded && (
          <div className="tw:p-3">
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
          <Tabs
            tabs={SCOPES}
            value={scope}
            onChange={(id) => setScope(id as Scope)}
            label="Components"
            className="tw:flex-wrap tw:px-3 tw:pt-2"
            data-testid="comp-scopes"
          />
          <Button variant="link" size="xs" className="tw:mx-4 tw:h-7 tw:p-0" onClick={() => setImporting(true)} data-testid="comp-import-open">
            Import package…
          </Button>
          <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2">
            <PanelSearch placeholder="Search components" value={query} onChange={setQuery} className="tw:flex-1" data-testid="comp-search" />
            {scope !== "library" ? (
              <Select sizing="sm" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} data-testid="comp-sort">
                <option value="used">Sort: Most used</option>
                <option value="name">Sort: Name</option>
                <option value="newest">Sort: Newest</option>
              </Select>
            ) : null}
          </div>
          {scope === "library" && state.libraryLoadFailed ? (
            /* 217:43468 (B6-K24): 14/600 ink title, 12 ink-soft body, a 96px
               primary Retry; the site's own masters still list under This site. */
            <div role="alert" className="tw:flex tw:flex-col tw:items-start tw:px-6 tw:pt-2" data-testid="comp-library-error">
              <p className="tw:m-0 tw:text-[14px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">
                Couldn’t load the component library
              </p>
              <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
                Your site’s own components are still available under This site.
              </p>
              <Button
                size="xs"
                className="tw:h-8 tw:w-24 tw:rounded tw:text-[13px] tw:font-medium"
                data-testid="comp-library-retry"
                onClick={state.retryLibraryLoad}
              >
                Retry
              </Button>
            </div>
          ) : scope === "library" ? (
            <>
              <div className={SECTION_HEADER} data-testid="comp-section-header">
                <span className="tw:flex-1">Component library · {libraryShown.length}</span>
              </div>
              {libraryShown.map((l) => (
                <div key={l.componentId} className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-4" data-testid={`comp-lib-${l.componentId}`}>
                  <span className="tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" title={l.name}>
                    {l.name}
                  </span>
                  <span className="tw:flex-1" aria-hidden="true" />
                  <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                    {l.onThisSite ? "On this site" : "Not on this site"}
                  </span>
                </div>
              ))}
              {library.length === 0 ? (
                <p className="tw:m-0 tw:px-4 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="comp-empty-library">
                  No components are shared across this workspace yet.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className={SECTION_HEADER} data-testid="comp-section-header">
                <span className="tw:flex-1">{scope === "page" ? "This page" : "This site"} · {shown.length}</span>
              </div>
              {shown.map((component) => renderRow(component, linkedIds.has(component.id)))}
              {scope === "page" && onPage.length === 0 ? (
                /* 217:43651 */
                <div className="tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-2" data-testid="comp-empty-page">
                  <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">No components on this page yet</p>
                  <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                    Select a section on the canvas and choose Save as component… in Layers or the Inspector. Choose This page to keep it
                    here only.
                  </p>
                </div>
              ) : null}
              {needle && shown.length === 0 && (scope === "site" ? onSite : onPage).length > 0 ? (
                <p className="tw:m-0 tw:px-4 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="comp-no-match">
                  No components match “{query.trim()}”.
                </p>
              ) : null}
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
      {importing ? <ImportPackageDialog composer={composer} onClose={() => setImporting(false)} /> : null}
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
