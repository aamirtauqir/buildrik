/**
 * CreateComponentModal - Modal for creating reusable components
 * Allows users to save selected elements as reusable components
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, useToast, Button, Checkbox, Textarea, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";

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

  // Spec §6.3 / D7: "Pre-fill from DS styles" toggle, default ON.
  const [prefillFromDs, setPrefillFromDs] = React.useState(true);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setCategory("");
      setTags("");
      setIsVariantSet(false);
      setSelectedVariantProps([]);
      setPrefillFromDs(true);
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
      addToast({ description: "Component name is required", tone: "error" });
      return;
    }

    if (!composer || !elementId) {
      addToast({ description: "Invalid state", tone: "error" });
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
        // Spec §6.3 / D7: persist user's "Pre-fill from DS styles" choice.
        prefillFromDs,
      });

      if (component) {
        addToast({
          description: `Component "${name}" created successfully!`,
          tone: "success",
        });
        onClose();
      } else {
        addToast({ description: "Failed to create component", tone: "error" });
      }
    } catch (error) {
      addToast({
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        tone: "error",
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
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Create Component</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <div className="bd-modal__body">
    <div className="tw:flex tw:flex-col tw:gap-4" onKeyDown={handleKeyPress}>
      <div>
        <label style={labelStyles}>
          Name <span style={{ color: "var(--bk-accent)" }}>*</span>
        </label>
        <TextInput
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
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
          style={textareaStyles}
        />
      </div>

      <div>
        <label style={labelStyles}>Category</label>
        <TextInput
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Headers, Footers, Cards"
          style={inputStyles}
        />
      </div>

      <div>
        <label style={labelStyles}>Tags</label>
        <TextInput
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
          <Checkbox
            color="blue"
            className="tw:bg-white"
            checked={isVariantSet}
            onChange={(e) => setIsVariantSet(e.target.checked)}
            style={checkboxStyles} />
          <span>This is a variant set (has multiple variants)</span>
        </label>

        {isVariantSet && (
          <div style={variantPropsContainerStyles}>
            <small style={hintStyles}>Select variant properties:</small>
            <div style={variantChipsStyles}>
              {VARIANT_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  onClick={() => toggleVariantProp(preset.name)}
                  style={{
                    ...variantChipStyles,
                    background: selectedVariantProps.includes(preset.name)
                      ? "var(--bk-accent)"
                      : "var(--bk-bg-subtle)",
                    color: selectedVariantProps.includes(preset.name)
                      ? "var(--bk-accent-on)"
                      : "var(--bk-ink-soft)",
                  }}
                >
                  {preset.name}
                  <span style={variantChipValuesStyles}>({preset.values.join(", ")})</span>
                </Button>
              ))}
            </div>
            <small style={hintStyles}>You can configure variant values after creation</small>
          </div>
        )}
      </div>

      {/* Spec §6.3 / D7: "Pre-fill from DS styles" toggle (default ON) */}
      <div style={variantSectionStyles}>
        <label style={checkboxLabelStyles}>
          <Checkbox
            color="blue"
            className="tw:bg-white"
            checked={prefillFromDs}
            onChange={(e) => setPrefillFromDs(e.target.checked)}
            style={checkboxStyles}
          />
          <span>Pre-fill from DS styles</span>
        </label>
        <small style={hintStyles}>
          Lift matching values into token / preset bindings on save. Recommended.
        </small>
      </div>
    </div>
        </div>
        <ModalFooter>
          <Button color="light" onClick={onClose} disabled={isCreating} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create Component"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const labelStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--bk-ink)",
  marginBottom: 6,
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  color: "var(--bk-ink)",
  fontSize: 13,
};

const textareaStyles: React.CSSProperties = {
  ...inputStyles,
  resize: "vertical" as const,
  minHeight: 60,
};

const hintStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  marginTop: 4,
  display: "block",
};

// GAP-FIX: Variant section styles
const variantSectionStyles: React.CSSProperties = {
  marginTop: 8,
  paddingTop: 16,
  borderTop: "1px solid var(--bk-border)",
};

const checkboxLabelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "var(--bk-ink-soft)",
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
  background: "var(--bk-bg-subtle)",
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
  border: "1px solid var(--bk-border)",
  borderRadius: 16,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const variantChipValuesStyles: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginLeft: 2,
};

export default CreateComponentModal;
