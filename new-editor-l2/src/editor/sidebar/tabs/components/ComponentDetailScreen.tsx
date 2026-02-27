/**
 * ComponentDetailScreen - Detail view for a component
 * Shows large preview, info, actions, and variants
 * Based on Components_Detail_Wireframe.svg
 * @license BSD-3-Clause
 */

import { Copy, Trash2, Unlink, RefreshCw } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../../engine";
import type { ComponentDefinition, VariantProperty } from "../../../../shared/types/components";
import { ConfirmDialog } from "../../../../shared/ui/Modal";
import { useToast } from "../../../../shared/ui/Toast";
import { DrillInHeader } from "../../shared/DrillInHeader";

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
  /** Callback to detach instance */
  onDetachInstance?: () => void;
  /** Callback to swap component */
  onSwapComponent?: () => void;
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
  onDetachInstance,
  onSwapComponent,
}) => {
  // DrillInHeader handles focus-on-mount automatically
  const { addToast } = useToast();

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

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
    if (!parentId) return;

    composer.beginTransaction("insert-component");
    try {
      await composer.components.instantiateComponent(component.id, parentId);
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
    addToast({ message: `"${component.name}" deleted`, variant: "warning", duration: 4000 });
    onDelete?.();
    onBack();
  };

  // Instance count for delete message
  const instanceCount = composer?.components?.getInstancesOfComponent?.(component.id)?.length ?? 0;

  // Handle detach instance
  const handleDetach = () => {
    onDetachInstance?.();
  };

  // Handle swap component
  const handleSwap = () => {
    onSwapComponent?.();
  };

  return (
    <div className="aqb-component-detail">
      {/* Header with breadcrumb */}
      <DrillInHeader
        title={component.name}
        parentName="Components"
        onBack={onBack}
        onClose={onClose}
      />

      {/* Scrollable content */}
      <div className="aqb-component-detail-content">
        {/* Large Preview */}
        <div className="aqb-component-detail-preview">
          {component.thumbnail ? (
            <img
              src={component.thumbnail}
              alt={component.name}
              className="aqb-component-detail-preview-img"
            />
          ) : (
            <div className="aqb-component-detail-preview-placeholder">
              <span>No Preview</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="aqb-component-detail-info">
          <div className="aqb-component-detail-info-row">
            <span className="aqb-component-detail-info-label">Type:</span>
            <span className="aqb-component-detail-info-value">{displayType}</span>
          </div>
          <div className="aqb-component-detail-info-row">
            <span className="aqb-component-detail-info-label">Tags:</span>
            <span className="aqb-component-detail-info-value">{displayTags}</span>
          </div>
          {component.description && (
            <div className="aqb-component-detail-info-row">
              <span className="aqb-component-detail-info-label">Description:</span>
              <span className="aqb-component-detail-info-value">{component.description}</span>
            </div>
          )}
        </div>

        {/* Primary Action */}
        <button className="aqb-component-detail-insert-btn" onClick={handleInsert}>
          Insert Component
        </button>

        {/* Secondary Actions */}
        <div className="aqb-component-detail-actions">
          <button
            className="aqb-component-detail-action-btn"
            onClick={handleDuplicate}
            title="Duplicate component"
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>
          <button
            className="aqb-component-detail-action-btn danger"
            onClick={handleDelete}
            title="Delete component"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

        {/* Instance Actions (shown when instance is selected on canvas) */}
        {isInstanceSelected && (
          <div className="aqb-component-detail-instance-actions">
            <h4 className="aqb-component-detail-section-title">Instance Actions</h4>
            <button
              className="aqb-component-detail-instance-btn"
              onClick={handleDetach}
              title="Detach this instance from the component"
            >
              <Unlink size={14} />
              <span>Detach instance</span>
            </button>
            <button
              className="aqb-component-detail-instance-btn"
              onClick={handleSwap}
              title="Swap with another component"
            >
              <RefreshCw size={14} />
              <span>Swap component</span>
            </button>
          </div>
        )}

        {/* Variants Section */}
        {component.variantProperties && component.variantProperties.length > 0 && (
          <div className="aqb-component-detail-variants">
            <h4 className="aqb-component-detail-section-title">Variants</h4>
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
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAction}
        title="Delete Component"
        message={
          instanceCount > 0
            ? `This component has ${instanceCount} instance(s). Deleting will detach all instances. Continue?`
            : `Are you sure you want to delete "${component.name}"?`
        }
        confirmText="Delete"
        variant="danger"
      />
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

const VariantPicker: React.FC<VariantPickerProps> = ({ property, selectedValue, onChange }) => {
  return (
    <div className="aqb-variant-picker">
      <span className="aqb-variant-picker-label">{property.name}:</span>
      <div className="aqb-variant-picker-pills">
        {property.values.map((value) => (
          <button
            key={value}
            className={`aqb-variant-pill ${selectedValue === value ? "active" : ""}`}
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ComponentDetailScreen;
