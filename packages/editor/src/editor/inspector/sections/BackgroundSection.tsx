/**
 * Background Section - Color, Image, Gradient
 */

import * as React from "react";
import { Button, Input } from "@/editor/ui";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { extractGradientUI, composeGradient, deriveBgType } from "../../../shared/utils/parsers/gradientHelpers";
import { Section, ColorInput, SelectRow, InputRow, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";

export interface BackgroundSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Opens media library for asset selection */
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  /** Whether advanced settings (size/position/repeat/attachment for image bg) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  styles,
  onChange,
  onOpenMediaLibrary,
  isOpen,
  onToggle,
  tier = "primary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
  isMultiSelect,
}) => {
  const [bgType, setBgType] = React.useState<"color" | "gradient" | "image">(() => deriveBgType(styles));

  React.useEffect(() => {
    setBgType(deriveBgType(styles));
  }, [styles.background, styles["background-image"]]);

  const gradientUI = bgType === "gradient" ? extractGradientUI(styles.background || styles["background-image"] || "") : null;

  // Compute color preview from styles — mock shows a small swatch chip as the
  // collapsed-state indicator for Background.
  const bgColor = styles["background-color"] || styles["background"];
  const preview = bgColor ? (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 3,
        background: bgColor,
        border: "1px solid var(--bk-border-medium)",
        flexShrink: 0,
      }}
      title={bgColor}
    />
  ) : undefined;

  // "+" action in header — opens media library for image bg (falls through if
  // handler not wired). Matches mock's "+ add background layer" affordance.
  const addAction = onOpenMediaLibrary ? (
    <Button
      type="button"
      className="bdi-plus"
      onClick={(e) => {
        e.stopPropagation();
        onOpenMediaLibrary(["image"], (asset) => {
          onChange("background-image", `url(${asset.src})`);
        });
      }}
      aria-label="Add background image"
      title="Add background image"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14 M5 12h14" />
      </svg>
    </Button>
  ) : undefined;

  return (
    <Section
      title="Colors"
      icon="Palette"
      preview={preview}
      action={addAction}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-background"
    >
      {/* Background Type Selector — segmented */}
      <div className="bdi-seg" style={{ marginBottom: 6 }}>
        {(["color", "gradient", "image"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            onClick={() => setBgType(type)}
            className={bgType === type ? "on" : ""}
            style={{ textTransform: "capitalize" }}
            aria-pressed={bgType === type}
          >
            {type}
          </Button>
        ))}
      </div>
      {/* Color Background */}
      {bgType === "color" && (
        <div style={{ position: "relative" }}>
          <MixedValueIndicator prop="background-color" mixedKeys={mixedKeys} />
          <ColorInput
            label="Color"
            value={styles["background-color"] || ""}
            onChange={(v) => onChange("background-color", v)}
          />
        </div>
      )}
      {/* Gradient Background */}
      {bgType === "gradient" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 12,
                color: "var(--bk-ink-muted)",
                fontWeight: 500,
                display: "block",
                marginBottom: 8,
              }}
            >
              Gradient Type
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                onClick={() => {
                  const color1 = "var(--bk-accent)";
                  const color2 = "var(--bk-success)";
                  onChange("background", `linear-gradient(90deg, ${color1}, ${color2})`);
                }}
                style={{
                  flex: 1,
                  padding: "20px 12px",
                  background: "linear-gradient(90deg, var(--bk-accent), var(--bk-success))",
                  border: "1px solid var(--bk-border-medium)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--bk-accent-on)",
                }}
              >
                Linear
              </Button>
              <Button
                onClick={() => {
                  const color1 = "var(--bk-accent)";
                  const color2 = "var(--bk-success)";
                  onChange("background", `radial-gradient(circle, ${color1}, ${color2})`);
                }}
                style={{
                  flex: 1,
                  padding: "20px 12px",
                  background: "radial-gradient(circle, var(--bk-accent), var(--bk-success))",
                  border: "1px solid var(--bk-border-medium)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--bk-accent-on)",
                }}
              >
                Radial
              </Button>
            </div>
          </div>

          {/* Gradient Colors */}
          <ColorInput
            label="Color 1"
            value={gradientUI?.color1 || "var(--bk-accent)"}
            onChange={(v) => {
              const result = composeGradient({
                type: (gradientUI?.gradientType || "linear") as "linear" | "radial",
                angle: gradientUI?.angle ?? 90,
                color1: v,
                color2: gradientUI?.color2 || "var(--bk-success)",
              });
              onChange("background", result);
            }}
          />
          <ColorInput
            label="Color 2"
            value={gradientUI?.color2 || "#22c55e"}
            onChange={(v) => {
              const result = composeGradient({
                type: (gradientUI?.gradientType || "linear") as "linear" | "radial",
                angle: gradientUI?.angle ?? 90,
                color1: gradientUI?.color1 || "var(--bk-accent)",
                color2: v,
              });
              onChange("background", result);
            }}
          />

          {/* Gradient Angle (for linear) */}
          {(gradientUI?.gradientType !== "radial") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  color: "var(--bk-ink-muted)",
                  fontWeight: 500,
                  minWidth: 70,
                }}
              >
                Angle
              </label>
              <Input
                type="range"
                min="0"
                max="360"
                value={gradientUI?.angle ?? 90}
                onChange={(e) => {
                  const result = composeGradient({
                    type: "linear",
                    angle: Number(e.target.value),
                    color1: gradientUI?.color1 || "var(--bk-accent)",
                    color2: gradientUI?.color2 || "var(--bk-success)",
                  });
                  onChange("background", result);
                }}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: "var(--bk-ink-muted)", minWidth: 40 }}>{gradientUI?.angle ?? 90}°</span>
            </div>
          )}
        </>
      )}
      {/* Image Background */}
      {bgType === "image" && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <MixedValueIndicator prop="background-image" mixedKeys={mixedKeys} />
              <InputRow
                label="Image URL"
                value={styles["background-image"]?.replace(/url\(['"]?|['"]?\)/g, "") || ""}
                onChange={(v) => onChange("background-image", v ? `url('${v}')` : "")}
                placeholder="https://..."
              />
            </div>
            {onOpenMediaLibrary && (
              <Button
                onClick={() =>
                  onOpenMediaLibrary(["image"], (asset) => {
                    onChange("background-image", `url('${asset.src}')`);
                  })
                }
                style={{
                  padding: "8px 12px",
                  background: "var(--bk-accent-subtle)",
                  border: "1px solid var(--bk-accent)",
                  borderRadius: 6,
                  color: "var(--bk-accent)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  marginBottom: 12,
                }}
                title="Browse media library"
              >
                Browse
              </Button>
            )}
          </div>

          {/* ─── Advanced: size/position/repeat/attachment (behind More settings) ─── */}
          {advancedExpanded && (
            <>
              <div style={{ position: "relative" }}>
                <MixedValueIndicator prop="background-size" mixedKeys={mixedKeys} />
                <SelectRow
                  label="Size"
                  value={styles["background-size"] || ""}
                  onChange={(v) => onChange("background-size", v)}
                  options={[
                    { value: "auto", label: "Auto" },
                    { value: "cover", label: "Cover" },
                    { value: "contain", label: "Contain" },
                    { value: "100% 100%", label: "Stretch" },
                  ]}
                />
              </div>

              <div style={{ position: "relative" }}>
                <MixedValueIndicator prop="background-position" mixedKeys={mixedKeys} />
                <SelectRow
                  label="Position"
                  value={styles["background-position"] || ""}
                  onChange={(v) => onChange("background-position", v)}
                  options={[
                    { value: "center", label: "Center" },
                    { value: "top", label: "Top" },
                    { value: "bottom", label: "Bottom" },
                    { value: "left", label: "Left" },
                    { value: "right", label: "Right" },
                    { value: "top left", label: "Top Left" },
                    { value: "top right", label: "Top Right" },
                    { value: "bottom left", label: "Bottom Left" },
                    { value: "bottom right", label: "Bottom Right" },
                  ]}
                />
              </div>

              <div style={{ position: "relative" }}>
                <MixedValueIndicator prop="background-repeat" mixedKeys={mixedKeys} />
                <SelectRow
                  label="Repeat"
                  value={styles["background-repeat"] || ""}
                  onChange={(v) => onChange("background-repeat", v)}
                  options={[
                    { value: "no-repeat", label: "No Repeat" },
                    { value: "repeat", label: "Repeat" },
                    { value: "repeat-x", label: "Repeat X" },
                    { value: "repeat-y", label: "Repeat Y" },
                  ]}
                />
              </div>

              <SelectRow
                label="Attachment"
                value={styles["background-attachment"] || ""}
                onChange={(v) => onChange("background-attachment", v)}
                options={[
                  { value: "scroll", label: "Scroll" },
                  { value: "fixed", label: "Fixed (Parallax)" },
                  { value: "local", label: "Local" },
                ]}
              />

              <SelectRow
                label="Blend Mode"
                value={styles["background-blend-mode"] || ""}
                onChange={(v) => onChange("background-blend-mode", v)}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "multiply", label: "Multiply" },
                  { value: "screen", label: "Screen" },
                  { value: "overlay", label: "Overlay" },
                  { value: "darken", label: "Darken" },
                  { value: "lighten", label: "Lighten" },
                  { value: "color-dodge", label: "Color Dodge" },
                  { value: "difference", label: "Difference" },
                ]}
              />
            </>
          )}

          {/* Progressive disclosure toggle for image bg */}
          {onAdvancedToggle && (
            <MoreSettingsToggle
              isOpen={advancedExpanded}
              onToggle={() => onAdvancedToggle()}
              advancedCount={4}
            />
          )}
        </>
      )}
    </Section>
  );
};

export default BackgroundSection;