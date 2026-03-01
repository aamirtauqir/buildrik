/**
 * Animation Section - CSS Animations with presets
 * AQUI-026: Basic Interactions/Animations
 *
 * @module components/Panels/ProInspector/sections/AnimationSection
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnimationConfig } from "../../../shared/types/animations";
import { DEFAULT_ANIMATION, generateAnimationCSS } from "../../../shared/types/animations";
import { AnimationEditor } from "../../animation/AnimationEditor";
import { Section } from "../shared/Controls";

// ============================================================================
// TYPES
// ============================================================================

interface AnimationSectionProps {
  /** Current animation config from element */
  animation?: AnimationConfig | null;
  /** Handler for animation changes */
  onAnimationChange: (animation: AnimationConfig | null) => void;
  /** Preview animation handler */
  onPreview?: () => void;
  /** Whether section is open by default */
  isOpen?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AnimationSection: React.FC<AnimationSectionProps> = ({
  animation,
  onAnimationChange,
  onPreview,
  isOpen,
}) => {
  const [localAnimation, setLocalAnimation] = React.useState<AnimationConfig>(
    animation || DEFAULT_ANIMATION
  );
  const [enabled, setEnabled] = React.useState(!!animation);

  // Sync with external animation prop
  React.useEffect(() => {
    if (animation) {
      setLocalAnimation(animation);
      setEnabled(true);
    } else {
      setEnabled(false);
    }
  }, [animation]);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    if (newEnabled) {
      onAnimationChange(localAnimation);
    } else {
      onAnimationChange(null);
    }
  };

  const handleChange = (config: AnimationConfig) => {
    setLocalAnimation(config);
    if (enabled) {
      onAnimationChange(config);
    }
  };

  const handlePreview = () => {
    onPreview?.();
  };

  // Show animation type name as preview when enabled
  const animPreview =
    enabled && localAnimation.type ? (
      <span
        style={{
          fontSize: 9,
          color: "var(--aqb-text-tertiary)",
          fontFamily: "var(--aqb-font-mono)",
        }}
      >
        {localAnimation.type}
      </span>
    ) : undefined;

  return (
    <Section
      title="Animation"
      icon="Zap"
      defaultOpen={isOpen}
      preview={animPreview}
      id="inspector-section-animation"
    >
      {/* Enable/Disable Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: "10px 12px",
          background: enabled ? "rgba(0, 115, 230, 0.1)" : "rgba(255, 255, 255, 0.03)",
          borderRadius: 8,
          border: enabled
            ? "1px solid rgba(0, 115, 230, 0.2)"
            : "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: enabled ? "#0073E6" : "#71717a",
            fontWeight: 500,
          }}
        >
          {enabled ? "Animation Enabled" : "No Animation"}
        </span>
        <button
          onClick={handleToggle}
          style={{
            padding: "6px 12px",
            background: enabled ? "rgba(0, 115, 230, 0.2)" : "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: 6,
            color: enabled ? "#0073E6" : "#a1a1aa",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>

      {/* Animation Editor */}
      {enabled && (
        <>
          <AnimationEditor
            animation={localAnimation}
            onChange={handleChange}
            onPreview={handlePreview}
          />

          {/* Generated CSS Preview */}
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: 8,
              fontFamily: "var(--aqb-font-mono, 'Fira Code', monospace)",
              fontSize: 10,
              color: "#71717a",
              wordBreak: "break-all",
            }}
          >
            <div style={{ color: "#0073E6", marginBottom: 4 }}>Generated CSS:</div>
            <code>animation: {generateAnimationCSS(localAnimation)};</code>
          </div>
        </>
      )}

      {/* Quick Tips */}
      {!enabled && (
        <div
          style={{
            padding: 12,
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 8,
            fontSize: 11,
            color: "#f59e0b",
            lineHeight: 1.5,
          }}
        >
          <strong>Tip:</strong> Enable animation to add entrance, attention, or exit effects to this
          element.
        </div>
      )}
    </Section>
  );
};

export default AnimationSection;
