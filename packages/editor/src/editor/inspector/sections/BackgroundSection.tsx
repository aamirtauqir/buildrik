/**
 * Background Section (registry id `fill`) — colour, gradient or image behind
 * the element (2L9 161:8940, 247:23966).
 *
 * The paint kind is the open header's select (Color · Gradient · Image, and
 * "Custom gradient" for a gradient the two-stop controls cannot hold);
 * choosing one replaces the old fill (X-1). A gradient of more than two
 * stops is shown as saved, never re-read into Color 1 / Color 2 — it is
 * kept until the user edits it as text or replaces it with a two-stop one.
 * An image draws "Image fill options": Source, Size, Position, Repeat,
 * Attachment, Blend. On the Page panel the section is the one "Color" row
 * (2L9 S06).
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { extractGradientUI, composeGradient, deriveBgType, DEFAULT_GRADIENT_STOPS } from "@/shared/utils/parsers/gradientHelpers";
import { parseGradient } from "@/shared/utils/parsers/gradientParser";
import { rgbToHex } from "@/shared/utils/parsers/colorConversionBasic";
import { AuthoredValue, countWord, ButtonGroup, Section, ColorInput, SelectRow, InputRow, type SectionTier } from "../shared/controls";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { BK_SELECT_BARE_VALUE_THEME, Button, Select, TextInput } from "@/editor/chrome-ui";
import { NoteRow } from "./behaviourRows";

const FIELD_LABEL = "tw:text-xs tw:font-medium tw:text-[var(--bk-ink-muted)]";

export interface BackgroundSectionProps {
  /** "page": the Page panel's subset (board 21 / S06). */
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
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so the colour chips can jump to the Design panel. */
  composer?: Composer | null;
}

type Kind = "color" | "gradient" | "image";

const KINDS: ReadonlyArray<{ value: Kind; label: string }> = [
  { value: "color", label: "Color" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
];

const SIZE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "100% 100%", label: "Stretch" },
];

const POSITION_OPTIONS = ["top", "center", "bottom"].flatMap((v) =>
  ["left", "center", "right"].map((h) => ({ value: `${h} ${v}`, label: `${v[0].toUpperCase()}${v.slice(1)} ${h}` })),
);

/** `center`, `top`, `left top`… → the select's "horizontal vertical" value;
 *  unset is CSS's initial top-left. A length / percentage stays as written. */
function positionValue(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "left top";
  if (words.length > 2 || words.some((w) => /\d/.test(w))) return raw;
  let horizontal = "center";
  let vertical = "center";
  for (const w of words) {
    if (w === "left" || w === "right") horizontal = w;
    else if (w === "top" || w === "bottom") vertical = w;
  }
  return `${horizontal} ${vertical}`;
}

const REPEAT_OPTIONS = [
  { value: "no-repeat", label: "No repeat" },
  { value: "repeat", label: "Repeat" },
  { value: "repeat-x", label: "Repeat horizontally" },
  { value: "repeat-y", label: "Repeat vertically" },
];

const ATTACHMENT_OPTIONS = [
  { value: "scroll", label: "Scroll" },
  { value: "fixed", label: "Fixed (parallax)" },
  { value: "local", label: "Local" },
];

const BLEND_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color dodge" },
  { value: "difference", label: "Difference" },
];


