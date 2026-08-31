/**
 * Background Section - Color, Image, Gradient
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { extractGradientUI, composeGradient, deriveBgType } from "../../../shared/utils/parsers/gradientHelpers";
import { Section, ColorInput, SelectRow, InputRow, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";
import { Button, TextInput } from "@/editor/chrome-ui";

const FIELD_LABEL = "tw:text-xs tw:font-medium tw:text-[var(--bk-ink-muted)]";
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
  /** Threaded so the colour chips can jump to the Design panel. */
  composer?: Composer | null;
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
  composer,
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
      className="tw:inline-block tw:size-3.5 tw:flex-none tw:rounded-[3px] tw:border tw:border-[var(--bk-border-medium)]"
      /* the swatch IS the value */
      style={{ background: bgColor }}
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
      title="Background"
      icon="Palette"
      preview={preview}
      action={addAction}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-background"
    >
      {/* Background Type Selector — segmented */}
      <div className="bdi-seg tw:mb-1.5">
        {(["color", "gradient", "image"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            onClick={() => setBgType(type)}
            className={`tw:capitalize ${bgType === type ? "on" : ""}`}
            aria-pressed={bgType === type}
          >
            {type}
          </Button>
        ))}
      </div>
      {/* Color Background */}
      {bgType === "color" && (
        <div className="tw:relative">
          <MixedValueIndicator prop="background-color" mixedKeys={mixedKeys} />
          <ColorInput
            label="Fill"
            value={styles["background-color"] || ""}
            onChange={(v) => onChange("background-color", v)}
            composer={composer}
          />
        </div>
      )}
      {/* Gradient Background */}
      {bgType === "gradient" && (
        <>
          {/* One labelled row, like every other row in the panel. It used to
              be a caption over two 44px gradient tiles — the only pair of
              picture-buttons in a column of fields. */}
          <div className="bdi-row-ctrl">
            <label className="bdi-lb">Type</label>
            <div className="bdi-seg">
              <Button
                type="button"
                aria-pressed={(gradientUI?.gradientType || "linear") === "linear"}
                className={(gradientUI?.gradientType || "linear") === "linear" ? "on" : ""}
                onClick={() =>
                  onChange(
                    "background",
                    composeGradient({
                      type: "linear",
                      angle: gradientUI?.angle ?? 90,
                      color1: gradientUI?.color1 || "var(--bk-accent)",
                      color2: gradientUI?.color2 || "var(--bk-success)",
                    })
                  )
                }
              >
                Linear
              </Button>
              <Button
                type="button"
                aria-pressed={gradientUI?.gradientType === "radial"}
                className={gradientUI?.gradientType === "radial" ? "on" : ""}
                onClick={() =>
                  onChange(
                    "background",
                    composeGradient({
                      type: "radial",
                      angle: gradientUI?.angle ?? 90,
                      color1: gradientUI?.color1 || "var(--bk-accent)",
                      color2: gradientUI?.color2 || "var(--bk-success)",
                    })
                  )
                }
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
            composer={composer}
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
            composer={composer}
          />

          {/* Gradient Angle (for linear) */}
          {(gradientUI?.gradientType !== "radial") && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <label className={`${FIELD_LABEL} tw:min-w-[70px]`}>Angle</label>
              <TextInput
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
                className="tw:flex-1"
              />
              <span className={`${FIELD_LABEL} tw:min-w-10`}>{gradientUI?.angle ?? 90}°</span>
            </div>
          )}
        </>
      )}
      {/* Image Background */}
      {bgType === "image" && (
        <>
          <div className="tw:flex tw:items-end tw:gap-2 tw:mb-3">
            <div className="tw:relative tw:flex-1">
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
                className="tw:mb-3 tw:whitespace-nowrap tw:px-3 tw:py-2 tw:rounded-md tw:border tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-subtle)] tw:text-xs tw:font-semibold tw:text-[var(--bk-accent-text)]"
                title="Browse media library"
              >
                Browse
              </Button>
            )}
          </div>

          {/* ─── Advanced: size/position/repeat/attachment (behind More settings) ─── */}
          {advancedExpanded && (
            <>
              <div className="tw:relative">
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

              <div className="tw:relative">
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

              <div className="tw:relative">
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