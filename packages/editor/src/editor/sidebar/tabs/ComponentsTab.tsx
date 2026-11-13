/**
 * ComponentsTab — the Components resource area (2L9 215:43588 B6-K02,
 * 215:43978 B6-K03): a 240px navigation (This page · This site · Component
 * library, Import package…), a header (‹ Back to Add, title, search, sort,
 * + Create component) and the list of masters as 40px rows.
 *
 * Sub-components live in ./component-library/:
 *   ComponentIcon, ComponentDetailScreen, useComponentsState
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, PanelSearch, Select, SkeletonListItem, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { ComponentDetailScreen, componentDeleteCopy } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import type { ComponentsTabProps } from "./component-library/types";
import { useComponentsState } from "./component-library/useComponentsState";
import { ImportPackageDialog } from "./component-library/ImportPackageDialog";
import { LibraryDetailPane } from "./component-library/LibraryDetailPane";

import "./component-library/ComponentsTab.css";
import { EVENTS } from "@/shared/constants";
export type { ComponentsTabProps };


/** Masters created since this page loaded are badged New (board 4418:166980). */
const isNew = (createdAt: number) => createdAt >= performance.timeOrigin;

/** 2L9 215:43588 — the workspace's three places a master can live. */
type Scope = "page" | "site" | "library";
/** "Sort: Most used ▾" (215:43588) plus the two orders a list of names needs. */
type SortKey = "used" | "name" | "newest";

/* 215:46932 — "This site · 8", 12/16/600 ink-soft. */
const LIST_COUNT = "tw:m-0 tw:pb-2 tw:text-[12px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink-soft)]";
/* 215:46933 — a 40px row: 8px in, 12px gaps, a hairline under it. */
const ROW = "tw:flex tw:h-10 tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:pl-2 tw:pr-1";
/* 215:46939 — scope chip, 22px pill, 11/16/500. */
const CHIP = "tw:inline-flex tw:h-[22px] tw:items-center tw:rounded-full tw:px-2 tw:text-[11px] tw:leading-4 tw:font-medium";
const NOTE = "tw:m-0 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";

/** 215:46934 — the 40×28 placeholder thumbnail (three bars on bg-subtle). */
function Thumb() {
  return (
    <span aria-hidden="true" className="tw:flex tw:h-7 tw:w-10 tw:shrink-0 tw:flex-col tw:gap-0.5 tw:rounded tw:bg-[var(--bk-bg-subtle)] tw:pl-[5px] tw:pt-1.5">
      <span className="tw:h-0.5 tw:w-6 tw:rounded-[1px] tw:bg-[var(--bk-border)]" />
      <span className="tw:h-0.5 tw:w-4 tw:rounded-[1px] tw:bg-[var(--bk-border)]" />
      <span className="tw:h-0.5 tw:w-3 tw:rounded-[1px] tw:bg-[var(--bk-border)]" />
    </span>
  );
}

