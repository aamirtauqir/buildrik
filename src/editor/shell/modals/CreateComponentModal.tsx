/**
 * CreateComponentModal - Modal for creating reusable components
 * Allows users to save selected elements as reusable components
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { useToast } from "../../../shared/ui/Toast";

export interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
  elementId: string | null;
}

// GAP-FIX: Default variant property presets
const VARIANT_PRESETS = [
  { name: "Size", values: ["S", "M", "L"], defaultValue: "M" },
  { name: "State", values: ["Default", "Hover", "Disabled"], defaultValue: "Default" },
  { name: "Theme", values: ["Light", "Dark"], defaultValue: "Light" },
];

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  isOpen,
  onClose,
  composer,
  elementId,
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const { addToast } = useToast();

  // GAP-FIX: Variant options state
  const [isVariantSet, setIsVariantSet] = React.useState(false);
  const [selectedVariantProps, setSelectedVariantProps] = React.useState<string[]>([]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setCategory("");
      setTags("");
      setIsVariantSet(false);
      setSelectedVariantProps([]);
    }
  }, [isOpen]);

  // GAP-FIX: Toggle variant property selection
  const toggleVariantProp = (propName: string) => {
    setSelectedVariantProps((prev) =>
      prev.includes(propName) ? prev.filter((p) => p !== propName) : [...prev, propName]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      addToast({ message: "Component name is required", variant: "error" });
      return;
    }

    if (!composer || !elementId) {
      addToast({ message: "Invalid state", variant: "error" });
      return;
    }

    setIsCreating(true);
    try {
      // GAP-FIX: Build variant properties if variant set is enabled
      const variantProperties =
        isVariantSet && selectedVariantProps.length > 0
          ? VARIANT_PRESETS.filter((preset) => selectedVariantProps.includes(preset.name)).map(
              (preset) => ({
                name: preset.name,
                values: preset.values,
                defaultValue: preset.defaultValue,
              })
            )
          : undefined;

      const component = await composer.components.createComponent(name.trim(), elementId, {
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()) : undefined,
        // GAP-FIX: Include variant properties if defined
        variantProperties,
      });

      if (component) {
        addToast({
          message: `Component "${name}" created successfully!`,
          variant: "success",
        });
        onClose();
      } else {
        addToast({ message: "Failed to create component", variant: "error" });
      }
    } catch (error) {
      addToast({
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Component"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create Component"}
          </Button>
        </>
      }
    >
      <div style={containerStyles} onKeyDown={handleKeyPress}>
        <div>
          <label style={labelStyles}>
            Name <span style={{ color: "var(--aqb-accent)" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Hero Section"
            style={inputStyles}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyles}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            style={textareaStyles}
          />
        </div>

        <div>
          <label style={labelStyles}>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Headers, Footers, Cards"
            style={inputStyles}
          />
        </div>

        <div>
          <label style={labelStyles}>Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., responsive, dark-mode (comma-separated)"
            style={inputStyles}
          />
          <small style={hintStyles}>Comma-separated tags for easier searching</small>
        </div>

        {/* GAP-FIX: Variant Options Section */}
        <div style={variantSectionStyles}>
          <label style={labelStyles}>Variant Options</label>
          <label style={checkboxLabelStyles}>
            <input
              type="checkbox"
              checked={isVariantSet}
              onChange={(e) => setIsVariantSet(e.target.checked)}
              style={checkboxStyles}
            />
            <span>This is a variant set (has multiple variants)</span>
          </label>

          {isVariantSet && (
            <div style={variantPropsContainerStyles}>
              <small style={hintStyles}>Select variant properties:</small>
              <div style={variantChipsStyles}>
                {VARIANT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => toggleVariantProp(preset.name)}
                    style={{
                      ...variantChipStyles,
                      background: selectedVariantProps.includes(preset.name)
                        ? "var(--aqb-primary)"
                        : "var(--aqb-surface-3)",
                      color: selectedVariantProps.includes(preset.name)
                        ? "#fff"
                        : "var(--aqb-text-secondary)",
                    }}
                  >
                    {preset.name}
                    <span style={variantChipValuesStyles}>({preset.values.join(", ")})</span>
                  </button>
                ))}
              </div>
              <small style={hintStyles}>You can configure variant values after creation</small>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const labelStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
  marginBottom: 6,
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 13,
};

const textareaStyles: React.CSSProperties = {
  ...inputStyles,
  resize: "vertical" as const,
  minHeight: 60,
};

const hintStyles: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-muted)",
  marginTop: 4,
  display: "block",
};

// GAP-FIX: Variant section styles
const variantSectionStyles: React.CSSProperties = {
  marginTop: 8,
  paddingTop: 16,
  borderTop: "1px solid var(--aqb-border)",
};

const checkboxLabelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "var(--aqb-text-secondary)",
  cursor: "pointer",
};

const checkboxStyles: React.CSSProperties = {
  width: 16,
  height: 16,
  cursor: "pointer",
};

const variantPropsContainerStyles: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "var(--aqb-surface-2)",
  borderRadius: 8,
};

const variantChipsStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

const variantChipStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  border: "1px solid var(--aqb-border)",
  borderRadius: 16,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const variantChipValuesStyles: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  marginLeft: 2,
};

export default CreateComponentModal;
