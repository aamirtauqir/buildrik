/**
 * CreateComponentModal - Modal for creating reusable components
 * Allows users to save selected elements as reusable components
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Checkbox, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, TextInput, Textarea, useToast } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";

export interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
  elementId: string | null;
  /**
   * Token bindings already extracted from the selection, when the caller has
   * them (`tokenBindingResolver.resolveForElements`). Only the hint changes:
   * the same checkbox can either promise "matching values" or name the number
   * it found, and the number is the honest version.
   */
  selectionContext?: {
    selectionIds: readonly string[];
    extractedBindings: Map<string, string>;
  };
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
  selectionContext,
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
  /* null = the caller did not extract bindings, so say nothing about a count. */
  const bindingCount = selectionContext ? selectionContext.extractedBindings.size : null;

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
      <ModalContent size="lg" data-testid="create-component-modal">
        <ModalTitle data-testid="create-component-title">Create Component</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <div className="tw:flex tw:flex-col tw:gap-4" onKeyDown={handleKeyPress}>
      <div>
        <label className={FIELD_LABEL} data-testid="create-component-name-label">
          Name <span className="tw:text-[var(--bk-accent-text)]">*</span>
        </label>
        <TextInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Hero Section"
          data-testid="create-component-name"
          autoFocus
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          data-testid="create-component-description"
          rows={3}
          className="tw:min-h-15 tw:resize-y tw:bg-white"
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Category</label>
        <TextInput
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Headers, Footers, Cards"
          data-testid="create-component-category"
        />
      </div>

      <div>
        <label className={FIELD_LABEL}>Tags</label>
        <TextInput
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., responsive, dark-mode (comma-separated)"
          data-testid="create-component-tags"
        />
        <small className={HINT} data-testid="create-component-tags-hint">
          Comma-separated tags for easier searching
        </small>
      </div>

      {/* GAP-FIX: Variant Options Section */}
      <div className={SUB_SECTION}>
        <label className={FIELD_LABEL} data-testid="create-component-variant-label">Variant Options</label>
        <label className={CHECK_LABEL} data-testid="create-component-variant-check-label">
          <Checkbox
            color="blue"
            className="tw:bg-white tw:size-4 tw:cursor-pointer"
            data-testid="create-component-variant-toggle"
            checked={isVariantSet}
            onChange={(e) => setIsVariantSet(e.target.checked)}
          />
          <span>This is a variant set (has multiple variants)</span>
        </label>

        {isVariantSet && (
          <div
            /* Board 1712:8412 fills this panel --flowbite/gray/50, not
               --bk-bg-subtle, and the difference is not cosmetic: its two
               hints are --bk-ink-muted (#6B7280), which lands at 4.39:1 on
               #F3F4F6 — under the 4.5 floor — and 4.66:1 on #F9FAFB. The
               conformance run flagged both lines; the board's own fill is the
               fix. */
            className="tw:mt-3 tw:p-3 tw:rounded-lg tw:bg-[var(--bk-gray-50)]"
            data-testid="create-component-variant-panel"
          >
            <small className={HINT} data-testid="create-component-variant-hint">
              Select variant properties:
            </small>
            <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-2">
              {VARIANT_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  data-testid={`create-component-variant-chip-${preset.name}`}
                  onClick={() => toggleVariantProp(preset.name)}
                  className={`${CHIP} ${
                    selectedVariantProps.includes(preset.name)
                      ? "tw:bg-[var(--bk-accent)] tw:text-white"
                      : "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-100)]"
                  }`}
                >
                  {preset.name}
                  {/* `tw:opacity-70` was here. --bk-ink-soft on --bk-bg-subtle is 6.4:1;
                      at 70% it folds to 3.4:1, under the 4.5 floor for 12px text —
                      measured once the contrast sweep was pointed at the real
                      dialog (it had been scoped to a subtree the portalled modal
                      is not in, so this read as a clean screen). No board draws
                      this chip's value list, so nothing is conformed away: the
                      smaller size already says it is secondary. */}
                  <span className="tw:ml-0.5 tw:text-xs">({preset.values.join(", ")})</span>
                </Button>
              ))}
            </div>
            <small className={HINT}>You can configure variant values after creation</small>
          </div>
        )}
      </div>

      {/* Spec §6.3 / D7: "Pre-fill from DS styles" toggle (default ON) */}
      <div className={SUB_SECTION}>
        <label className={CHECK_LABEL} data-testid="create-component-prefill-label">
          <Checkbox
            color="blue"
            className="tw:bg-white tw:size-4 tw:cursor-pointer"
            data-testid="create-component-prefill-toggle"
            checked={prefillFromDs}
            onChange={(e) => setPrefillFromDs(e.target.checked)}
          />
          <span>Pre-fill from DS styles</span>
        </label>
        <small className={HINT} data-testid="create-component-prefill-hint">
          {bindingCount === null
            ? "Lift matching values into token / preset bindings on save. Recommended."
            : bindingCount === 1
              ? "1 style will bind to your DS tokens. Editing tokens later updates this component too."
              : `${bindingCount} styles will bind to your DS tokens. Editing tokens later updates this component too.`}
        </small>
      </div>
    </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" data-testid="create-component-cancel" onClick={onClose} disabled={isCreating} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
            Cancel
          </Button>
          <Button data-testid="create-component-submit" onClick={handleSubmit} disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create component"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

const FIELD_LABEL = "tw:block tw:mb-1.5 tw:text-xs tw:font-semibold tw:text-[var(--bk-ink)]";
const HINT = "tw:block tw:mt-1 tw:text-xs tw:text-[var(--bk-ink-muted)]";
/** Section separated by a rule — variant options, DS prefill. */
const SUB_SECTION = "tw:mt-2 tw:pt-4 tw:border-t tw:border-[var(--bk-gray-200)]";
const CHECK_LABEL = "tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink-soft)] tw:cursor-pointer";
/* `tw:h-7` is load-bearing and must set HEIGHT, not padding. These are flowbite
   Buttons, whose own `tw:h-10` only loses to a utility setting the SAME
   property — the class list here had px/py and no height, so every variant chip
   shipped 40px tall against board 1712:8416's 28 (CLAUDE.md §Chrome, "a
   DIFFERENT property does not conflict and loses"). The modal footer's
   `[&_button]:h-7` does not reach these; they sit in the body. */
const CHIP = "tw:flex tw:h-7 tw:items-center tw:gap-1 tw:px-3 tw:py-1.5 tw:rounded-2xl tw:border tw:border-[var(--bk-gray-200)] tw:text-xs tw:font-medium";

export default CreateComponentModal;
