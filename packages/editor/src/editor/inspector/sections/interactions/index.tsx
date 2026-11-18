/**
 * Interactions Section
 * Unified panel for all interaction triggers (hover, click, scroll, etc.)
 * @license BSD-3-Clause
 */

import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import * as React from "react";
import { Section } from "@/editor/inspector/shared/controls";
import { AddInteractionPanel } from "./AddInteractionPanel";
import { InteractionItem } from "./InteractionItem";
import { animatedProperties, ElementAnimationRow, ElementAnimationEditor, type AnimationConflict } from "./ElementAnimationRow";
import { InteractionEditor } from "./InteractionEditor";
import { DEFAULT_ANIMATION_CONFIG, type AnimationPreset } from "@/engine/interactions/types";
import { DEFAULT_ANIMATION, type AnimationConfig } from "@/shared/types/animations";
import { type Interaction, type InteractionTrigger, type InteractionsSectionProps, ANIMATION_PRESETS, getTriggerInfo } from "./types";
import { Button, useToast } from "@/editor/chrome-ui";
import { LockRefusalNote, setLockRefusal, useLockRefusal } from "@/editor/inspector/components/LockRefusal";
import { closeSubview, openSubview } from "@/editor/inspector/tabs/subviewStore";
import { EVENTS } from "@/shared/constants/events";
import { NoteRow } from "../behaviourRows";
import { lockOwner } from "@/engine/commands/commandOperations";
// Re-export types for external use
export type { Interaction, InteractionTrigger, InteractionsSectionProps };

// Re-export sub-components for testing/extension
export { InteractionItem } from "./InteractionItem";
export { InteractionEditor } from "./InteractionEditor";
export { AddInteractionPanel } from "./AddInteractionPanel";

// ============================================================================
// COMPONENT
// ============================================================================

/** 2L9 A10: enabled interactions that animate a property the element's CSS
 *  animation also animates — named "{trigger} · {preset}". */
function animationConflicts(animation: AnimationConfig, interactions: readonly Interaction[]): AnimationConflict[] {
  const mine = animatedProperties(animation.type);
  const out: AnimationConflict[] = [];
  for (const i of interactions) {
    if (!i.enabled) continue;
    const shared = [...animatedProperties(i.animation.preset)].find((p) => mine.has(p));
    if (!shared) continue;
    const preset = ANIMATION_PRESETS.find((p) => p.value === i.animation.preset)?.label ?? i.animation.preset;
    out.push({ id: i.id, label: `${getTriggerInfo(i.trigger).label} · ${preset}`, property: shared });
  }
  return out;
}

