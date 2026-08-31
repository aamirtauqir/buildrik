/**
 * ComponentsTab - Reusable components library (orchestrator)
 * Displays, creates, and manages saved components.
 *
 * Sub-components live in ./component-library/:
 *   ComponentRow, ComponentIcon, ComponentDetailScreen, useComponentsState, styles
 *
 * @license BSD-3-Clause
 */

import { Plus } from "lucide-react";
import * as React from "react";
import { Button, ConfirmDialog, EmptyState, EmptyStateDesc, EmptyStateTitle, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, PanelFrame, SkeletonListItem, TextInput, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../shared/PanelErrorState";
import { ComponentDetailScreen } from "./component-library/ComponentDetailScreen";
import { ComponentIcon } from "./component-library/ComponentIcon";
import {
  containerStyles,
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
     
      onClick={() => onCreateNew?.()}
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
            actions={headerAddBtn}
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
            actions={headerAddBtn}
          />
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
        selectedElementId={state.canvasSelection[0] ?? null}
        onDetachInstance={state.handleDetachInstance}
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
              actions={headerAddBtn}
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
          <div className="tw:flex tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-2.5 tw:shrink-0">
            <Button
              size="xs"
              className="tw:h-7 tw:rounded-lg tw:px-3 tw:text-[13px] tw:font-medium"
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
    <PanelFrame>
      {state.isStandaloneMode && (
        <>
          <PanelFrame.Header
            title="Components"
            isExpanded={isExpanded}
            onExpandToggle={onExpandToggle}
            onHelpClick={state.handleHelpClick}
            onClose={onClose}
            actions={headerAddBtn}
          />
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
            className="tw:h-7 tw:rounded-lg tw:px-3 tw:text-[13px] tw:font-medium"
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
        /* Board 183:2 — the title asks the question and names the thing, the
           button names the act. "Are you sure you want to…" in the body
           repeated the question the title had already asked. */
        title={`Delete "${state.confirmDelete?.name}"?`}
        message="Instances already placed keep their content; they stop following this component. This cannot be undone."
        confirmLabel="Delete component"
        tone="destructive"
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
