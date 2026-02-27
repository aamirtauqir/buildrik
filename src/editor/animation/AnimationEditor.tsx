/**
 * Aquibra Animation Editor
 * Visual animation configuration
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectField, NumberField, SliderField } from "../../shared/forms";
import type { AnimationConfig, AnimationTrigger } from "../../shared/types/animations";
import { DEFAULT_ANIMATION } from "../../shared/types/animations";
import { Button, Tabs } from "../../shared/ui";

// Re-export for backwards compatibility
export type { AnimationConfig } from "../../shared/types/animations";

export interface AnimationEditorProps {
  animation?: AnimationConfig;
  onChange: (animation: AnimationConfig) => void;
  onPreview?: () => void;
}

const animations = {
  entrance: [
    { value: "fadeIn", label: "Fade In" },
    { value: "fadeInUp", label: "Fade In Up" },
    { value: "fadeInDown", label: "Fade In Down" },
    { value: "fadeInLeft", label: "Fade In Left" },
    { value: "fadeInRight", label: "Fade In Right" },
    { value: "zoomIn", label: "Zoom In" },
    { value: "bounceIn", label: "Bounce In" },
    { value: "slideInUp", label: "Slide In Up" },
    { value: "slideInDown", label: "Slide In Down" },
    { value: "flipInX", label: "Flip In X" },
    { value: "flipInY", label: "Flip In Y" },
    { value: "rotateIn", label: "Rotate In" },
  ],
  attention: [
    { value: "pulse", label: "Pulse" },
    { value: "bounce", label: "Bounce" },
    { value: "shake", label: "Shake" },
    { value: "swing", label: "Swing" },
    { value: "wobble", label: "Wobble" },
    { value: "flash", label: "Flash" },
    { value: "heartBeat", label: "Heart Beat" },
    { value: "rubberBand", label: "Rubber Band" },
  ],
  exit: [
    { value: "fadeOut", label: "Fade Out" },
    { value: "fadeOutUp", label: "Fade Out Up" },
    { value: "fadeOutDown", label: "Fade Out Down" },
    { value: "zoomOut", label: "Zoom Out" },
    { value: "slideOutUp", label: "Slide Out Up" },
  ],
};

const easings = [
  { value: "linear", label: "Linear" },
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
  { value: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", label: "Bounce" },
  { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", label: "Elastic" },
];

const defaultAnimation: AnimationConfig = DEFAULT_ANIMATION;

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  animation = defaultAnimation,
  onChange,
  onPreview,
}) => {
  const [activeTab, setActiveTab] = React.useState("entrance");

  const updateAnimation = (updates: Partial<AnimationConfig>) => {
    onChange({ ...animation, ...updates });
  };

  // Animation groups available for future advanced UI
  // const allAnimations = [
  //   ...animations.entrance.map((a) => ({ ...a, group: "Entrance" })),
  //   ...animations.attention.map((a) => ({ ...a, group: "Attention" })),
  //   ...animations.exit.map((a) => ({ ...a, group: "Exit" })),
  // ];

  return (
    <div className="aqb-animation-editor" style={{ padding: 12 }}>
      {/* Animation Type */}
      <Tabs
        tabs={[
          { id: "entrance", label: "Entrance" },
          { id: "attention", label: "Attention" },
          { id: "exit", label: "Exit" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        size="sm"
      />

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {animations[activeTab as keyof typeof animations]?.map((anim) => (
            <button
              key={anim.value}
              onClick={() => updateAnimation({ type: anim.value })}
              style={{
                padding: "12px 8px",
                background:
                  animation.type === anim.value
                    ? "var(--aqb-primary)"
                    : "var(--aqb-bg-panel-secondary)",
                border: "none",
                borderRadius: 8,
                color: animation.type === anim.value ? "#fff" : "var(--aqb-text-secondary)",
                fontSize: 11,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {anim.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--aqb-text-muted)",
            marginBottom: 12,
          }}
        >
          Timing
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SliderField
            label="Duration"
            value={animation.duration}
            onChange={(v) => updateAnimation({ duration: v })}
            min={100}
            max={3000}
            step={100}
          />

          <SliderField
            label="Delay"
            value={animation.delay}
            onChange={(v) => updateAnimation({ delay: v })}
            min={0}
            max={2000}
            step={100}
          />

          <SelectField
            label="Easing"
            value={animation.easing}
            onChange={(v) => updateAnimation({ easing: v })}
            options={easings}
          />

          <NumberField
            label="Iterations"
            value={animation.iterations}
            onChange={(v) => updateAnimation({ iterations: v })}
            min={1}
            max={10}
            unit=""
            units={[]}
          />
        </div>
      </div>

      {/* Trigger */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--aqb-text-muted)",
            marginBottom: 12,
          }}
        >
          Trigger
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["load", "scroll", "hover", "click"].map((trigger) => (
            <button
              key={trigger}
              onClick={() => updateAnimation({ trigger: trigger as AnimationTrigger })}
              style={{
                flex: 1,
                padding: "10px 8px",
                background:
                  animation.trigger === trigger
                    ? "var(--aqb-primary)"
                    : "var(--aqb-bg-panel-secondary)",
                border: "none",
                borderRadius: 6,
                color: animation.trigger === trigger ? "#fff" : "var(--aqb-text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {trigger}
            </button>
          ))}
        </div>

        {animation.trigger === "scroll" && (
          <div style={{ marginTop: 12 }}>
            <SliderField
              label="Scroll Offset"
              value={animation.scrollOffset || 100}
              onChange={(v) => updateAnimation({ scrollOffset: v })}
              min={0}
              max={500}
              step={10}
            />
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ marginTop: 24 }}>
        <Button onClick={onPreview} fullWidth variant="secondary">
          ▶️ Preview Animation
        </Button>
      </div>

      {/* Generated CSS */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            padding: 12,
            background: "var(--aqb-bg-dark)",
            borderRadius: 8,
            fontFamily: "var(--aqb-font-mono)",
            fontSize: 11,
            color: "var(--aqb-text-muted)",
          }}
        >
          animation: {animation.type} {animation.duration}ms {animation.easing} {animation.delay}ms{" "}
          {animation.iterations === -1 ? "infinite" : animation.iterations};
        </div>
      </div>
    </div>
  );
};

export default AnimationEditor;
