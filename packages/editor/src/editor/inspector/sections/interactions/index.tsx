/**
 * Interactions Section
 * Unified panel for all interaction triggers (hover, click, scroll, etc.)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../shared/controls";
import { AddInteractionPanel } from "./AddInteractionPanel";
import { InteractionItem } from "./InteractionItem";
import { ElementAnimationRow, ElementAnimationEditor, animationTriggerLabel } from "./ElementAnimationRow";
import { InteractionEditor } from "./InteractionEditor";
import { getTriggerInfo } from "./types";
import { DEFAULT_ANIMATION_CONFIG } from "../../../../engine/interactions/types";
import { DEFAULT_ANIMATION, type AnimationConfig } from "@/shared/types/animations";
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
  animation: animationProp,
  onAnimationChange,
  onAnimationPreview,
}) => {
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [live, setLive] = React.useState<Interaction[] | null>(null);
  const [liveAnimation, setLiveAnimation] = React.useState<AnimationConfig | null | undefined>(undefined);
  /* The animation's edit screen is open (drill-in, like an interaction's). */
  const [animationOpen, setAnimationOpen] = React.useState(false);
  React.useEffect(() => {
    setLive(null);
    setLiveAnimation(undefined);
    setAnimationOpen(false);
    if (!composer || !elementId) return;
    /* Re-read on any element update: cheap, and the payload is an Element
       (getId(), no id field), so it is not filtered on. */
    const sync = () => {
      const el = composer.elements.getElement(elementId);
      const next = el?.getInteractions?.();
      setLive(Array.isArray(next) ? (next as Interaction[]) : []);
      if (el?.getAnimation) setLiveAnimation(el.getAnimation() ?? null);
    };
    composer.on(EVENTS.ELEMENT_UPDATED, sync);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, sync);
    };
  }, [composer, elementId]);
  const interactions = live ?? interactionsProp;
  const animation = liveAnimation === undefined ? animationProp : liveAnimation;

  const addAnimation = () => {
    onAnimationChange?.({ ...DEFAULT_ANIMATION });
    setShowAddPanel(false);
    setAnimationOpen(true);
  };
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

  /* Boards 4428:142686 / 4418:109686: the list is flat rows; opening one
     drills into its edit screen ("‹ On hover" back row + its controls), and
     back returns to the list. The editor used to expand inline under the row
     and push the rest of the tab below the fold. */
  const editing = interactions.find((i) => i.id === editingId) ?? null;
  const editingAnimation = animationOpen && animation && onAnimationChange ? animation : null;
  const back = (label: string, onBack: () => void) => (
    <Button
      type="button"
      color="alternative"
      size="xs"
      data-testid="interactions-back"
      onClick={onBack}
      className="tw:self-start tw:h-7 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-accent-text)] tw:hover:bg-transparent tw:hover:underline"
    >
      ‹ {label}
    </Button>
  );

  return (
    <Section
      title="Interactions"
      icon="MousePointer"
      defaultOpen={interactions.length > 0 || Boolean(animation)}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-interactions"
    >
      <div style={styles.container}>
        {editing ? (
          <>
            {back(getTriggerInfo(editing.trigger).label, () => setEditingId(null))}
            <InteractionEditor
              interaction={editing}
              onUpdate={updateInteraction}
              onRemove={removeInteraction}
              onToggleEnabled={toggleEnabled}
              onPreview={onPreview}
            />
          </>
        ) : editingAnimation && onAnimationChange ? (
          <>
            {back(animationTriggerLabel(editingAnimation), () => setAnimationOpen(false))}
            <ElementAnimationEditor
              animation={editingAnimation}
              onChange={(next) => {
                onAnimationChange(next);
                if (!next) setAnimationOpen(false);
              }}
              onPreview={onAnimationPreview}
            />
          </>
        ) : (
          <>
            {animation && onAnimationChange ? (
              <ElementAnimationRow animation={animation} onOpen={() => setAnimationOpen(true)} />
            ) : null}
            {interactions.map((interaction) => (
              <InteractionItem key={interaction.id} interaction={interaction} onOpen={() => setEditingId(interaction.id)} />
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
              <AddInteractionPanel
                onAdd={addInteraction}
                onClose={() => setShowAddPanel(false)}
                onAddAnimation={onAnimationChange && !animation ? addAnimation : undefined}
              />
            )}
          </>
        )}
      </div>
    </Section>
  );
};

export default InteractionsSection;
