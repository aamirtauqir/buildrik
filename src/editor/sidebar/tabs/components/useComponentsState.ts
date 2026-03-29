/**
 * useComponentsState - State management hook for ComponentsTab
 * Extracts all state, effects, and callbacks from the main component
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { type ComponentFilter, FAVORITES_STORAGE_KEY } from "../componentsData";

const MAX_COMPONENTS = 100;

// Dialog state types (replace native alert/confirm/prompt)
export interface DeleteConfirmState {
  id: string;
  name: string;
}
export interface RenameDialogState {
  id: string;
  currentName: string;
}
export interface DuplicateInfoState {
  name: string;
  copyName: string;
}
export interface PendingToastState {
  message: string;
  variant: "info" | "warning" | "error";
}
export interface VariantPickerState {
  id: string;
  componentName: string;
  variants: Array<{ id: string; name: string }>;
  currentVariantId: string | null;
  instanceElementId: string;
}

interface UseComponentsStateParams {
  composer: Composer | null;
  externalSearchQuery?: string;
  selectedComponentId?: string | null;
  onComponentSelect?: (component: ComponentDefinition | null) => void;
  onClose?: () => void;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
}

export function useComponentsState({
  composer,
  externalSearchQuery,
  selectedComponentId,
  onComponentSelect,
  onClose,
  onPinToggle,
  onHelpClick,
}: UseComponentsStateParams) {
  // Internal search state for standalone mode
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("");
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const [components, setComponents] = React.useState<ComponentDefinition[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  // Filter and favorites state
  const [activeFilter, setActiveFilter] = React.useState<ComponentFilter>("all");
  const [favorites, setFavorites] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const [canvasSelection, setCanvasSelection] = React.useState<string[]>([]);

  // Dialog state (replaces native alert/confirm/prompt)
  const [confirmDelete, setConfirmDelete] = React.useState<DeleteConfirmState | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<RenameDialogState | null>(null);
  const [variantPicker, setVariantPicker] = React.useState<VariantPickerState | null>(null);
  const [duplicateInfo, setDuplicateInfo] = React.useState<DuplicateInfoState | null>(null);
  const [pendingToast, setPendingToast] = React.useState<PendingToastState | null>(null);

  // Persist favorites
  React.useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

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

  // Toggle favorite
  const toggleFavorite = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const isFavorite = React.useCallback((id: string) => favorites.includes(id), [favorites]);

  // Toggle group collapse
  const toggleGroup = React.useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }, []);

  // Load components and subscribe to updates
  React.useEffect(() => {
    if (!composer?.components) return;

    const loadComponents = () => {
      try {
        const allComponents = composer.components?.getAllComponents() ?? [];
        setComponents(allComponents);
        setIsLoaded(true);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load components");
      }
    };

    loadComponents();

    const handleUpdate = () => loadComponents();
    composer.on(EVENTS.COMPONENT_LIST_UPDATED, handleUpdate);

    return () => {
      composer.off(EVENTS.COMPONENT_LIST_UPDATED, handleUpdate);
    };
  }, [composer]);

  // Filter components by search and active filter
  const filteredComponents = React.useMemo(() => {
    let result = [...components];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.category?.toLowerCase().includes(query) ||
          c.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    switch (activeFilter) {
      case "ui":
        result = result.filter(
          (c) =>
            c.category?.toLowerCase() === "ui" ||
            c.tags?.some((t) =>
              ["button", "input", "form", "card", "badge"].includes(t.toLowerCase())
            )
        );
        break;
      case "sections":
        result = result.filter(
          (c) =>
            c.category?.toLowerCase() === "sections" ||
            c.tags?.some((t) =>
              ["hero", "navbar", "footer", "cta", "features"].includes(t.toLowerCase())
            )
        );
        break;
      case "saved":
        result = result.filter((c) => c.category !== "Presets" && c.category !== "Team");
        break;
      case "favorites":
        result = result.filter((c) => favorites.includes(c.id));
        break;
      case "all":
      default:
        break;
    }

    return result;
  }, [components, searchQuery, activeFilter, favorites]);

  // Group by category
  const groupedComponents = React.useMemo(() => {
    const groups: Record<string, ComponentDefinition[]> = {};
    filteredComponents.forEach((c) => {
      const category = c.category || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(c);
    });
    return groups;
  }, [filteredComponents]);

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
      if (parentId) {
        await composer.components.instantiateComponent(componentId, parentId);
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
        setOpenMenuId(null);
      }
    },
    [composer]
  );

  // Actual delete after confirmation
  const confirmDeleteAction = React.useCallback(async () => {
    if (!composer || !confirmDelete) return;
    await composer.components.deleteComponent(confirmDelete.id);
    setSelectedId(null);
    setConfirmDelete(null);
  }, [composer, confirmDelete, setSelectedId]);

  // Duplicate a component — shows info modal instead of native alert()
  const handleDuplicate = React.useCallback(
    (componentId: string) => {
      if (!composer) return;
      const component = composer.components?.getComponent(componentId);
      if (!component) return;

      setDuplicateInfo({
        name: component.name,
        copyName: `${component.name} Copy`,
      });
      setOpenMenuId(null);
    },
    [composer]
  );

  // Rename a component — opens Modal instead of native prompt()
  const handleRename = React.useCallback(
    (componentId: string) => {
      if (!composer) return;
      const component = composer.components?.getComponent(componentId);
      if (!component) return;

      setRenameTarget({ id: componentId, currentName: component.name });
      setOpenMenuId(null);
    },
    [composer]
  );

  // Actual rename after modal submission
  const confirmRename = React.useCallback(
    async (newName: string) => {
      if (!composer || !renameTarget) return;
      if (newName.trim() && newName !== renameTarget.currentName) {
        await composer.components.updateComponent(renameTarget.id, { name: newName.trim() });
      }
      setRenameTarget(null);
    },
    [composer, renameTarget]
  );

  // Swap variant — opens Modal instead of native prompt/alert
  const handleSwapVariant = React.useCallback(
    (componentId: string) => {
      if (!composer) return;
      const component = composer.components?.getComponent(componentId);
      if (!component?.variants?.length) {
        setPendingToast({ message: "This component has no variants defined.", variant: "warning" });
        setOpenMenuId(null);
        return;
      }

      const currentSelectedId = canvasSelection[0];
      if (!currentSelectedId) {
        setPendingToast({
          message: "Select a component instance on the canvas first.",
          variant: "warning",
        });
        setOpenMenuId(null);
        return;
      }

      const instance = composer.components?.getInstanceByElementId(currentSelectedId);
      if (!instance || instance.componentId !== componentId) {
        setPendingToast({
          message: "Select an instance of this component on the canvas first.",
          variant: "warning",
        });
        setOpenMenuId(null);
        return;
      }

      setVariantPicker({
        id: componentId,
        componentName: component.name,
        variants: component.variants.map((v) => ({ id: v.id, name: v.name })),
        currentVariantId: instance.variantSelection?.variantId ?? null,
        instanceElementId: instance.elementId,
      });
      setOpenMenuId(null);
    },
    [composer, canvasSelection]
  );

  // Actual variant swap after picker selection
  const confirmVariant = React.useCallback(
    (variantId: string) => {
      if (!composer || !variantPicker) return;
      composer.components?.updateInstanceVariant?.(variantPicker.instanceElementId, variantId);
      setVariantPicker(null);
    },
    [composer, variantPicker]
  );

  // Check if component has variants
  const hasVariants = React.useCallback(
    (componentId: string): boolean => {
      const component = composer?.components?.getComponent(componentId);
      return Boolean(component?.variants?.length);
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

  const handleBackFromDetail = React.useCallback(() => {
    setDetailComponent(null);
  }, []);

  const handleDetailInsert = React.useCallback(() => {
    // Optionally navigate back after insert
  }, []);

  const handleDetailDelete = React.useCallback(() => {
    setDetailComponent(null);
  }, []);

  // Check if selected canvas element is an instance of the detail component
  const isDetailInstanceSelected = React.useMemo(() => {
    if (!detailComponent || !composer || canvasSelection.length === 0) return false;
    const currentSelectedId = canvasSelection[0];
    const instance = composer.components?.getInstanceByElementId(currentSelectedId);
    return instance?.componentId === detailComponent.id;
  }, [detailComponent, composer, canvasSelection]);

  // Detach instance action
  const handleDetachInstance = React.useCallback(() => {
    if (!composer || canvasSelection.length === 0) return;
    const currentSelectedId = canvasSelection[0];
    composer.components?.detachInstance?.(currentSelectedId);
  }, [composer, canvasSelection]);

  // Swap component action — toast instead of native alert()
  const handleSwapComponent = React.useCallback(() => {
    if (!composer || canvasSelection.length === 0) return;
    setPendingToast({
      message: "Select another component from the list to swap with this instance.",
      variant: "info",
    });
    setDetailComponent(null);
  }, [composer, canvasSelection]);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  // Derived state
  const canCreateComponent = canvasSelection.length > 0;
  const isAtComponentLimit = components.length >= MAX_COMPONENTS;
  const isStandaloneMode = onClose !== undefined || onPinToggle !== undefined;

  const handleHelpClickFn = React.useCallback(() => {
    onHelpClick?.() ?? window.open("https://docs.aquibra.com/components", "_blank");
  }, [onHelpClick]);

  return {
    // Search
    internalSearchQuery,
    setInternalSearchQuery,
    searchQuery,
    // Components
    components,
    filteredComponents,
    groupedComponents,
    // Selection
    selectedId,
    setSelectedId,
    // Detail view
    detailComponent,
    setDetailComponent,
    // Filters
    activeFilter,
    setActiveFilter,
    // Favorites
    favorites,
    toggleFavorite,
    isFavorite,
    // Groups
    collapsedGroups,
    toggleGroup,
    // Menu
    openMenuId,
    setOpenMenuId,
    // Canvas selection
    canvasSelection,
    canCreateComponent,
    // Handlers
    handleDragStart,
    handleInstantiate,
    handleDelete,
    handleDuplicate,
    handleRename,
    handleSwapVariant,
    hasVariants,
    handleViewDetail,
    handleBackFromDetail,
    handleDetailInsert,
    handleDetailDelete,
    isDetailInstanceSelected,
    handleDetachInstance,
    handleSwapComponent,
    // Dialog state (replaces native dialogs)
    confirmDelete,
    setConfirmDelete,
    confirmDeleteAction,
    renameTarget,
    setRenameTarget,
    confirmRename,
    variantPicker,
    setVariantPicker,
    confirmVariant,
    duplicateInfo,
    setDuplicateInfo,
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
