/**
 * ComponentsTab - Reusable components library (orchestrator)
 * Displays, creates, and manages saved components.
 *
 * Sub-components live in ./components/:
 *   ComponentRow, ComponentIcon, ComponentDetailScreen, useComponentsState, styles
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Layers, Plus } from "lucide-react";
import * as React from "react";
import { ConfirmDialog, Modal } from "../../../shared/ui/Modal";
import { SkeletonListItem } from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { PanelErrorState } from "../shared/PanelErrorState";
import { PanelHeader } from "../shared/PanelHeader";
import { SearchBar } from "../shared/SearchBar";
import { ComponentDetailScreen } from "./components/ComponentDetailScreen";
import { ComponentIcon } from "./components/ComponentIcon";
import { ComponentRow } from "./components/ComponentRow";
import {
  containerStyles,
  searchContainerStyles,
  dialogInputStyles,
  dialogCancelBtnStyles,
  dialogPrimaryBtnStyles,
} from "./components/styles";
import type { ComponentsTabProps } from "./components/types";
import { useComponentsState } from "./components/useComponentsState";
import { type ComponentFilter, FILTER_CHIPS } from "./componentsData";

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

  // ── Guard: components not available ──────────────────────────────────────────

  if (!composer?.components?.isAvailable()) {
    return (
      <div style={containerStyles}>
        {state.isStandaloneMode && (
          <PanelHeader
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
        )}
        <div className="aqb-empty-state">
          <ComponentIcon />
          <p className="aqb-empty-state-title">Components not available</p>
          <p className="aqb-empty-state-desc">
            Components require storage access.
            <br />
            Try opening in a regular browser window.
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={containerStyles}>
        {state.isStandaloneMode && (
          <PanelHeader
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
        )}
        <PanelErrorState message={state.error} onRetry={() => state.setError(null)} />
      </div>
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
        <div className="aqb-compact-empty">
          <span className="aqb-compact-empty-text">No components saved yet</span>
          {onCreateNew && (
            <button
              className="aqb-compact-new-btn"
              onClick={onCreateNew}
              title="Right-click any element to save as component"
            >
              + New
            </button>
          )}
        </div>
      );
    }
    return (
      <div style={containerStyles}>
        {state.isStandaloneMode && (
          <>
            <PanelHeader
              title="Components"
              isPinned={isPinned}
              onPinToggle={onPinToggle}
              onHelpClick={state.handleHelpClick}
              onClose={onClose}
            />
            <div style={searchContainerStyles}>
              <SearchBar
                value={state.internalSearchQuery}
                onChange={state.setInternalSearchQuery}
                placeholder="Search components..."
              />
            </div>
          </>
        )}
        <div className="aqb-sidebar-container">
          {state.canCreateComponent && (
            <div className="aqb-context-banner">
              <div className="aqb-context-banner-text">
                <Layers size={14} />
                <span>
                  Selected: {state.canvasSelection.length} layer
                  {state.canvasSelection.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                className="aqb-create-component-btn"
                onClick={onCreateNew}
                title="Create a reusable component from selection"
              >
                <Plus size={14} /> Create Component
              </button>
            </div>
          )}
          <div className="aqb-empty-state">
            <ComponentIcon />
            <p className="aqb-empty-state-title">No components yet</p>
            <p className="aqb-empty-state-desc">
              {state.canCreateComponent ? (
                'Click "Create Component" above to save your selection'
              ) : (
                <>
                  Right-click any element and select
                  <br />
                  &quot;Create Component&quot; to save it
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────

  return (
    <div style={containerStyles}>
      {state.isStandaloneMode && (
        <>
          <PanelHeader
            title="Components"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
          />
          <div style={searchContainerStyles}>
            <SearchBar
              value={state.internalSearchQuery}
              onChange={state.setInternalSearchQuery}
              placeholder="Search components..."
            />
          </div>
        </>
      )}

      <div className="aqb-sidebar-container aqb-scrollbar" style={{ flex: 1, overflow: "auto" }}>
        {!state.isLoaded && (
          <div style={{ padding: "12px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
            ))}
          </div>
        )}

        <div className="aqb-context-banner-hint">
          <span className="aqb-context-hint-title">Create components from canvas:</span>
          <span className="aqb-context-hint-text">
            Select layers → Right-click → Create component
          </span>
        </div>

        <div className="aqb-component-chips">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              className={`aqb-chip ${state.activeFilter === chip.id ? "active" : ""}`}
              onClick={() => state.setActiveFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="aqb-sidebar-content aqb-scrollbar" aria-live="polite">
          <span className="aqb-sr-only">{state.filteredComponents.length} components found</span>
          {state.filteredComponents.length === 0 ? (
            <div className="aqb-empty-state-inline">
              <span>No components match filters</span>
              <button onClick={() => state.setActiveFilter("all" as ComponentFilter)}>
                Clear filters
              </button>
            </div>
          ) : (
            Object.entries(state.groupedComponents).map(([category, items]) => (
              <div key={category} className="aqb-accordion">
                <button
                  className={`aqb-accordion-header ${!state.collapsedGroups.has(category) ? "open" : ""}`}
                  onClick={() => state.toggleGroup(category)}
                >
                  <span className="aqb-accordion-label">
                    {category}
                    <span className="aqb-accordion-count">{items.length}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`aqb-accordion-chevron ${!state.collapsedGroups.has(category) ? "open" : "closed"}`}
                  />
                </button>

                {!state.collapsedGroups.has(category) && (
                  <div className="aqb-component-list">
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
          <input
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
            <button onClick={() => state.setRenameTarget(null)} style={dialogCancelBtnStyles}>
              Cancel
            </button>
            <button onClick={() => state.confirmRename(renameInput)} style={dialogPrimaryBtnStyles}>
              Rename
            </button>
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
              <button
                key={v.id}
                onClick={() => state.confirmVariant(v.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left" as const,
                  background: isCurrent ? "rgba(59,130,246,0.15)" : "var(--aqb-surface-3)",
                  border: isCurrent
                    ? "1px solid var(--aqb-primary)"
                    : "1px solid var(--aqb-border)",
                  color: "var(--aqb-text-primary)",
                }}
              >
                {v.name}
                {isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--aqb-primary)" }}>
                    (current)
                  </span>
                )}
              </button>
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
        <div style={{ color: "var(--aqb-text-secondary)", fontSize: 13, lineHeight: 1.5 }}>
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
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--aqb-text-muted)" }}>
            This ensures a proper deep copy with new element IDs.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ComponentsTab;