export const InteractionsSection: React.FC<InteractionsSectionProps> = ({
  interactions: interactionsProp,
  onInteractionsChange,
  onPreview,
  onStopPreview,
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
  const target = composer && elementId ? composer.elements.getElement(elementId) : null;
  /* Several suites hand the section a partial element double. */
  const elementName =
    target && typeof target.getCustomData === "function" ? (getLayerName(target) ?? elementTypeLabel(target.getType())) : undefined;
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
  const addRefused = useLockRefusal(composer, elementId ?? "", "add-interaction");
  const animation = liveAnimation === undefined ? animationProp : liveAnimation;

  const addAnimation = () => {
    onAnimationChange?.({ ...DEFAULT_ANIMATION });
    setShowAddPanel(false);
    setAnimationOpen(true);
  };
  const [editingId, setEditingId] = React.useState<string | null>(null);
  /* 2L9 I15: an open interaction is the Behavior tab's whole body. */
  React.useEffect(() => {
    if (!elementId) return;
    if (editingId) openSubview({ kind: "interaction", elementId });
    else closeSubview("interaction");
  }, [editingId, elementId]);
  React.useEffect(() => () => closeSubview("interaction"), []);

  /* 2L9 I15 / I22: "Interaction added · Undo", "Interaction deleted · Undo"
     — the Undo is the one document history's, so it undoes exactly that
     write (the write is one history step, writeElement's transaction). */
  const { addToast } = useToast();
  const receipt = (description: string) =>
    addToast({ description, ...(composer ? { action: { label: "Undo", onClick: () => composer.history.undo() } } : {}) });
  // Add new interaction
  const addInteraction = (trigger: InteractionTrigger, preset?: AnimationPreset) => {
    /* 2L9 G22: locked after the picker opened — nothing is added, and the
       section says so (no "added" receipt, no editor for a missing row). */
    if (composer && elementId && lockOwner(composer.elements.getElement(elementId))) {
      setShowAddPanel(false);
      setLockRefusal({ elementId, kind: "add-interaction" });
      return;
    }
    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      trigger,
      /* The board's new interaction: 0.6 s, Ease out (2L9 I15). */
      animation: { ...DEFAULT_ANIMATION_CONFIG, duration: 600, easing: "power2.out", ...(preset ? { preset } : {}) },
      enabled: true,
    };

    onInteractionsChange([...interactions, newInteraction]);
    setShowAddPanel(false);
    setEditingId(newInteraction.id);
    receipt("Interaction added");
  };

  // Update interaction
  const updateInteraction = (id: string, updates: Partial<Interaction>) => {
    onInteractionsChange(interactions.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Remove interaction
  const removeInteraction = (id: string) => {
    onInteractionsChange(interactions.filter((i) => i.id !== id));
    if (editingId === id) setEditingId(null);
    receipt("Interaction deleted");
  };

  // Duplicate an interaction just after itself, and open the copy (I20)
  const duplicateInteraction = (id: string) => {
    const at = interactions.findIndex((i) => i.id === id);
    if (at < 0) return;
    const copy: Interaction = { ...interactions[at], id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    onInteractionsChange([...interactions.slice(0, at + 1), copy, ...interactions.slice(at + 1)]);
    setEditingId(copy.id);
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
  /* "Enable interaction" names one interaction: shown when exactly one is off. */
  const off = interactions.filter((i) => !i.enabled);
  const disabledOnly = off.length === 1 ? off[0] : null;
  const editingAnimation = animationOpen && animation && onAnimationChange ? animation : null;
  const back = (label: string, onBack: () => void) => (
    <Button
      type="button"
      color="alternative"
      size="xs"
      data-testid="interactions-back"
      onClick={onBack}
      className="tw:self-center tw:h-7 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-transparent tw:hover:underline"
    >
      ‹ {label}
    </Button>
  );
  /* 2L9 161:15179: an interaction's screen goes "‹ Back to Interactions". */
  const backToList = "Back to Interactions";

  return (
    <Section
      title="Interactions"
      icon="MousePointer"
      defaultOpen={interactions.length > 0 || Boolean(animation)}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-interactions"
      hideHeader={showAddPanel && !editing && !editingAnimation}
    >
      <div className="tw:flex tw:flex-col">
        {editing ? (
          <>
            {back(backToList, () => setEditingId(null))}
            <InteractionEditor
              interaction={editing}
              onUpdate={updateInteraction}
              onRemove={removeInteraction}
              onToggleEnabled={toggleEnabled}
              onDuplicate={duplicateInteraction}
              onPreview={onPreview}
              onStopPreview={onStopPreview}
              elementName={elementName}
            />
          </>
        ) : editingAnimation && onAnimationChange ? (
          <>
            {back(backToList, () => setAnimationOpen(false))}
            <ElementAnimationEditor
              animation={editingAnimation}
              conflicts={animationConflicts(editingAnimation, interactions)}
              onInspect={(id) => {
                setAnimationOpen(false);
                setEditingId(id);
              }}
              onChange={(next) => {
                onAnimationChange(next);
                if (!next) setAnimationOpen(false);
              }}
              onPreview={onAnimationPreview}
            />
          </>
        ) : addRefused && elementId ? (
          /* 2L9 G22: the refusal is the section's whole body until unlocked. */
          <LockRefusalNote composer={composer} elementId={elementId} kind="add-interaction" />
        ) : showAddPanel ? (
          /* 2L9 I14: the add screen replaces the list. */
          <AddInteractionPanel
            onAdd={addInteraction}
            onClose={() => setShowAddPanel(false)}
            onAddAnimation={onAnimationChange && !animation ? addAnimation : undefined}
          />
        ) : (
          <>
            {/* 2L9 161:13919: interactions are the element's, not a breakpoint's. */}
            <NoteRow testId="interactions-all-breakpoints">Plays on all breakpoints</NoteRow>
            {animation && onAnimationChange ? (
              <ElementAnimationRow animation={animation} onOpen={() => setAnimationOpen(true)} />
            ) : null}
            {interactions.map((interaction) => (
              <InteractionItem key={interaction.id} interaction={interaction} onOpen={() => setEditingId(interaction.id)} />
            ))}
            {/* 2L9 161:13919: a full-width bordered button. */}
            <Button
              type="button"
              color="light"
              size="xs"
              data-testid="interactions-add"
              onClick={() => setShowAddPanel(true)}
              className="tw:my-1 tw:h-8 tw:w-full tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
            >
              + Add interaction
            </Button>
            {/* 2L9 165:18272: the one switched-off interaction offers its way back. */}
            {disabledOnly ? (
              <Button
                type="button"
                color="light"
                size="xs"
                data-testid="interactions-enable"
                onClick={() => toggleEnabled(disabledOnly.id)}
                className="tw:my-1 tw:h-8 tw:w-full tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
              >
                Enable interaction
              </Button>
            ) : null}
            {interactions.length === 0 && !animation ? <NoteRow testId="interactions-empty">No interactions yet.</NoteRow> : null}
          </>
        )}
      </div>
    </Section>
  );
};

export default InteractionsSection;
