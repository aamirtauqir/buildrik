/**
 * Background Section - Color, Image, Gradient
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { Section, ColorInput, SelectRow, InputRow } from "../shared/Controls";

interface BackgroundSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Opens media library for asset selection */
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  styles,
  onChange,
  onOpenMediaLibrary,
}) => {
  const [bgType, setBgType] = React.useState<"color" | "gradient" | "image">("color");

  // Compute color preview from styles
  const bgColor = styles["background-color"] || styles["backgroundColor"] || styles["background"];
  const preview = bgColor ? (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 3,
        background: bgColor,
        border: "1px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
      }}
      title={bgColor}
    />
  ) : undefined;

  return (
    <Section title="Background" icon="Palette" preview={preview} id="inspector-section-background">
      {/* Background Type Selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["color", "gradient", "image"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setBgType(type)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: bgType === type ? "rgba(0,115,230,0.2)" : "rgba(255,255,255,0.03)",
              border:
                bgType === type
                  ? "1px solid rgba(0,115,230,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6,
              color: bgType === type ? "#0073E6" : "#71717a",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Color Background */}
      {bgType === "color" && (
        <ColorInput
          label="Color"
          value={styles["background-color"] || ""}
          onChange={(v) => onChange("background-color", v)}
        />
      )}

      {/* Gradient Background */}
      {bgType === "gradient" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                color: "#71717a",
                fontWeight: 500,
                display: "block",
                marginBottom: 8,
              }}
            >
              Gradient Type
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => {
                  const color1 = "#0073E6";
                  const color2 = "#00C853";
                  onChange("background", `linear-gradient(90deg, ${color1}, ${color2})`);
                }}
                style={{
                  flex: 1,
                  padding: "20px 12px",
                  background: "linear-gradient(90deg, #0073E6, #00C853)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 10,
                  color: "#fff",
                }}
              >
                Linear
              </button>
              <button
                onClick={() => {
                  const color1 = "#0073E6";
                  const color2 = "#00C853";
                  onChange("background", `radial-gradient(circle, ${color1}, ${color2})`);
                }}
                style={{
                  flex: 1,
                  padding: "20px 12px",
                  background: "radial-gradient(circle, #0073E6, #00C853)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 10,
                  color: "#fff",
                }}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Gradient Colors */}
          <ColorInput
            label="Color 1"
            value="#0073E6"
            onChange={(v) => {
              const current = styles.background || "";
              if (current.includes("linear-gradient")) {
                onChange("background", `linear-gradient(90deg, ${v}, #00C853)`);
              } else {
                onChange("background", `radial-gradient(circle, ${v}, #00C853)`);
              }
            }}
          />
          <ColorInput
            label="Color 2"
            value="#00C853"
            onChange={(v) => {
              const current = styles.background || "";
              if (current.includes("linear-gradient")) {
                onChange("background", `linear-gradient(90deg, #0073E6, ${v})`);
              } else {
                onChange("background", `radial-gradient(circle, #0073E6, ${v})`);
              }
            }}
          />

          {/* Gradient Angle (for linear) */}
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
                fontSize: 11,
                color: "#71717a",
                fontWeight: 500,
                minWidth: 70,
              }}
            >
              Angle
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value="90"
              onChange={(e) => {
                onChange("background", `linear-gradient(${e.target.value}deg, #0073E6, #00C853)`);
              }}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 11, color: "#71717a", minWidth: 40 }}>90°</span>
          </div>
        </>
      )}

      {/* Image Background */}
      {bgType === "image" && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <InputRow
                label="Image URL"
                value={styles["background-image"]?.replace(/url\(['"]?|['"]?\)/g, "") || ""}
                onChange={(v) => onChange("background-image", v ? `url('${v}')` : "")}
                placeholder="https://..."
              />
            </div>
            {onOpenMediaLibrary && (
              <button
                onClick={() =>
                  onOpenMediaLibrary(["image"], (asset) => {
                    onChange("background-image", `url('${asset.src}')`);
                  })
                }
                style={{
                  padding: "8px 12px",
                  background: "rgba(0, 115, 230, 0.2)",
                  border: "1px solid rgba(0, 115, 230, 0.3)",
                  borderRadius: 6,
                  color: "#0073E6",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  marginBottom: 12,
                }}
                title="Browse media library"
              >
                Browse
              </button>
            )}
          </div>

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
        </>
      )}
    </Section>
  );
};

export default BackgroundSection;
