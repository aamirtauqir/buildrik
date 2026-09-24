/**
 * Interactions Section
 * Unified panel for all interaction triggers (hover, click, scroll, etc.)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../shared/controls";
import { AddInteractionPanel } from "./AddInteractionPanel";
import { InteractionItem } from "./InteractionItem";
import { DEFAULT_ANIMATION_CONFIG } from "../../../../engine/interactions/types";
import { type Interaction, type InteractionTrigger, type InteractionsSectionProps } from "./types";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
// Re-export types for external use
export type { Interaction, InteractionTrigger, InteractionsSectionProps };

// Re-export sub-components for testing/extension
export { InteractionItem } from "./InteractionItem";
export { InteractionEditor } from "./InteractionEditor";
export { AddInteractionPanel } from "./AddInteractionPanel";

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InteractionsSection: React.FC<InteractionsSectionProps> = ({
  interactions: interactionsProp,
  onInteractionsChange,
  onPreview,
  isOpen,
  onToggle,
  tier = "tertiary",
  composer,
  elementId,
}) => {
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [live, setLive] = React.useState<Interaction[] | null>(null);
  React.useEffect(() => {
    setLive(null);
    if (!composer || !elementId) return;
    /* Re-read on any element update: cheap, and the payload is an Element
       (getId(), no id field), so it is not filtered on. */
    const sync = () => {
      const next = composer.elements.getElement(elementId)?.getInteractions?.();
      setLive(Array.isArray(next) ? (next as Interaction[]) : []);
    };
    composer.on(EVENTS.ELEMENT_UPDATED, sync);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, sync);
    };
  }, [composer, elementId]);
  const interactions = live ?? interactionsProp;
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Add new interaction
  const addInteraction = (trigger: InteractionTrigger) => {
    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      trigger,
      animation: { ...DEFAULT_ANIMATION_CONFIG },
      enabled: true,
    };

    onInteractionsChange([...interactions, newInteraction]);
    setShowAddPanel(false);
    setEditingId(newInteraction.id);
  };

  // Update interaction
  const updateInteraction = (id: string, updates: Partial<Interaction>) => {
    onInteractionsChange(interactions.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Remove interaction
  const removeInteraction = (id: string) => {
    onInteractionsChange(interactions.filter((i) => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Toggle interaction enabled state
  const toggleEnabled = (id: string) => {
    onInteractionsChange(
      interactions.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
    );
  };

  // Toggle editing state
  const handleToggleEdit = (id: string) => {
    setEditingId(editingId === id ? null : id);
  };

  return (
    <Section
      title="Interactions"
      icon="MousePointer"
      defaultOpen={interactions.length > 0}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-interactions"
    >
      <div style={styles.container}>
        {/* Existing Interactions */}
        {interactions.map((interaction) => (
          <InteractionItem
            key={interaction.id}
            interaction={interaction}
            isEditing={editingId === interaction.id}
            onToggleEdit={() => handleToggleEdit(interaction.id)}
            onUpdate={updateInteraction}
            onRemove={removeInteraction}
            onToggleEnabled={toggleEnabled}
            onPreview={onPreview}
          />
        ))}

        {!showAddPanel ? (
          <Button
            onClick={() => setShowAddPanel(true)}
            color="alternative"
            size="xs"
            className="tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline"
          >
            + Add interaction
          </Button>
        ) : (
          <AddInteractionPanel onAdd={addInteraction} onClose={() => setShowAddPanel(false)} />
        )}
      </div>
    </Section>
  );
};

export default InteractionsSection;
