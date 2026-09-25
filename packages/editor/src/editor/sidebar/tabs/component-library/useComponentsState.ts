/**
 * useComponentsState - State management hook for ComponentsTab
 * Extracts all state, effects, and callbacks from the main component
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { takePendingMaster } from "./openMasterRequest";
import { deleteComponentWithUndo } from "./ComponentDetailScreen";
import { useComponentList } from "./useComponentList";
import type { ToastInput } from "@/editor/chrome-ui";

const MAX_COMPONENTS = 100;

// Dialog state types (replace native alert/confirm/prompt)
export interface DeleteConfirmState {
  id: string;
  name: string;
}
export interface PendingToastState {
  message: string;
  variant: "info" | "warning" | "error" | "success";
}
interface UseComponentsStateParams {
  composer: Composer | null;
  selectedComponentId?: string | null;
  onComponentSelect?: (component: ComponentDefinition | null) => void;
  onClose?: () => void;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
}

export function useComponentsState({
  composer,
  selectedComponentId,
  onComponentSelect,
  onClose,
  onExpandToggle,
  onHelpClick,
}: UseComponentsStateParams) {
  // v3 FC-10: the load + subscribe shape lives once, in useComponentList.
  const { components, isLoaded, error, setError, library } = useComponentList(composer);

  // Use controlled selectedId if provided, otherwise internal state
  const [internalSelectedId, setInternalSelectedId] = React.useState<string | null>(null);
  const selectedId = selectedComponentId !== undefined ? selectedComponentId : internalSelectedId;
  const setSelectedId = React.useCallback(
    (id: string | null) => {
      setInternalSelectedId(id);
      if (onComponentSelect) {
        const component = id ? (components.find((c) => c.id === id) ?? null) : null;
        onComponentSelect(component);
      }
    },
    [components, onComponentSelect]
  );

  // Detail view navigation state
  const [detailComponent, setDetailComponent] = React.useState<ComponentDefinition | null>(null);

  const [canvasSelection, setCanvasSelection] = React.useState<string[]>([]);

  // Dialog state (replaces native alert/confirm/prompt)
  const [confirmDelete, setConfirmDelete] = React.useState<DeleteConfirmState | null>(null);
  const [pendingToast, setPendingToast] = React.useState<PendingToastState | null>(null);

  // Listen for canvas selection changes
  React.useEffect(() => {
    if (!composer) return;
    const handleSelectionChange = () => {
      const ids = composer.selection?.getSelectedIds() || [];
      setCanvasSelection(ids);
    };
    handleSelectionChange();
    composer.on("element:selected", handleSelectionChange);
    composer.on("selection:added", handleSelectionChange);
    composer.on("selection:removed", handleSelectionChange);
    composer.on("selection:cleared", handleSelectionChange);
    composer.on("selection:multiple", handleSelectionChange);
    return () => {
      composer.off("element:selected", handleSelectionChange);
      composer.off("selection:added", handleSelectionChange);
      composer.off("selection:removed", handleSelectionChange);
      composer.off("selection:cleared", handleSelectionChange);
      composer.off("selection:multiple", handleSelectionChange);
    };
  }, [composer]);

  // Drag handler
  const handleDragStart = React.useCallback(
    (e: React.DragEvent, component: ComponentDefinition) => {
      e.dataTransfer.setData("application/x-aquibra-component", component.id);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  // Instantiate a component on canvas
  const handleInstantiate = React.useCallback(
    async (componentId: string) => {
      if (!composer) return;
      const selectedIds = composer.selection.getSelectedIds();
      let parentId = selectedIds[0];
      if (!parentId) {
        const activePage = composer.elements.getActivePage();
        if (activePage?.root) parentId = activePage.root.id;
      }
      if (!parentId) {
        // No selection and no active page root — there's nowhere to drop it.
        // Previously this silently no-opped: the user clicked "insert" and
        // nothing happened, with no message.
        setPendingToast({
          message: "Open a page first to add this component.",
          variant: "warning",
        });
        return;
      }
      try {
        await composer.components.instantiateComponent(componentId, parentId);
        setPendingToast({ message: "Component added to canvas", variant: "success" });
      } catch {
        setPendingToast({ message: "Couldn't add component. Try again.", variant: "error" });
      }
    },
    [composer]
  );

  // Delete a component — opens ConfirmDialog instead of native confirm()
  const handleDelete = React.useCallback(
    (componentId: string) => {
      if (!composer) return;
      const component = composer.components.getComponent(componentId);
      if (component) {
        setConfirmDelete({ id: componentId, name: component.name });
      }
    },
    [composer]
  );

  // Actual delete after confirmation
  // Returns the success toast (board 4418:142651, with Undo) for the caller to show.
  const confirmDeleteAction = React.useCallback(async (): Promise<ToastInput | null> => {
    if (!composer || !confirmDelete) return null;
    let toast: ToastInput | null = null;
    try {
      toast = await deleteComponentWithUndo(composer, confirmDelete.id);
      setSelectedId(null);
    } catch {
      setPendingToast({ message: "Couldn't delete component.", variant: "error" });
    }
    setConfirmDelete(null);
    return toast;
  }, [composer, confirmDelete, setSelectedId]);

  // Duplicate a component — real deep-clone via the engine (was a fake
  // "here's how to do it manually" info modal while the detail screen used
  // the real API).
  const handleDuplicate = React.useCallback(
    async (componentId: string) => {
      if (!composer) return;
      try {
        await composer.components.duplicateComponent(componentId);
        setPendingToast({ message: "Component duplicated", variant: "success" });
      } catch {
        setPendingToast({ message: "Couldn't duplicate component.", variant: "error" });
      }
    },
    [composer]
  );

  // Detail view navigation
  const handleViewDetail = React.useCallback(
    (component: ComponentDefinition) => {
      setDetailComponent(component);
      setSelectedId(component.id);
    },
    [setSelectedId]
  );

  // "Edit master ›" from an instance (openMasterRequest.ts): a request made
  // before this panel mounted is taken here; a mounted panel hears the event.
  React.useEffect(() => {
    if (!composer?.components) return;
    const open = (componentId: string | undefined) => {
      takePendingMaster(composer);
      const c = componentId ? composer.components?.getComponent(componentId) : undefined;
      if (c) {
        setDetailComponent(c);
        setSelectedId(c.id);
      }
    };
    open(takePendingMaster(composer));
    const onEvent = ({ componentId }: { componentId: string }) => open(componentId);
    composer.on(EVENTS.UI_COMPONENTS_OPEN_MASTER, onEvent);
    return () => {
      composer.off(EVENTS.UI_COMPONENTS_OPEN_MASTER, onEvent);
    };
  }, [composer, setSelectedId]);

  const handleBackFromDetail = React.useCallback(() => {
    setDetailComponent(null);
  }, []);

  const handleDetailInsert = React.useCallback(() => {
    // Optionally navigate back after insert
  }, []);

  const handleDetailDelete = React.useCallback(() => {
    setDetailComponent(null);
  }, []);

  // Derived state
  const canCreateComponent = canvasSelection.length > 0;
  const isAtComponentLimit = components.length >= MAX_COMPONENTS;
  const isStandaloneMode = onClose !== undefined || onExpandToggle !== undefined;

  // No fallback: PanelHeader hides the help affordance when the handler is
  // undefined, which is what we want. The old fallback opened docs.aquibra.com —
  // a domain from a project this was forked from, which does not resolve.
  const handleHelpClickFn = onHelpClick;

  return {
    // Components
    components,
    // v3 FC-10: ComponentsTab reads its "which masters are library-linked"
    // list from here instead of fetching it a second time in the same tree.
    library,
    // Selection
    selectedId,
    setSelectedId,
    // Detail view
    detailComponent,
    setDetailComponent,
    // Canvas selection
    canvasSelection,
    canCreateComponent,
    // Handlers
    handleDragStart,
    handleInstantiate,
    handleDelete,
    handleDuplicate,
    handleViewDetail,
    handleBackFromDetail,
    handleDetailInsert,
    handleDetailDelete,
    // Dialog state (replaces native dialogs)
    confirmDelete,
    setConfirmDelete,
    confirmDeleteAction,
    pendingToast,
    setPendingToast,
    // Loading & Error
    isLoaded,
    error,
    setError,
    // Limits
    isAtComponentLimit,
    maxComponents: MAX_COMPONENTS,
    // Standalone
    isStandaloneMode,
    handleHelpClick: handleHelpClickFn,
  };

}
