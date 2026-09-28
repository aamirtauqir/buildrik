/**
 * Fill Section (registry id `fill`, boards 1, 21, 27) — colour, gradient or
 * image behind the element. Empty = board 1's "Fill  +" row (the frame draws
 * it); "+" opens the Colour row. The Colour / Gradient / Image choice waits
 * behind More settings until a gradient or image is set. On the Page panel
 * the row reads "Background" (board 21).
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { extractGradientUI, composeGradient, deriveBgType, DEFAULT_GRADIENT_STOPS } from "@/shared/utils/parsers/gradientHelpers";
import { Section, ColorInput, SelectRow, InputRow, MoreSettingsToggle, type SectionTier } from "../shared/controls";
import { Button, TextInput } from "@/editor/chrome-ui";

const FIELD_LABEL = "tw:text-xs tw:font-medium tw:text-[var(--bk-ink-muted)]";
export interface BackgroundSectionProps {
  /** "page" names the colour row "Background" (board 21). */
  variant?: "element" | "page";
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Writes several properties as one change (one undo step). Switching the
   *  type replaces the old fill through it. */
  onBatchChange?: (changes: Record<string, string>) => void;
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
  variant = "element",
  styles,
  onChange,
  onBatchChange,
  onOpenMediaLibrary,
  isOpen,
  onToggle,
  tier = "primary",
  advancedExpanded = false,
  onAdvancedToggle,
  isMultiSelect,
  composer,
}) => {
  const [bgType, setBgType] = React.useState<"color" | "gradient" | "image">(() => deriveBgType(styles));

  React.useEffect(() => {
    setBgType(deriveBgType(styles));
  }, [styles.background, styles["background-image"]]);

  const gradientUI = bgType === "gradient" ? extractGradientUI(styles.background || styles["background-image"] || "") : null;
  const color1 = gradientUI?.color1 || DEFAULT_GRADIENT_STOPS.color1;
  const color2 = gradientUI?.color2 || DEFAULT_GRADIENT_STOPS.color2;

  /* A plain colour can sit on the `background` shorthand (imports, templates).
     Fill shows it, and a Fill write clears it: otherwise the shorthand keeps
     painting over the new background-color. */
  const shorthandColor = styles.background && !/gradient\(|url\(/.test(styles.background) ? styles.background : "";
  const writeMany = (changes: Record<string, string>) => {
    if (onBatchChange) onBatchChange(changes);
    else Object.entries(changes).forEach(([property, value]) => onChange(property, value));
  };
  const writeFill = (value: string) => {
    if (styles.background) writeMany({ background: "", "background-color": value });
    else onChange("background-color", value);
  };
  const writeImage = (value: string) => {
    if (value && styles.background) writeMany({ background: "", "background-image": value });
    else onChange("background-image", value);
  };

  /* Switching the type replaces the old fill (X-1): a gradient left on
     `background` kept covering a newly chosen colour. Image waits for an
     image to be chosen (writeImage) before dropping a gradient. */
  const chooseType = (type: "color" | "gradient" | "image") => {
    setBgType(type);
    if (type === bgType) return;
    const hasImage = Boolean(styles["background-image"]);
    const hasPaint = Boolean(styles.background) && !shorthandColor;
    if (type === "color" && (hasImage || hasPaint)) {
      writeMany({ ...(hasImage ? { "background-image": "" } : {}), ...(hasPaint ? { background: "" } : {}) });
    } else if (type === "gradient") {
      writeMany({
        ...(hasImage ? { "background-image": "" } : {}),
        background: composeGradient({ type: "linear", angle: 90, color1, color2 }),
      });
    }
  };

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

  return (
    <Section
      title="Fill"
      preview={preview}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-fill"
    >
      {/* Background Type Selector — segmented. Board 7056:78695 opens a
          colour background as the one Fill row; the Color / Gradient / Image
          choice waits behind More settings until a gradient or image is set. */}
      {(bgType !== "color" || advancedExpanded) && (
      <div className="bdi-seg tw:mb-1.5">
        {(["color", "gradient", "image"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            onClick={() => chooseType(type)}
            className={`tw:capitalize ${bgType === type ? "on" : ""}`}
            aria-pressed={bgType === type}
          >
            {type}
          </Button>
        ))}
      </div>
      )}
      {/* Color Background */}
      {bgType === "color" && (
        <div className="tw:relative">
          <ColorInput
            label={variant === "page" ? "Background" : "Colour"}
            property="background-color"
            value={styles["background-color"] || shorthandColor}
            onChange={writeFill}
            composer={composer}
          />
        </div>
      )}
      {bgType === "color" && onAdvancedToggle && (
        <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} advancedCount={2} />
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
                      color1,
                      color2,
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
                      color1,
                      color2,
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
            value={color1}
            onChange={(v) => {
              const result = composeGradient({
                type: (gradientUI?.gradientType || "linear") as "linear" | "radial",
                angle: gradientUI?.angle ?? 90,
                color1: v,
                color2,
              });
              onChange("background", result);
            }}
            composer={composer}
          />
          <ColorInput
            label="Color 2"
            value={color2}
            onChange={(v) => {
              const result = composeGradient({
                type: (gradientUI?.gradientType || "linear") as "linear" | "radial",
                angle: gradientUI?.angle ?? 90,
                color1,
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
                    color1,
                    color2,
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
              <InputRow
                label="Image URL"
                property="background-image"
                value={styles["background-image"]?.replace(/url\(['"]?|['"]?\)/g, "") || ""}
                onChange={(v) => writeImage(v ? `url('${v}')` : "")}
                placeholder="https://..."
              />
            </div>
            {onOpenMediaLibrary && (
              <Button
                onClick={() =>
                  onOpenMediaLibrary(["image"], (asset) => {
                    writeImage(`url('${asset.src}')`);
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
                <SelectRow
                  property="background-size"
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
                <SelectRow
                  property="background-position"
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
                <SelectRow
                  property="background-repeat"
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
                property="background-attachment"
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
                property="background-blend-mode"
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