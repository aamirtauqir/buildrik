/**
 * ComponentDetailScreen - Detail view for a component
 * Shows large preview, info, actions, and variants
 * Based on Components_Detail_Wireframe.svg
 * @license BSD-3-Clause
 */

import { Copy, Trash2, Unlink, RefreshCw } from "lucide-react";
import * as React from "react";
import { ConfirmDialog, useToast, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { ComponentDefinition, VariantProperty } from "../../../../shared/types/components";
import { useDSModeOptional } from "@/editor/design-system/state/DSModeContext";
import { DrillInHeader } from "../../shared/DrillInHeader";
import { DetachConfirmModal } from "./DetachConfirmModal";
// ============================================
// Types
// ============================================

export interface ComponentDetailScreenProps {
  /** The component to display */
  component: ComponentDefinition;
  /** Composer instance */
  composer: Composer | null;
  /** Navigate back to browse view */
  onBack: () => void;
  /** Close the panel */
  onClose?: () => void;
  /** Callback when component is inserted */
  onInsert?: () => void;
  /** Callback when component is duplicated */
  onDuplicate?: () => void;
  /** Callback when component is deleted */
  onDelete?: () => void;
  /** Whether an instance of this component is selected on canvas */
  isInstanceSelected?: boolean;
  /** The element currently selected on canvas — what "Update component" promotes. */
  selectedElementId?: string | null;
  /** Callback to detach instance */
  onDetachInstance?: () => void;
  /** Callback to swap component */
}

// ============================================
// Component
// ============================================

export const ComponentDetailScreen: React.FC<ComponentDetailScreenProps> = ({
  component,
  composer,
  onBack,
  onClose,
  onInsert,
  onDuplicate,
  onDelete,
  isInstanceSelected = false,
  selectedElementId = null,
  onDetachInstance,
}) => {
  // DrillInHeader handles focus-on-mount automatically
  const { addToast } = useToast();

  // Spec H: "Detach (Pro mode only)" — Detach UI hidden in beginner mode.
  // Hook is optional (null-safe) because ComponentDetailScreen may render
  // outside a DSModeProvider in some screens (e.g. component-library
  // standalone). Default-to-beginner when provider is absent.
  const dsMode = useDSModeOptional();
  /* The DS density mode, not a billing tier — see the Instance Actions note. */
  const isProMode = dsMode?.mode === "pro";

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // "Update component" confirmation — the change is destructive to instance
  // overrides, so it is never one click.
  const [showUpdateConfirm, setShowUpdateConfirm] = React.useState(false);

  // Detach confirmation modal state — populated with derived label/master/count
  // computed from the currently-selected canvas instance at click time.
  const [pendingDetach, setPendingDetach] = React.useState<{
    instanceLabel: string;
    masterName: string;
    masterInstanceCount: number;
  } | null>(null);

  // State for variant selection (for preview)
  const [selectedVariantValues, setSelectedVariantValues] = React.useState<Record<string, string>>(
    () => {
      // Initialize with default values
      const defaults: Record<string, string> = {};
      component.variantProperties?.forEach((prop) => {
        defaults[prop.name] = prop.defaultValue;
      });
      return defaults;
    }
  );

  // Get display type from category or default
  const displayType = component.category || "UI component";

  // Format tags for display
  const displayTags = component.tags?.join(" \u2022 ") || "No tags";

  // Handle variant value change
  const handleVariantChange = (propertyName: string, value: string) => {
    setSelectedVariantValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  // Handle insert action
  const handleInsert = async () => {
    if (!composer) return;

    // Get parent element - selected element or active page root
    const selectedIds = composer.selection?.getSelectedIds() || [];
    let parentId = selectedIds[0];
    if (!parentId) {
      const activePage = composer.elements.getActivePage();
      if (activePage?.root) parentId = activePage.root.id;
    }
    if (!parentId) {
      /* The row action on the list says this; the detail screen's own Insert
         button returned in silence — same click, same nothing, no message. */
      addToast({
        description: "Open a page first to add this component.",
        tone: "warning",
        duration: 4000,
      });
      return;
    }

    composer.beginTransaction("insert-component");
    try {
      const id = await composer.components.instantiateComponent(component.id, parentId);
      if (!id) {
        addToast({
          description: `Couldn't add "${component.name}" here.`,
          tone: "error",
          duration: 4000,
        });
        return;
      }
      onInsert?.();
    } finally {
      composer.endTransaction();
    }
  };

  // Handle duplicate action
  const handleDuplicate = async () => {
    if (!composer) return;

    const duplicate = await composer.components.duplicateComponent(component.id);
    if (duplicate) {
      onDuplicate?.();
    }
  };

  /**
   * Promote the canvas selection to this component's master.
   *
   * This is the door onto `updateComponentMaster` — the engine half has been
   * built and tested for months with no caller, so "change it once and every
   * instance follows", the reason components exist, could not be reached from
   * the product at all.
   */
  const confirmUpdateAction = async () => {
    setShowUpdateConfirm(false);
    if (!composer || !selectedElementId) return;

    const { updated, instancesSynced, overridesDropped } =
      await composer.components.updateComponentMaster(component.id, selectedElementId);

    if (!updated) {
      addToast({
        description: `Couldn't update "${component.name}" from that selection.`,
        tone: "error",
        duration: 4000,
      });
      return;
    }

    const followed =
      instancesSynced > 0
        ? `${instancesSynced} instance${instancesSynced === 1 ? "" : "s"} followed`
        : "no instances placed yet";

    // Overrides whose target the new master no longer has cannot be re-applied.
    // They are gone; the engine used to report that only to devError, which is
    // a no-op in production, so the user watched their edits revert in silence.
    if (overridesDropped > 0) {
      addToast({
        description: `"${component.name}" updated — ${followed}. ${overridesDropped} override${
          overridesDropped === 1 ? "" : "s"
        } couldn't be re-applied and ${overridesDropped === 1 ? "was" : "were"} lost.`,
        tone: "warning",
        duration: 8000,
      });
      return;
    }

    addToast({
      description: `"${component.name}" updated — ${followed}.`,
      tone: "success",
      duration: 4000,
    });
  };

  // Handle delete action — opens ConfirmDialog
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Actual delete after confirmation
  const confirmDeleteAction = async () => {
    if (!composer) return;
    await composer.components.deleteComponent(component.id);
    setShowDeleteConfirm(false);
    // TODO: Add soft-delete + undo when backend supports it
    addToast({ description: `"${component.name}" deleted`, tone: "warning", duration: 4000 });
    onDelete?.();
    onBack();
  };

  // Instance count for delete message
  const instanceCount = composer?.components?.getInstancesOfComponent?.(component.id)?.length ?? 0;

  // Handle detach instance — open confirmation modal first with derived
  // label/master/count. The actual detach is fired in confirmDetach below.
  const handleDetach = () => {
    if (!composer) {
      onDetachInstance?.();
      return;
    }
    const selectedIds = composer.selection?.getSelectedIds() || [];
    const currentSelectedId = selectedIds[0];
    if (!currentSelectedId) {
      onDetachInstance?.();
      return;
    }
    const allInstances =
      composer.components?.getInstancesOfComponent?.(component.id) ?? [];
    const index = allInstances.findIndex((i) => i.elementId === currentSelectedId);
    const instanceLabel = index >= 0 ? `#${index + 1}` : "selected";
    setPendingDetach({
      instanceLabel,
      masterName: component.name,
      masterInstanceCount: allInstances.length || 1,
    });
  };

  const confirmDetach = () => {
    setPendingDetach(null);
    onDetachInstance?.();
  };

  return (
    <div>
      {/* Header with breadcrumb */}
      <DrillInHeader
        title={component.name}
        parentName="Components"
        onBack={onBack}
      />
      {/* Scrollable content */}
      <div>
        {/* Large Preview */}
        <div>
          {component.thumbnail ? (
            <img
              src={component.thumbnail}
              alt={component.name}
             
            />
          ) : (
            <div>
              <span>No Preview</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div>
          <div>
            <span>Type:</span>
            <span>{displayType}</span>
          </div>
          <div>
            <span>Tags:</span>
            <span>{displayTags}</span>
          </div>
          {component.description && (
            <div>
              <span>Description:</span>
              <span>{component.description}</span>
            </div>
          )}
        </div>

        {/* Primary Action */}
        <Button onClick={handleInsert}>
          Insert Component
        </Button>

        {/* Secondary Actions */}
        <div>
          <Button
           
            onClick={handleDuplicate}
            title="Duplicate component"
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </Button>
          <Button
            onClick={() => setShowUpdateConfirm(true)}
            disabled={!selectedElementId}
            title={
              selectedElementId
                ? "Replace this component with the element selected on canvas"
                : "Select an element on the canvas to update this component from"
            }
          >
            <RefreshCw size={14} />
            <span>Update</span>
          </Button>
          <Button
            className="danger"
            onClick={handleDelete}
            title="Delete component"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </Button>
        </div>

        {/* Instance Actions (shown when an instance is selected on canvas).
            Detach shows in the design system's PRO MODE — the Beginner/Pro
            density toggle a user flips freely (`DSModeContext`), not the
            billing plan. This comment said "Pro-only", which reads like a paid
            gate; nothing here checks a plan. The "Swap component" action was
            removed — it had no completion path (no engine swap API), so it
            only toasted and never swapped. */}
        {isInstanceSelected && isProMode && (
          <div>
            <h4>Instance Actions</h4>
            <Button
              onClick={handleDetach}
              title="Detach this instance from the component"
            >
              <Unlink size={14} />
              <span>Detach instance</span>
            </Button>
          </div>
        )}

        {/* Variants Section */}
        {component.variantProperties && component.variantProperties.length > 0 && (
          <div>
            <h4>Variants</h4>
            {component.variantProperties.map((prop) => (
              <VariantPicker
                key={prop.name}
                property={prop}
                selectedValue={selectedVariantValues[prop.name] || prop.defaultValue}
                onChange={(value) => handleVariantChange(prop.name, value)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAction}
        title="Delete Component"
        message={
          instanceCount > 0
            ? `This component has ${instanceCount} instance(s). Deleting will detach all instances. Continue?`
            : `Are you sure you want to delete "${component.name}"?`
        }
        confirmLabel="Delete"
        tone="destructive"
      />
      {/* Update-from-selection confirmation. It names the cost: instances change,
          and overrides pointing at elements the new master drops are lost. */}
      <ConfirmDialog
        open={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={confirmUpdateAction}
        title="Update component"
        message={
          instanceCount > 0
            ? `Replace "${component.name}" with the element selected on the canvas? ${instanceCount} instance(s) will change to match. Any edits made on an instance are kept where they still fit, and lost where the new version no longer has that part.`
            : `Replace "${component.name}" with the element selected on the canvas?`
        }
        confirmLabel="Update component"
        tone="destructive"
      />
      {/* Detach confirmation modal (Task 13) */}
      {pendingDetach && (
        <DetachConfirmModal
          instanceLabel={pendingDetach.instanceLabel}
          masterName={pendingDetach.masterName}
          masterInstanceCount={pendingDetach.masterInstanceCount}
          onCancel={() => setPendingDetach(null)}
          onConfirm={confirmDetach}
        />
      )}
    </div>
  );
};

// ============================================
// Variant Picker Sub-component
// ============================================

interface VariantPickerProps {
  property: VariantProperty;
  selectedValue: string;
  onChange: (value: string) => void;
}

/*
  Variant chips. These had no rule at all, so they rendered as full flowbite
  Buttons — h-10, centred, medium weight — in a row that wants chips, and
  `.active` marked nothing. Fixed as `tw:` utilities rather than a CSS rule:
  chrome-ui/__tests__/className-precedence.test.tsx is the contract that a
  caller's utilities both survive the merge and evict flowbite's conflicting
  ones. Shape matches ElementsTab's filter pills at 22px instead of 24px.
*/
const VARIANT_PILL =
  "tw:inline-flex tw:items-center tw:h-[22px] tw:px-[var(--bk-space-8)] " +
  "tw:rounded-full tw:border tw:border-[var(--bk-border)] tw:bg-transparent " +
  "tw:text-[var(--bk-ink-soft)] tw:text-[12px] tw:font-normal " +
  "tw:[font-family:var(--bk-font-ui)] tw:cursor-pointer " +
  "tw:enabled:hover:text-[var(--bk-ink)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

const VARIANT_PILL_ACTIVE =
  "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent)] " +
  "tw:text-[var(--bk-accent-on)] tw:font-medium";

const VariantPicker: React.FC<VariantPickerProps> = ({ property, selectedValue, onChange }) => {
  return (
    <div>
      <span>{property.name}:</span>
      <div>
        {property.values.map((value) => (
          <Button
            key={value}
            className={`${VARIANT_PILL} ${selectedValue === value ? VARIANT_PILL_ACTIVE : ""}`}
            onClick={() => onChange(value)}
          >
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ComponentDetailScreen;
