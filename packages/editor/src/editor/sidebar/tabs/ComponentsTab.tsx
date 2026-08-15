/**
 * ComponentsTab - Reusable components library (orchestrator)
 * Displays, creates, and manages saved components.
 *
 * Sub-components live in ./component-library/:
 *   ComponentRow, ComponentIcon, ComponentDetailScreen, useComponentsState, styles
 *
 * @license BSD-3-Clause
 */

import { Layers, Plus } from "lucide-react";
import * as React from "react";
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, PanelFrame, SkeletonListItem, TextInput, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { SearchBar } from "../shared/SearchBar";
import { ComponentDetailScreen } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import { CreateComponentModal } from "./component-library/CreateComponentModal";
import {
  containerStyles,
  searchContainerStyles,
  dialogInputStyles,
  dialogCancelBtnStyles,
  dialogPrimaryBtnStyles,
} from "./component-library/styles";
import type { ComponentsTabProps } from "./component-library/types";
import { useComponentsState } from "./component-library/useComponentsState";

import "./component-library/ComponentsTab.css";
export type { ComponentsTabProps };

export const ComponentsTab: React.FC<ComponentsTabProps> = ({
  composer,
  searchQuery: externalSearchQuery,
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
    externalSearchQuery,
    selectedComponentId,
    onComponentSelect,
    onClose,
    onExpandToggle,
    onHelpClick,
  });
  const { addToast } = useToast();
  const [renameInput, setRenameInput] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const handleCreateComponent = React.useCallback(
    (payload: { name: string; group: string | null; prefillBindings: boolean }) => {
      const selectedIds = composer?.selection?.getSelectedIds?.() ?? [];
      const elementId = selectedIds[0];
      if (elementId) {
        void composer?.components?.createComponent?.(payload.name, elementId, {
          category: payload.group ?? undefined,
          prefillFromDs: payload.prefillBindings,
        });
      }
    },
    [composer]
  );

  React.useEffect(() => {
    if (state.renameTarget) setRenameInput(state.renameTarget.currentName);
  }, [state.renameTarget]);

  const { pendingToast, setPendingToast } = state;
  React.useEffect(() => {
    if (pendingToast) {
      addToast({ description: pendingToast.message, tone: pendingToast.variant });
      setPendingToast(null);
    }
  }, [pendingToast, addToast, setPendingToast]);

  // ── "+" header action button ──────────────────────────────────────────────────

  const headerAddBtn = (
    <Button
     
      onClick={() => setShowCreateModal(true)}
      title="Create a new component"
      aria-label="Create component"
    >
      <Plus size={14} />
    </Button>
  );

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
          >
            {headerAddBtn}
          </PanelFrame.Header>
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
          >
            {headerAddBtn}
          </PanelFrame.Header>
        )}
        <PanelErrorState message={state.error} onRetry={() => state.setError(null)} />
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
        onInsert={state.handleDetailInsert}
        onDelete={state.handleDetailDelete}
        isInstanceSelected={state.isDetailInstanceSelected}
        onDetachInstance={state.handleDetachInstance}
      />
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (state.components.length === 0) {
    if (compactMode) {
      return (
        <div>
          <span>No components saved yet</span>
          {onCreateNew && (
            <Button
             
              onClick={onCreateNew}
              title="Right-click any element to save as component"
            >
              + New
            </Button>
          )}
        </div>
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
            >
              {headerAddBtn}
            </PanelFrame.Header>
            <div style={searchContainerStyles}>
              <SearchBar
                value={state.internalSearchQuery}
                onChange={state.setInternalSearchQuery}
                placeholder="Search components..."
              />
            </div>
          </>
        )}
        <div>
          {state.canCreateComponent && (
            <div>
              <div>
                <Layers size={14} />
                <span>
                  Selected: {state.canvasSelection.length} layer
                  {state.canvasSelection.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
               
                onClick={onCreateNew}
                title="Create a reusable component from selection"
              >
                <Plus size={14} /> Create Component
              </Button>
            </div>
          )}
          <EmptyState className="comp-empty">
            <span className="comp-empty__icon" aria-hidden="true">◇</span>
            <EmptyStateTitle className="comp-empty__title">No components yet</EmptyStateTitle>
            <EmptyStateDesc className="comp-empty__body">
              Select elements on the canvas and save them as reusable components.
            </EmptyStateDesc>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Learn more
            </a>
          </EmptyState>
        </div>
        {showCreateModal && (
          <CreateComponentModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateComponent}
          />
        )}
      </PanelFrame>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────

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
          >
            {headerAddBtn}
          </PanelFrame.Header>
        </>
      )}
      {/* Board 641:2546 (Components · library): no search, no filter chips —
          one "YOUR COMPONENTS" section of 32h rows (name · "N instances" · ›)
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
          <div className="tw:flex tw:items-center tw:h-7 tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
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
                <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                  {component.name}
                </span>
                <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                  {n} instance{n === 1 ? "" : "s"}
                </span>
                <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" aria-hidden="true">›</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Board 641:2596 panel footer — the screen's ONE primary button. */}
      {onCreateNew && (
        <div className="tw:flex tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-2.5 tw:shrink-0">
          <Button
            size="xs"
            className="tw:h-7 tw:rounded-8 tw:px-3 tw:text-[13px] tw:font-medium"
            data-testid="comp-create"
            onClick={onCreateNew}
          >
            + Create component
          </Button>
        </div>
      )}
      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateComponentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateComponent}
        />
      )}
      <ConfirmDialog
        open={!!state.confirmDelete}
        onClose={() => state.setConfirmDelete(null)}
        onConfirm={() => {
          const name = state.confirmDelete?.name;
          state.confirmDeleteAction();
          addToast({ description: `"${name}" deleted`, tone: "warning", duration: 4000 });
        }}
        /* Board 183:2 — the title asks the question and names the thing, the
           button names the act. "Are you sure you want to…" in the body
           repeated the question the title had already asked. */
        title={`Delete "${state.confirmDelete?.name}"?`}
        message="Instances already placed keep their content; they stop following this component. This cannot be undone."
        confirmLabel="Delete component"
        destructive
      />
      <ModalRoot open={!!state.renameTarget} onOpenChange={(next) => !next && state.setRenameTarget(null)}>
        <ModalContent size="lg">
          <ModalTitle>Rename Component</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <ModalBody>
            <div className="tw:flex tw:flex-col tw:gap-3">
              <TextInput
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") state.confirmRename(renameInput);
                }}
                placeholder="Component name"
                style={dialogInputStyles}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button onClick={() => state.setRenameTarget(null)} style={dialogCancelBtnStyles}>
                  Cancel
                </Button>
                <Button onClick={() => state.confirmRename(renameInput)} style={dialogPrimaryBtnStyles}>
                  Rename
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
      <ModalRoot open={!!state.variantPicker} onOpenChange={(next) => !next && state.setVariantPicker(null)}>
        <ModalContent size="lg">
          <ModalTitle>{`Select Variant — ${state.variantPicker?.componentName ?? ""}`}</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <ModalBody>
            <div className="tw:flex tw:flex-col tw:gap-2">
              {state.variantPicker?.variants.map((v) => {
                const isCurrent = v.id === state.variantPicker?.currentVariantId;
                return (
                  <Button
                    key={v.id}
                    onClick={() => state.confirmVariant(v.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--bk-radius-sm)",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left" as const,
                      background: isCurrent ? "var(--bk-alpha-accent-15)" : "var(--bk-bg-subtle)",
                      border: isCurrent
                        ? "1px solid var(--bk-accent)"
                        : "1px solid var(--bk-border)",
                      color: "var(--bk-ink)",
                    }}
                  >
                    {v.name}
                    {isCurrent && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: "var(--bk-accent)" }}>
                        (current)
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    </PanelFrame>
  );
};

export default ComponentsTab;
