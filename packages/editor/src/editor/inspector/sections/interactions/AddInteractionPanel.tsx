/**
 * Add Interaction Panel Component
 * Panel for selecting and adding new interaction triggers
 * @license BSD-3-Clause
 */

import * as React from "react";
import { type InteractionTrigger, TRIGGER_GROUPS } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface AddInteractionPanelProps {
  onAdd: (trigger: InteractionTrigger) => void;
  onClose: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GROUP_LABELS: Record<string, string> = {
  element: "Element Triggers",
  page: "Page Triggers",
  scroll: "Scroll Triggers",
  mouse: "Mouse Triggers",
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    background: "var(--buildrick-bg-input)",
    borderRadius: 8,
    padding: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--buildrick-text-primary)",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "var(--buildrick-text-muted)",
    cursor: "pointer",
    fontSize: 16,
  } as React.CSSProperties,
  groupContainer: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    color: "var(--buildrick-text-muted)",
    marginBottom: 6,
  },
  triggerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 6,
  },
  triggerButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    background: "var(--buildrick-bg-subtle)",
    border: "none",
    borderRadius: 6,
    color: "var(--buildrick-text-secondary)",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s ease",
  } as React.CSSProperties,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TriggerGroupProps {
  groupName: string;
  triggers: Array<{ value: string; label: string; icon: string }>;
  onAdd: (trigger: InteractionTrigger) => void;
}

const TriggerGroup: React.FC<TriggerGroupProps> = ({ groupName, triggers, onAdd }) => (
  <div style={styles.groupContainer}>
    <div style={styles.groupLabel}>{GROUP_LABELS[groupName] || groupName}</div>
    <div style={styles.triggerGrid}>
      {triggers.map((trigger) => (
        <button
          key={trigger.value}
          onClick={() => onAdd(trigger.value as InteractionTrigger)}
          style={styles.triggerButton}
        >
          <span>{trigger.icon}</span>
          <span>{trigger.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const AddInteractionPanel: React.FC<AddInteractionPanelProps> = ({ onAdd, onClose }) => (
  <div style={styles.container}>
    <div style={styles.header}>
      <span style={styles.title}>Choose Trigger</span>
      <button onClick={onClose} style={styles.closeButton}>
        &#215;
      </button>
    </div>

    {Object.entries(TRIGGER_GROUPS).map(([groupName, triggers]) => (
      <TriggerGroup key={groupName} groupName={groupName} triggers={triggers} onAdd={onAdd} />
    ))}
  </div>
);

export default AddInteractionPanel;
