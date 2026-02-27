/**
 * Interaction Editor Component
 * Editor panel for configuring a single interaction's animation settings
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectField } from "../../../../shared/forms";
import { Button } from "../../../../shared/ui";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { type Interaction, ANIMATION_PRESETS, EASING_OPTIONS } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface InteractionEditorProps {
  interaction: Interaction;
  onUpdate: (id: string, updates: Partial<Interaction>) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onPreview?: (interaction: Interaction) => void;
  onOpenTimeline?: (interaction: Interaction) => void;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: 12,
    borderTop: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
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
    fontSize: 11,
    color: INSPECTOR_TOKENS.textMuted,
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    background: INSPECTOR_TOKENS.surfaceInput,
    border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderRadius: 6,
    color: INSPECTOR_TOKENS.textPrimary,
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

export const InteractionEditor: React.FC<InteractionEditorProps> = ({
  interaction,
  onUpdate,
  onRemove,
  onToggleEnabled,
  onPreview,
  onOpenTimeline,
}) => {
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(interaction.id, {
      animation: {
        ...interaction.animation,
        duration: parseFloat(e.target.value) * 1000,
      },
    });
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(interaction.id, {
      animation: {
        ...interaction.animation,
        delay: parseFloat(e.target.value) * 1000,
      },
    });
  };

  const handleAnimationTypeChange = (value: string) => {
    onUpdate(interaction.id, {
      animation: { ...interaction.animation, type: value },
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
        value={interaction.animation.type}
        onChange={handleAnimationTypeChange}
        options={ANIMATION_PRESETS}
      />

      <div style={styles.inputRow}>
        <div style={styles.inputWrapper}>
          <label style={styles.label}>Duration</label>
          <input
            type="number"
            value={interaction.animation.duration / 1000}
            onChange={handleDurationChange}
            min={0.1}
            max={10}
            step={0.1}
            style={styles.input}
          />
        </div>
        <div style={styles.inputWrapper}>
          <label style={styles.label}>Delay</label>
          <input
            type="number"
            value={interaction.animation.delay / 1000}
            onChange={handleDelayChange}
            min={0}
            max={5}
            step={0.1}
            style={styles.input}
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
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
        >
          Preview
        </Button>
        <Button
          onClick={() => onOpenTimeline?.(interaction)}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
        >
          Timeline
        </Button>
      </div>

      <div style={styles.buttonRowSecondary}>
        <Button
          onClick={() => onToggleEnabled(interaction.id)}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
        >
          {interaction.enabled ? "Disable" : "Enable"}
        </Button>
        <Button
          onClick={() => onRemove(interaction.id)}
          variant="danger"
          size="sm"
          style={{ flex: 1 }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default InteractionEditor;
