/**
 * ComponentsTab - Reusable components library (orchestrator)
 * Displays, creates, and manages saved components.
 *
 * Sub-components live in ./component-library/:
 *   ComponentRow, ComponentIcon, ComponentDetailScreen, useComponentsState, styles
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Layers, Plus } from "lucide-react";
import * as React from "react";
import { ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, Input, ModalClose, ModalContent, ModalRoot, ModalTitle, Portal, PanelFrame, SkeletonListItem, Stack } from "@/editor/ui";
import { useToast } from "@/editor/ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { SearchBar } from "../shared/SearchBar";
import { ComponentDetailScreen } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import { ComponentRow } from "./component-library/ComponentRow";
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
import { type ComponentFilter, FILTER_CHIPS } from "./componentsData";
import "./component-library/ComponentsTab.css";
import { Button } from "flowbite-react";

export type { ComponentsTabProps };

export const ComponentsTab: React.FC<ComponentsTabProps> = ({
  composer,
  searchQuery: externalSearchQuery,
  compactMode = false,
  onCreateNew,
  onComponentSelect,
  selectedComponentId,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const state = useComponentsState({
    composer,
    externalSearchQuery,
    selectedComponentId,
    onComponentSelect,
    onClose,
    onPinToggle,
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
            isPinned={isPinned}
            onPinToggle={onPinToggle}
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
            isPinned={isPinned}
            onPinToggle={onPinToggle}
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
              isPinned={isPinned}
              onPinToggle={onPinToggle}
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
            isPinned={isPinned}
            onPinToggle={onPinToggle}
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
      <div style={{ flex: 1, overflow: "auto" }}>
        {!state.isLoaded && (
          <div style={{ padding: "12px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
            ))}
          </div>
        )}

        <div>
          <span>Create components from canvas:</span>
          <span>
            Select layers → Right-click → Create component
          </span>
        </div>

        <div>
          {FILTER_CHIPS.map((chip) => (
            <Button
              key={chip.id}
              className={`bd-chip ${state.activeFilter === chip.id ? "active" : ""}`}
              onClick={() => state.setActiveFilter(chip.id)}
            >
              {chip.label}
            </Button>
          ))}
        </div>

        <div aria-live="polite">
          <span className="bd-sr-only">{state.filteredComponents.length} components found</span>
          {state.filteredComponents.length === 0 ? (
            <div>
              <span>No components match filters</span>
              <Button onClick={() => state.setActiveFilter("all" as ComponentFilter)}>
                Clear filters
              </Button>
            </div>
          ) : (
            Object.entries(state.groupedComponents).map(([category, items]) => (
              <div key={category}>
                <Button
                  className={`bd-accordion-header ${!state.collapsedGroups.has(category) ? "open" : ""}`}
                  onClick={() => state.toggleGroup(category)}
                >
                  <span>
                    {category}
                    <span>{items.length}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`bd-accordion-chevron ${!state.collapsedGroups.has(category) ? "open" : "closed"}`}
                  />
                </Button>

                {!state.collapsedGroups.has(category) && (
                  <div>
                    {items.map((component) => (
                      <ComponentRow
                        key={component.id}
                        component={component}
                        instanceCount={
                          composer?.components?.getInstancesOfComponent?.(component.id)?.length || 0
                        }
                        isSelected={state.selectedId === component.id}
                        openMenuId={state.openMenuId}
                        isFavorite={state.isFavorite}
                        hasVariants={state.hasVariants}
                        onDragStart={state.handleDragStart}
                        onViewDetail={state.handleViewDetail}
                        onInstantiate={state.handleInstantiate}
                        onSetOpenMenuId={state.setOpenMenuId}
                        onRename={state.handleRename}
                        onDuplicate={state.handleDuplicate}
                        onSwapVariant={state.handleSwapVariant}
                        onToggleFavorite={state.toggleFavorite}
                        onDelete={state.handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
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
        title="Delete Component"
        message={`Are you sure you want to delete "${state.confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
      <Portal>
        <ModalRoot open={!!state.renameTarget} onOpenChange={(next) => !next && state.setRenameTarget(null)}>
          <ModalContent size="lg">
            <ModalTitle>Rename Component</ModalTitle>
            <ModalClose aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </ModalClose>
            <div className="bd-modal__body">
              <Stack>
                <Input
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
              </Stack>
            </div>
          </ModalContent>
        </ModalRoot>
      </Portal>
      <Portal>
        <ModalRoot open={!!state.variantPicker} onOpenChange={(next) => !next && state.setVariantPicker(null)}>
          <ModalContent size="lg">
            <ModalTitle>{`Select Variant — ${state.variantPicker?.componentName ?? ""}`}</ModalTitle>
            <ModalClose aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </ModalClose>
            <div className="bd-modal__body">
              <Stack gap="sm">
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
              </Stack>
            </div>
          </ModalContent>
        </ModalRoot>
      </Portal>
    </PanelFrame>
  );
};

export default ComponentsTab;
