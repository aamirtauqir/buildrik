/**
 * Interactions Section
 * Unified panel for all interaction triggers (hover, click, scroll, etc.)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { DEFAULT_ANIMATION } from "../../../../shared/types/animations";
import { Button } from "../../../../shared/ui";
import { Section } from "../../shared/Controls";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { AddInteractionPanel } from "./AddInteractionPanel";
import { InteractionItem } from "./InteractionItem";
import { type Interaction, type InteractionTrigger, type InteractionsSectionProps } from "./types";

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
    gap: 12,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "16px 12px",
    color: INSPECTOR_TOKENS.textMuted,
    fontSize: 12,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InteractionsSection: React.FC<InteractionsSectionProps> = ({
  interactions,
  onInteractionsChange,
  onPreview,
  onOpenTimeline,
}) => {
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Add new interaction
  const addInteraction = (trigger: InteractionTrigger) => {
    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      trigger,
      animation: {
        ...DEFAULT_ANIMATION,
        trigger: trigger === "hover" ? "hover" : trigger === "click" ? "click" : "scroll",
      },
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
    <Section title="Interactions" icon="MousePointer" defaultOpen={interactions.length > 0}>
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
            onOpenTimeline={onOpenTimeline}
          />
        ))}

        {/* Add Interaction Button / Panel */}
        {!showAddPanel ? (
          <Button onClick={() => setShowAddPanel(true)} variant="secondary" size="sm" fullWidth>
            + Add Interaction
          </Button>
        ) : (
          <AddInteractionPanel onAdd={addInteraction} onClose={() => setShowAddPanel(false)} />
        )}

        {/* Empty State */}
        {interactions.length === 0 && !showAddPanel && (
          <div style={styles.emptyState}>
            No interactions yet. Add one to bring your element to life.
          </div>
        )}
      </div>
    </Section>
  );
};

export default InteractionsSection;
