/**
 * Interaction Editor Component
 * Editor panel for configuring a single interaction's animation settings
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectField } from "../../../../shared/forms";
import type { AnimationPreset } from "../../../../engine/interactions/types";
import { type Interaction, ANIMATION_PRESETS, EASING_OPTIONS } from "./types";
import { Button, TextInput } from "@/editor/chrome-ui";
// ============================================================================
// TYPES
// ============================================================================

export interface InteractionEditorProps {
  interaction: Interaction;
  onUpdate: (id: string, updates: Partial<Interaction>) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onPreview?: (interaction: Interaction) => void;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: 12,
    borderTop: `1px solid ${"var(--bk-border)"}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    display: "block",
    fontSize: 12,
    color: "var(--bk-ink-muted)",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    background: "var(--bk-bg-card)",
    border: `1px solid ${"var(--bk-border-medium)"}`,
    borderRadius: 6,
    color: "var(--bk-ink)",
    fontSize: 13,
  } as React.CSSProperties,
  buttonRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  buttonRowSecondary: {
    display: "flex",
    gap: 8,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Seconds in the field, milliseconds stored (P-11c). While focused the field
 * holds a draft: a keystroke writes only a finite value already in range, so
 * "0.5" can pass through "0" without being clamped to Duration's 0.1. Blur
 * settles the draft — an out-of-range number is clamped and written, an empty
 * or non-numeric one restores the stored value. NaN and negatives never reach
 * the interaction.
 */
const TimingInput: React.FC<{
  storedMs: number;
  min: number;
  max: number;
  onCommit: (ms: number) => void;
}> = ({ storedMs, min, max, onCommit }) => {
  const [draft, setDraft] = React.useState<string | null>(null);

  const handleChange = (raw: string) => {
    setDraft(raw);
    const seconds = parseFloat(raw);
    if (Number.isFinite(seconds) && seconds >= min && seconds <= max) onCommit(Math.round(seconds * 1000));
  };

  const handleBlur = () => {
    if (draft === null) return;
    setDraft(null);
    const seconds = parseFloat(draft);
    if (!Number.isFinite(seconds)) return;
    const ms = Math.round(Math.min(max, Math.max(min, seconds)) * 1000);
    if (ms !== storedMs) onCommit(ms);
  };

  return (
    <TextInput
      type="number"
      value={draft ?? storedMs / 1000}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={0.1}
      style={styles.input}
    />
  );
};

export const InteractionEditor: React.FC<InteractionEditorProps> = ({
  interaction,
  onUpdate,
  onRemove,
  onToggleEnabled,
  onPreview,
}) => {
  const writeTiming = (key: "duration" | "delay", ms: number) => {
    onUpdate(interaction.id, { animation: { ...interaction.animation, [key]: ms } });
  };

  const handleAnimationTypeChange = (value: string) => {
    onUpdate(interaction.id, {
      animation: { ...interaction.animation, preset: value as AnimationPreset },
    });
  };

  const handleEasingChange = (value: string) => {
    onUpdate(interaction.id, {
      animation: { ...interaction.animation, easing: value },
    });
  };

  return (
    <div style={styles.container}>
      <SelectField
        label="Animation"
        value={interaction.animation.preset}
        onChange={handleAnimationTypeChange}
        options={ANIMATION_PRESETS}
      />
      <div style={styles.inputRow}>
        <div style={styles.inputWrapper}>
          <label style={styles.label}>Duration</label>
          <TimingInput
            storedMs={interaction.animation.duration}
            min={0.1}
            max={10}
            onCommit={(ms) => writeTiming("duration", ms)}
          />
        </div>
        <div style={styles.inputWrapper}>
          <label style={styles.label}>Delay</label>
          <TimingInput
            storedMs={interaction.animation.delay}
            min={0}
            max={5}
            onCommit={(ms) => writeTiming("delay", ms)}
          />
        </div>
      </div>
      <SelectField
        label="Easing"
        value={interaction.animation.easing}
        onChange={handleEasingChange}
        options={EASING_OPTIONS}
      />
      <div style={styles.buttonRow}>
        <Button
          onClick={() => onPreview?.(interaction)}
          color="light"
          size="xs"
          style={{ flex: 1 }}
        >
          Preview
        </Button>
        {/* Timeline button removed 2026-05-18 — its onOpenTimeline handler
         * was a console.warn("not yet implemented") stub. No timeline view
         * exists in the editor. See memory project_animation_audit_20260518.md. */}
      </div>
      <div style={styles.buttonRowSecondary}>
        <Button
          onClick={() => onToggleEnabled(interaction.id)}
          color="light"
          size="xs"
          style={{ flex: 1 }}
        >
          {interaction.enabled ? "Disable" : "Enable"}
        </Button>
        <Button
          onClick={() => onRemove(interaction.id)}
          color="red"
          size="xs"
          style={{ flex: 1 }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default InteractionEditor;