export const ComponentsTab: React.FC<ComponentsTabProps> = ({
  composer,
  onComponentSelect,
  selectedComponentId,
  onClose,
}) => {
  const state = useComponentsState({
    composer,
    selectedComponentId,
    onComponentSelect,
    onClose,
  });
  const { addToast } = useToast();
  /* "+ Create component" makes a master from the canvas selection. With
     nothing selected it says what is missing — it used to do nothing at all
     (measured live 2026-08-22). Lived in LeftSidebar while Components was a
     drawer; the resource area (2L9 215:43588) owns it. */
  const handleCreate = React.useCallback(() => {
    if (!composer?.components?.isAvailable?.()) return;
    const elementId = composer.selection.getSelectedIds()[0];
    if (!elementId) {
      addToast({
        description: "Select an element on the canvas first — a component is made from something.",
        tone: "info",
        duration: 4000,
      });
      return;
    }
    composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
  }, [composer, addToast]);
  const [scope, setScope] = React.useState<Scope>("site");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("used");
  const [importing, setImporting] = React.useState(false);
  /* 215:44616 — the library master chosen in the Component library scope. */
  const [libraryPick, setLibraryPick] = React.useState<string | null>(null);


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

  // ── Area frame: navigation · header · body (215:43588) ───────────────────────

  const linkedIds = new Set(library.filter((l) => l.onThisSite).map((l) => l.componentId));
  const uses = (id: string) => composer?.components?.getInstancesOfComponent?.(id)?.length || 0;
  const onPage = state.components.filter((c) => c.pageId);
  const onSite = state.components.filter((c) => !c.pageId);
  const SCOPES: ReadonlyArray<{ id: Scope; label: string; count: string }> = [
    { id: "page", label: "This page", count: String(onPage.length) },
    { id: "site", label: "This site", count: String(onSite.length) },
    /* 217:43453: a library that did not load has no count. */
    { id: "library", label: "Component library", count: state.libraryLoadFailed ? "—" : String(library.length) },
  ];

  /* 215:47035 — the chosen master's summary, beside the list. */
  const detail = state.detailComponent;
  const pickedLibrary = scope === "library" ? library.find((l) => l.componentId === libraryPick) : undefined;
  const pane =
    composer?.components?.isAvailable() && !state.error && pickedLibrary ? (
      <LibraryDetailPane entry={pickedLibrary} composer={composer} onClose={() => setLibraryPick(null)} />
    ) : composer?.components?.isAvailable() && !state.error && detail ? (
      <ComponentDetailScreen
        component={detail}
        composer={composer}
        linked={linkedIds.has(detail.id)}
        onBack={state.handleBackFromDetail}
        onBackToInstance={state.backToInstance}
        onInsert={state.handleDetailInsert}
        onDelete={state.handleDetailDelete}
        selectedElementId={state.canvasSelection[0] ?? null}
      />
    ) : null;

  const frame = (body: React.ReactNode) => (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:bg-[var(--bk-bg-panel)]" data-testid="comp-panel">
      {/* 215:46695 — 240 wide, 16 in, 8 between; the area title is 20/30/600. */}
      <nav aria-label="Components" className="tw:flex tw:w-60 tw:shrink-0 tw:flex-col tw:gap-2 tw:p-4" data-testid="comp-nav">
        <h2 className="tw:m-0 tw:text-[20px] tw:leading-[30px] tw:font-semibold tw:text-[var(--bk-ink)]">Components</h2>
        <div role="tablist" aria-orientation="vertical" aria-label="Components" className="tw:flex tw:flex-col tw:gap-2" data-testid="comp-scopes">
          {SCOPES.map((s) => {
            const on = scope === s.id;
            return (
              <Button
                key={s.id}
                color="light"
                size="xs"
                role="tab"
                aria-selected={on}
                aria-label={`${s.label} · ${s.count}`}
                data-testid={`comp-scope-${s.id}`}
                onClick={() => setScope(s.id)}
                className={`tw:h-8 tw:w-full tw:justify-start tw:rounded-md tw:border-0 tw:px-3 tw:shadow-none tw:focus:ring-0 ${on ? "tw:bg-[var(--bk-accent-subtle)]" : "tw:bg-transparent tw:hover:bg-[var(--bk-bg-subtle)]"}`}
              >
                <span className="tw:flex-1 tw:text-left tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">{s.label}</span>
                <span className="tw:w-9 tw:text-right tw:text-[12px] tw:leading-4 tw:font-normal tw:text-[var(--bk-ink-soft)]">{s.count}</span>
              </Button>
            );
          })}
        </div>
        {/* 215:46914 — the footer sits 24 below the scopes. "Recently deleted"
            is not drawn: there is no component trash yet (B6-K19). */}
        <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-6">
          <Button
            color="light"
            size="xs"
            className="tw:h-8 tw:w-full tw:justify-start tw:border-0 tw:bg-transparent tw:pl-3 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:shadow-none tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0"
            onClick={() => setImporting(true)}
            data-testid="comp-import-open"
          >
            Import package…
          </Button>
        </div>
      </nav>
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        {/* 215:46714 — 24 in, 12 down; "‹ Back to Add" in a 208 slot, then the title. */}
        <div className="tw:flex tw:shrink-0 tw:flex-col tw:gap-2 tw:px-6 tw:py-3">
          <div className="tw:flex tw:h-8 tw:items-center tw:gap-4">
            <Button
              variant="link"
              size="xs"
              className="tw:h-8 tw:w-52 tw:text-[13px] tw:font-medium"
              data-testid="comp-back-row"
              onClick={() => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" })}
            >
              ‹ Back to Add
            </Button>
            <h1 className="tw:m-0 tw:min-w-0 tw:flex-1 tw:truncate tw:text-[20px] tw:leading-[30px] tw:font-semibold tw:text-[var(--bk-ink)]">
              Components
            </h1>
          </div>
          <div className="tw:flex tw:h-8 tw:items-center tw:gap-2">
            <PanelSearch placeholder="Search components" value={query} onChange={setQuery} className="tw:w-80" data-testid="comp-search" />
            {scope !== "library" ? (
              <Select sizing="sm" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="tw:w-40" data-testid="comp-sort">
                <option value="used">Sort: Most used</option>
                <option value="name">Sort: Name</option>
                <option value="newest">Sort: Newest</option>
              </Select>
            ) : null}
            <span className="tw:flex-1" aria-hidden="true" />
            <Button size="xs" className="tw:h-8 tw:w-40 tw:rounded tw:text-[13px] tw:font-medium" data-testid="comp-create" onClick={handleCreate}>
              + Create component
            </Button>
          </div>
        </div>
        <div className="tw:flex tw:min-h-0 tw:flex-1">
          <div className="tw:min-h-0 tw:min-w-0 tw:flex-1 tw:overflow-auto tw:px-6 tw:pt-2">{body}</div>
          {pane}
        </div>
      </div>
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
    </div>
  );

  // ── Guard: components not available ──────────────────────────────────────────

  if (!composer?.components?.isAvailable()) {
    return frame(
      <EmptyState icon={<ComponentIcon />}>
        <EmptyStateTitle>Components not available</EmptyStateTitle>
        <EmptyStateDesc>
          Components require storage access.
          <br />
          Try opening in a regular browser window.
        </EmptyStateDesc>
      </EmptyState>,
    );
  }

  if (state.error) {
    /* Board 781:4433 writes its own headline and body; the raw thrown
       message ("Failed to load components") is not what it draws. */
    return frame(
      <PanelErrorState
        title="Couldn't load your components."
        message="Your components are safe — only this list failed."
        onRetry={() => state.setError(null)}
      />,
    );
  }

  // ── Body ──────────────────────────────────────────────────────────────────────

  const needle = query.trim().toLowerCase();
  const shown = (scope === "page" ? onPage : onSite)
    .filter((c) => !needle || c.name.toLowerCase().includes(needle))
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "newest" ? b.createdAt - a.createdAt : uses(b.id) - uses(a.id),
    );
  const libraryShown = library.filter((l) => !needle || l.name.toLowerCase().includes(needle));

  const renderRow = (component: (typeof state.components)[number], isLinked: boolean) => {
    const n = uses(component.id);
    return (
      <div
        key={component.id}
        role="button"
        tabIndex={0}
        draggable
        aria-current={detail?.id === component.id || undefined}
        className={`${ROW} tw:cursor-pointer tw:select-none ${detail?.id === component.id ? "tw:bg-[var(--bk-accent-subtle)]" : "tw:hover:bg-[var(--bk-bg-subtle)]"}`}
        data-testid={`comp-row-${component.id}`}
        onClick={() => state.handleViewDetail(component)}
        onDragStart={(e) => state.handleDragStart(e, component)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.handleViewDetail(component); }
        }}
      >
        <Thumb />
        {/* 2L9 217:43947 — a cut-off name is read in full on hover. */}
        <span
          className="tw:w-[190px] tw:shrink-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]"
          title={component.name}
          data-testid={`comp-row-name-${component.id}`}
        >
          {component.name}
        </span>
        <span className="tw:flex tw:w-[168px] tw:shrink-0 tw:items-center">
          <span className={`${CHIP} tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]`} data-testid={`comp-row-scope-${component.id}`}>
            {isLinked ? "Component library" : component.pageId ? "This page" : "This site"}
          </span>
        </span>
        {/* 215:46941 — "12 uses"; the number is sample data, the word is the label. */}
        <span
          className="tw:w-[120px] tw:shrink-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          data-testid={`comp-row-count-${component.id}`}
        >
          {`${n} ${n === 1 ? "use" : "uses"}`}
        </span>
        <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center">
          {isNew(component.createdAt) && (
            /* 215:47007 — New on success-tint. */
            <span className={`${CHIP} tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]`} data-testid={`comp-row-new-${component.id}`}>
              New
            </span>
          )}
        </span>
      </div>
    );
  };

  if (state.components.length === 0 && scope !== "library") {
    /* Board 1138:13394: left-aligned copy, one way forward. */
    return frame(
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="comp-empty">
        <EmptyStateTitle className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
          No components yet.
        </EmptyStateTitle>
        <EmptyStateDesc className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
          Select an element on the canvas and save it as a component to reuse
          it everywhere.
        </EmptyStateDesc>
      </div>,
    );
  }

  return frame(
    <>
      {!state.isLoaded && (
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
          ))}
        </div>
      )}
      <div aria-live="polite">
        <span className="bd-sr-only">{state.components.length} components found</span>
        {scope === "library" && state.libraryLoadFailed ? (
          /* 217:43468 (B6-K24): 14/600 ink title, 12 ink-soft body, a 96px
             primary Retry; the site's own masters still list under This site. */
          <div role="alert" className="tw:flex tw:flex-col tw:items-start" data-testid="comp-library-error">
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
            <p className={LIST_COUNT} data-testid="comp-section-header">Component library · {libraryShown.length}</p>
            {libraryShown.map((l) => {
              const picked = libraryPick === l.componentId;
              return (
                /* 215:44566 — the site row's frame: chip, then "Not on this site". */
                <div
                  key={l.componentId}
                  role="button"
                  tabIndex={0}
                  aria-current={picked || undefined}
                  className={`${ROW} tw:cursor-pointer tw:select-none ${picked ? "tw:bg-[var(--bk-accent-subtle)]" : "tw:hover:bg-[var(--bk-bg-subtle)]"}`}
                  data-testid={`comp-lib-${l.componentId}`}
                  onClick={() => setLibraryPick(l.componentId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLibraryPick(l.componentId); }
                  }}
                >
                  <Thumb />
                  <span className="tw:w-[190px] tw:shrink-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]" title={l.name}>
                    {l.name}
                  </span>
                  <span className="tw:flex tw:w-[168px] tw:shrink-0 tw:items-center">
                    <span className={`${CHIP} tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]`}>Component library</span>
                  </span>
                  <span className="tw:w-[120px] tw:shrink-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid={`comp-lib-status-${l.componentId}`}>
                    {l.onThisSite ? "On this site" : "Not on this site"}
                  </span>
                </div>
              );
            })}
            {library.length === 0 ? (
              <p className={NOTE} data-testid="comp-empty-library">
                No components are shared across this workspace yet.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className={LIST_COUNT} data-testid="comp-section-header">
              {scope === "page" ? "This page" : "This site"} · {shown.length}
            </p>
            {shown.map((component) => renderRow(component, linkedIds.has(component.id)))}
            {scope === "page" && onPage.length === 0 ? (
              /* 217:43651 */
              <div className="tw:flex tw:flex-col tw:gap-1" data-testid="comp-empty-page">
                <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">No components on this page yet</p>
                <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                  Select a section on the canvas and choose Save as component… in Layers or the Inspector. Choose This page to keep it
                  here only.
                </p>
              </div>
            ) : null}
            {needle && shown.length === 0 && (scope === "site" ? onSite : onPage).length > 0 ? (
              <p className={NOTE} data-testid="comp-no-match">
                No components match “{query.trim()}”.
              </p>
            ) : null}
          </>
        )}
      </div>
    </>,
  );
};

export default ComponentsTab;
