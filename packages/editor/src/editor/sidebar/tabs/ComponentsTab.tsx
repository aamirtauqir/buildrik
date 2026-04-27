import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
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
import { ConfirmDialog, Modal } from "../../../shared/ui/Modal";
import { SkeletonListItem } from "@/shared/extensions/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { PanelErrorState } from "../shared/PanelErrorState";
import { PanelShell } from "@shared/ui/panel";
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
    (name: string) => {
      const selectedIds = composer?.selection?.getSelectedIds?.() ?? [];
      const elementId = selectedIds[0];
      if (elementId) {
        void composer?.components?.createComponent?.(name, elementId);
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
      addToast({ message: pendingToast.message, variant: pendingToast.variant });
      setPendingToast(null);
    }
  }, [pendingToast, addToast, setPendingToast]);

  // ── "+" header action button ──────────────────────────────────────────────────

  const headerAddBtn = (
    <Button
      className="buildrick-comp-header-add-btn"
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
      <PanelShell>
        {state.isStandaloneMode && (
          <PanelShell.Header
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          >
            {headerAddBtn}
          </PanelShell.Header>
        )}
        <div className="buildrick-empty-state">
          <ComponentIcon />
          <p className="buildrick-empty-state-title">Components not available</p>
          <p className="buildrick-empty-state-desc">
            Components require storage access.
            <br />
            Try opening in a regular browser window.
          </p>
        </div>
      </PanelShell>
    );
  }

  if (state.error) {
    return (
      <PanelShell>
        {state.isStandaloneMode && (
          <PanelShell.Header
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          >
            {headerAddBtn}
          </PanelShell.Header>
        )}
        <PanelErrorState message={state.error} onRetry={() => state.setError(null)} />
      </PanelShell>
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
        onSwapComponent={state.handleSwapComponent}
      />
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (state.components.length === 0) {
    if (compactMode) {
      return (
        <div className="buildrick-compact-empty">
          <span className="buildrick-compact-empty-text">No components saved yet</span>
          {onCreateNew && (
            <Button
              className="buildrick-compact-new-btn"
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
      <PanelShell>
        {state.isStandaloneMode && (
          <>
            <PanelShell.Header
              title="Components"
              isPinned={isPinned}
              onPinToggle={onPinToggle}
              onHelpClick={state.handleHelpClick}
              onClose={onClose}
            >
              {headerAddBtn}
            </PanelShell.Header>
            <div style={searchContainerStyles}>
              <SearchBar
                value={state.internalSearchQuery}
                onChange={state.setInternalSearchQuery}
                placeholder="Search components..."
              />
            </div>
          </>
        )}
        <div className="buildrick-sidebar-container">
          {state.canCreateComponent && (
            <div className="buildrick-context-banner">
              <div className="buildrick-context-banner-text">
                <Layers size={14} />
                <span>
                  Selected: {state.canvasSelection.length} layer
                  {state.canvasSelection.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                className="buildrick-create-component-btn"
                onClick={onCreateNew}
                title="Create a reusable component from selection"
              >
                <Plus size={14} /> Create Component
              </Button>
            </div>
          )}
          <div className="buildrick-empty-state buildrick-comp-empty-state comp-empty">
            <span className="comp-empty__icon" aria-hidden="true">◇</span>
            <p className="buildrick-empty-state-title buildrick-comp-empty-title comp-empty__title">No components yet</p>
            <p className="buildrick-empty-state-desc buildrick-comp-empty-desc comp-empty__body">
              Select elements on the canvas and save them as reusable components.
            </p>
            <a href="#" className="buildrick-comp-learn-more-btn" onClick={(e) => e.preventDefault()}>
              Learn more
            </a>
          </div>
        </div>
        {showCreateModal && (
          <CreateComponentModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateComponent}
          />
        )}
      </PanelShell>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────

  return (
    <PanelShell>
      {state.isStandaloneMode && (
        <>
          <PanelShell.Header
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          >
            {headerAddBtn}
          </PanelShell.Header>
          <div style={searchContainerStyles}>
            <SearchBar
              value={state.internalSearchQuery}
              onChange={state.setInternalSearchQuery}
              placeholder="Search components..."
            />
          </div>
        </>
      )}
      <div className="buildrick-sidebar-container buildrick-scrollbar" style={{ flex: 1, overflow: "auto" }}>
        {!state.isLoaded && (
          <div style={{ padding: "12px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
            ))}
          </div>
        )}

        <div className="buildrick-context-banner-hint">
          <span className="buildrick-context-hint-title">Create components from canvas:</span>
          <span className="buildrick-context-hint-text">
            Select layers → Right-click → Create component
          </span>
        </div>

        <div className="buildrick-component-chips">
          {FILTER_CHIPS.map((chip) => (
            <Button
              key={chip.id}
              className={`buildrick-chip ${state.activeFilter === chip.id ? "active" : ""}`}
              onClick={() => state.setActiveFilter(chip.id)}
            >
              {chip.label}
            </Button>
          ))}
        </div>

        <div className="buildrick-sidebar-content buildrick-scrollbar" aria-live="polite">
          <span className="buildrick-sr-only">{state.filteredComponents.length} components found</span>
          {state.filteredComponents.length === 0 ? (
            <div className="buildrick-empty-state-inline">
              <span>No components match filters</span>
              <Button onClick={() => state.setActiveFilter("all" as ComponentFilter)}>
                Clear filters
              </Button>
            </div>
          ) : (
            Object.entries(state.groupedComponents).map(([category, items]) => (
              <div key={category} className="buildrick-accordion">
                <Button
                  className={`buildrick-accordion-header ${!state.collapsedGroups.has(category) ? "open" : ""}`}
                  onClick={() => state.toggleGroup(category)}
                >
                  <span className="buildrick-accordion-label">
                    {category}
                    <span className="buildrick-accordion-count">{items.length}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`buildrick-accordion-chevron ${!state.collapsedGroups.has(category) ? "open" : "closed"}`}
                  />
                </Button>

                {!state.collapsedGroups.has(category) && (
                  <div className="buildrick-component-list">
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
        isOpen={!!state.confirmDelete}
        onClose={() => state.setConfirmDelete(null)}
        onConfirm={() => {
          const name = state.confirmDelete?.name;
          state.confirmDeleteAction();
          addToast({ message: `"${name}" deleted`, variant: "warning", duration: 4000 });
        }}
        title="Delete Component"
        message={`Are you sure you want to delete "${state.confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
      <Modal
        isOpen={!!state.renameTarget}
        onClose={() => state.setRenameTarget(null)}
        title="Rename Component"
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        </div>
      </Modal>
      <Modal
        isOpen={!!state.variantPicker}
        onClose={() => state.setVariantPicker(null)}
        title={`Select Variant — ${state.variantPicker?.componentName ?? ""}`}
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.variantPicker?.variants.map((v) => {
            const isCurrent = v.id === state.variantPicker?.currentVariantId;
            return (
              <Button
                key={v.id}
                onClick={() => state.confirmVariant(v.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--bd-radius-sm)",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left" as const,
                  background: isCurrent ? "var(--bd-accent-alpha-15)" : "var(--bd-bg-subtle)",
                  border: isCurrent
                    ? "1px solid var(--bd-accent)"
                    : "1px solid var(--bd-border)",
                  color: "var(--bd-fg-primary)",
                }}
              >
                {v.name}
                {isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "var(--bd-accent)" }}>
                    (current)
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </Modal>
      <Modal
        isOpen={!!state.duplicateInfo}
        onClose={() => state.setDuplicateInfo(null)}
        title="Duplicate Component"
        size="sm"
      >
        <div style={{ color: "var(--bd-fg-secondary)", fontSize: 13, lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 12px" }}>
            To duplicate &quot;{state.duplicateInfo?.name}&quot;:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Insert the component onto canvas (double-click)</li>
            <li>Select the inserted instance</li>
            <li>
              Right-click → &quot;Create Component&quot; with name &quot;
              {state.duplicateInfo?.copyName}&quot;
            </li>
          </ol>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--bd-fg-muted)" }}>
            This ensures a proper deep copy with new element IDs.
          </p>
        </div>
      </Modal>
    </PanelShell>
  );
};

export default ComponentsTab;