export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  variant = "element",
  styles,
  onChange,
  onBatchChange,
  onOpenMediaLibrary,
  isOpen,
  onToggle,
  tier = "primary",
  composer,
}) => {
  const [bgType, setBgType] = React.useState<Kind>(() => deriveBgType(styles));

  React.useEffect(() => {
    setBgType(deriveBgType(styles));
  }, [styles.background, styles["background-image"]]);

  const gradientSource = styles.background || styles["background-image"] || "";
  const gradientUI = bgType === "gradient" ? extractGradientUI(gradientSource) : null;
  const saved = gradientUI?.isOpaque ? parseGradient(gradientSource) : null;
  const color1 = gradientUI?.color1 || DEFAULT_GRADIENT_STOPS.color1;
  const color2 = gradientUI?.color2 || DEFAULT_GRADIENT_STOPS.color2;
  const gradientType = (gradientUI?.gradientType || "linear") as "linear" | "radial";
  const angle = gradientUI?.angle ?? 90;

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
  /* A gradient lives on `background`; one that arrived on background-image
     (imports) moves there on its first write. */
  const writeGradient = (value: string) => {
    if (styles["background-image"] && /gradient\(/.test(styles["background-image"])) writeMany({ "background-image": "", background: value });
    else onChange("background", value);
  };
  const gradient = (over: Partial<{ type: "linear" | "radial"; angle: number; color1: string; color2: string }>) =>
    writeGradient(composeGradient({ type: gradientType, angle, color1, color2, ...over }));

  /* Choosing a kind replaces the old fill (X-1): a gradient left on
     `background` kept covering a newly chosen colour. Image waits for an
     image to be chosen (writeImage) before dropping a gradient. */
  const chooseType = (type: Kind) => {
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

  const bgColor = styles["background-color"] || styles["background"];
  const preview = bgColor ? (
    <span
      className="tw:inline-block tw:size-3.5 tw:flex-none tw:rounded-[3px] tw:border tw:border-[var(--bk-border-medium)]"
      /* the swatch IS the value */
      style={{ background: bgColor }}
      title={bgColor}
    />
  ) : undefined;

  const kindValue = saved ? "custom" : bgType;
  const kindPicker =
    variant === "page" ? undefined : (
      <Select
        aria-label="Paint kind"
        sizing="sm"
        theme={BK_SELECT_BARE_VALUE_THEME}
        className="tw:text-[12px] tw:text-[var(--bk-ink-soft)]"
        value={kindValue}
        onChange={(e) => chooseType(e.target.value as Kind)}
      >
        {saved && (
          <option value="custom" disabled>
            Custom gradient
          </option>
        )}
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </Select>
    );

  return (
    <Section
      title="Background"
      preview={preview}
      action={kindPicker}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-fill"
    >
      {bgType === "color" && (
        <ColorInput
          label="Color"
          property="background-color"
          value={styles["background-color"] || shorthandColor}
          onChange={writeFill}
          composer={composer}
        />
      )}

      {bgType === "gradient" && saved && (
        <AuthoredValue
          testId="inspector-fill-saved-gradient"
          caption="Saved gradient"
          value={gradientSource}
          note={`${countWord(saved.stops.length)} stops retained. Two-stop controls cannot losslessly edit this value.`}
          editLabel="Edit custom gradient"
          accept={(next) => Boolean(parseGradient(next))}
          onCommit={writeGradient}
        >
          <Button
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => {
              const first = saved.stops[0]?.color;
              const last = saved.stops[saved.stops.length - 1]?.color;
              writeGradient(
                composeGradient({
                  type: saved.type === "radial" ? "radial" : "linear",
                  angle: saved.type === "linear" ? saved.angle : 90,
                  color1: first ? rgbToHex(first) : color1,
                  color2: last ? rgbToHex(last) : color2,
                }),
              );
            }}
          >
            Replace with two-stop gradient
          </Button>
        </AuthoredValue>
      )}
      {/* A gradient the saved-gradient card cannot read either (several
          layers) is shown, never offered to the 2-stop editor: any edit there
          rewrote it as two stops, destroying the rest. */}
      {bgType === "gradient" && gradientUI?.isOpaque && !saved && (
        <p className={`${FIELD_LABEL} tw:mb-3`} data-testid="inspector-fill-gradient-complex">
          This gradient has more than two colour stops or layers, so it can&apos;t be edited here. It is kept as it is.
        </p>
      )}

      {bgType === "gradient" && !gradientUI?.isOpaque && (
        <>
          <ButtonGroup
            label="Type"
            property="background"
            value={gradientType}
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
            ]}
            onChange={(v) => gradient({ type: v as "linear" | "radial" })}
          />
          <ColorInput label="Color 1" value={color1} onChange={(v) => gradient({ color1: v })} composer={composer} />
          <ColorInput label="Color 2" value={color2} onChange={(v) => gradient({ color2: v })} composer={composer} />
          {gradientType !== "radial" && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <label className={`${FIELD_LABEL} tw:min-w-[70px]`}>Angle</label>
              <TextInput
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => gradient({ type: "linear", angle: Number(e.target.value) })}
                className="tw:flex-1"
              />
              <span className={`${FIELD_LABEL} tw:min-w-10`}>{angle}°</span>
            </div>
          )}
        </>
      )}

      {bgType === "image" && (
        <>
          <div className={GROUP_TITLE}>Image fill options</div>
          <div className="tw:flex tw:items-end tw:gap-2">
            <div className="tw:relative tw:flex-1">
              <InputRow
                label="Source"
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
          <SelectRow
            property="background-size"
            label="Size"
            value={styles["background-size"] || "auto"}
            onChange={(v) => onChange("background-size", v)}
            options={SIZE_OPTIONS}
          />
          <SelectRow
            property="background-position"
            label="Position"
            value={positionValue(styles["background-position"] || "")}
            onChange={(v) => onChange("background-position", v)}
            options={POSITION_OPTIONS}
          />
          <SelectRow
            property="background-repeat"
            label="Repeat"
            value={styles["background-repeat"] || "repeat"}
            onChange={(v) => onChange("background-repeat", v)}
            options={REPEAT_OPTIONS}
          />
          <SelectRow
            property="background-attachment"
            label="Attachment"
            value={styles["background-attachment"] || "scroll"}
            onChange={(v) => onChange("background-attachment", v)}
            options={ATTACHMENT_OPTIONS}
          />
          <SelectRow
            property="background-blend-mode"
            label="Blend"
            value={styles["background-blend-mode"] || "normal"}
            onChange={(v) => onChange("background-blend-mode", v)}
            options={BLEND_OPTIONS}
          />
        </>
      )}

      {variant !== "page" && <NoteRow>Choosing a paint kind is an explicit replacement at this layer.</NoteRow>}
    </Section>
  );
};
