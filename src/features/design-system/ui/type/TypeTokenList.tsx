/**
 * TypeTokenList v11 — Type tab pane
 * Shows font families, type scale, and responsive preview.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ResponsiveMode } from "../../state/useTypeTokens";
import type { DesignToken } from "../../types";

export interface TypeTokenListProps {
  tokens: DesignToken[];
  responsiveMode: ResponsiveMode;
  onTokenChange: (id: string, value: string) => void;
  onResponsiveModeChange: (mode: ResponsiveMode) => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
  onRedo: (id: string) => void;
  canRedo: (id: string) => boolean;
}

// ─── Icon buttons ─────────────────────────────────────────────────────────────

const DesktopIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="1" y="2" width="12" height="8" rx="1" />
    <path d="M5 10v2M9 10v2M4 12h6" strokeLinecap="round" />
  </svg>
);

const MobileIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="4" y="1" width="6" height="12" rx="1" />
    <circle cx="7" cy="11" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

// ─── Style toggle (B / I) ─────────────────────────────────────────────────────

const StyleToggle: React.FC<{
  label: string;
  active: boolean;
  onToggle: () => void;
  fontStyle?: React.CSSProperties;
}> = ({ label, active, onToggle, fontStyle }) => (
  <button
    onClick={onToggle}
    aria-pressed={active}
    style={{
      width: 24,
      height: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      border: "1px solid",
      borderColor: active ? "var(--aqb-primary)" : "var(--aqb-border)",
      background: active ? "rgba(59,130,246,0.15)" : "transparent",
      color: active ? "var(--aqb-primary)" : "var(--aqb-text-muted)",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      ...fontStyle,
    }}
    title={`Toggle ${label}`}
  >
    {label}
  </button>
);

// ─── Type scale row ───────────────────────────────────────────────────────────

const TYPE_SCALE_NAMES: Record<string, { semantic: string; previewText: string }> = {
  "font-size-xs": { semantic: "Caption", previewText: "Caption text XS" },
  "font-size-sm": { semantic: "Small", previewText: "Small body text" },
  "font-size-base": { semantic: "Body", previewText: "Body text" },
  "font-size-lg": { semantic: "Large", previewText: "Large text" },
  "font-size-xl": { semantic: "Subtitle", previewText: "Subtitle text" },
  "font-size-2xl": { semantic: "Heading 3", previewText: "Heading 3" },
  "font-size-3xl": { semantic: "Heading 2", previewText: "Heading 2" },
  "font-size-4xl": { semantic: "Heading 1", previewText: "Heading 1" },
};

interface TypeScaleRowProps {
  token: DesignToken;
  onChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: boolean;
  onRedo: (id: string) => void;
  canRedo: boolean;
}

const TypeScaleRow: React.FC<TypeScaleRowProps> = ({
  token,
  onChange,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
}) => {
  const [bold, setBold] = React.useState(false);
  const [italic, setItalic] = React.useState(false);

  const info = TYPE_SCALE_NAMES[token.id];
  const size = parseFloat(token.value);
  const unit = token.value.replace(/[0-9.]/g, "") || "px";
  const isExtreme = !isNaN(size) && (size < 8 || size > 128);

  const handleSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num > 0) onChange(token.id, `${num}${unit}`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Semantic label */}
      <div style={{ width: 64, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--aqb-text-primary)" }}>
          {info?.semantic ?? token.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginTop: 1 }}>{token.id}</div>
      </div>

      {/* Size input */}
      <input
        type="number"
        value={size}
        min={1}
        max={200}
        step={1}
        onChange={handleSizeInput}
        style={{
          width: 44,
          padding: "4px 6px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 4,
          color: "var(--aqb-text-primary)",
          fontSize: 12,
          textAlign: "right",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, color: "var(--aqb-text-muted)", flexShrink: 0 }}>{unit}</span>

      {/* Style toggles */}
      <div style={{ display: "flex", gap: 3 }}>
        <StyleToggle
          label="B"
          active={bold}
          onToggle={() => setBold((v) => !v)}
          fontStyle={{ fontWeight: 800 }}
        />
        <StyleToggle
          label="I"
          active={italic}
          onToggle={() => setItalic((v) => !v)}
          fontStyle={{ fontStyle: "italic" }}
        />
      </div>

      {/* Preview */}
      <div
        style={{
          flex: 1,
          fontSize: token.value,
          fontWeight: bold ? 700 : 400,
          fontStyle: italic ? "italic" : "normal",
          color: "var(--aqb-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {info?.previewText ?? token.name}
      </div>

      {/* Extreme size warning */}
      {isExtreme && (
        <span
          title="Extreme font size may break layout"
          style={{ color: "var(--aqb-accent-amber)", fontSize: 12, flexShrink: 0 }}
        >
          ⚠
        </span>
      )}

      {/* Undo button */}
      {canUndo && (
        <button
          onClick={() => onUndo(token.id)}
          title="Undo"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "var(--aqb-accent-amber)",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↩
        </button>
      )}

      {/* Redo button */}
      {canRedo && (
        <button
          onClick={() => onRedo(token.id)}
          title="Redo"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "var(--aqb-primary)",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↪
        </button>
      )}
    </div>
  );
};

// ─── Font family row ──────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "DM Sans",
  "Geist",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "JetBrains Mono",
];

interface FontRowProps {
  token: DesignToken;
  onChange: (id: string, value: string) => void;
}

const FontFamilyRow: React.FC<FontRowProps> = ({ token, onChange }) => {
  const [fontLoadFailed, setFontLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setFontLoadFailed(false);
    document.fonts
      .load(`16px "${token.value}"`)
      .then((faces) => {
        if (faces.length === 0) setFontLoadFailed(true);
      })
      .catch(() => setFontLoadFailed(true));
  }, [token.value]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--aqb-text-primary)" }}>
          {token.name}
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: token.value,
            color: "var(--aqb-text-muted)",
            marginTop: 2,
          }}
        >
          Aa Bb Cc 123
        </div>
        {fontLoadFailed && (
          <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 2 }}>
            Font unavailable — may fall back to system font
          </div>
        )}
      </div>
      <select
        value={token.value}
        onChange={(e) => onChange(token.id, e.target.value)}
        style={{
          padding: "5px 8px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 6,
          color: "var(--aqb-text-primary)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
        {!FONT_OPTIONS.includes(token.value) && <option value={token.value}>{token.value}</option>}
      </select>
    </div>
  );
};

// ─── Type preview band ────────────────────────────────────────────────────────

interface TypePreviewBandProps {
  fontTokens: DesignToken[];
  sizeTokens: DesignToken[];
  responsiveMode: ResponsiveMode;
}

const TypePreviewBand: React.FC<TypePreviewBandProps> = ({
  fontTokens,
  sizeTokens,
  responsiveMode,
}) => {
  const bodyFont = fontTokens.find((t) => t.id === "font-body")?.value ?? "Inter";
  const headingFont = fontTokens.find((t) => t.id === "font-heading")?.value ?? "Inter";

  const getSize = (id: string) => {
    const token = sizeTokens.find((t) => t.id === id);
    if (!token) return "16px";
    if (responsiveMode === "mobile") {
      return `${Math.round(parseFloat(token.value) * 0.85)}px`;
    }
    return token.value;
  };

  return (
    <div
      style={{
        padding: 12,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        border: "1px solid var(--aqb-border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: headingFont,
          fontSize: getSize("font-size-4xl"),
          fontWeight: 700,
          color: "var(--aqb-text-primary)",
          lineHeight: 1.1,
        }}
      >
        Heading 1
      </div>
      <div
        style={{
          fontFamily: headingFont,
          fontSize: getSize("font-size-3xl"),
          fontWeight: 600,
          color: "var(--aqb-text-primary)",
          lineHeight: 1.2,
        }}
      >
        Heading 2
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: getSize("font-size-base"),
          color: "var(--aqb-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        Body text — the quick brown fox jumps over the lazy dog.
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--aqb-text-muted)",
          textAlign: "right",
          letterSpacing: "0.3px",
        }}
      >
        Live preview — updates as you type
      </div>
    </div>
  );
};

// ─── TypeTokenList ────────────────────────────────────────────────────────────

const SECTION_HEADER: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
  marginTop: 12,
};

export const TypeTokenList: React.FC<TypeTokenListProps> = ({
  tokens,
  responsiveMode,
  onTokenChange,
  onResponsiveModeChange,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
}) => {
  const fontTokens = tokens.filter((t) => t.type === "font-family");
  const sizeTokens = tokens.filter((t) => t.type === "font-size");

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Device hint */}
      <div
        style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginBottom: 6, lineHeight: 1.5 }}
      >
        Type scale per device — changes here only affect the selected breakpoint.
      </div>

      {/* Responsive toggle */}
      <div
        style={{ display: "flex", gap: 4, marginBottom: 8 }}
        title="Preview only — font sizes scale automatically for mobile. You cannot set separate mobile values here."
      >
        <button
          onClick={() => onResponsiveModeChange("desktop")}
          title="Desktop preview"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid",
            borderColor: responsiveMode === "desktop" ? "var(--aqb-primary)" : "var(--aqb-border)",
            background: responsiveMode === "desktop" ? "rgba(59,130,246,0.12)" : "transparent",
            color: responsiveMode === "desktop" ? "var(--aqb-primary)" : "var(--aqb-text-muted)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <DesktopIcon />
          Desktop preview
        </button>
        <button
          onClick={() => onResponsiveModeChange("mobile")}
          title="Mobile preview"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid",
            borderColor: responsiveMode === "mobile" ? "var(--aqb-primary)" : "var(--aqb-border)",
            background: responsiveMode === "mobile" ? "rgba(59,130,246,0.12)" : "transparent",
            color: responsiveMode === "mobile" ? "var(--aqb-primary)" : "var(--aqb-text-muted)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <MobileIcon />
          Mobile preview (85%)
        </button>
      </div>

      {/* Full preview band */}
      <TypePreviewBand
        fontTokens={fontTokens}
        sizeTokens={sizeTokens}
        responsiveMode={responsiveMode}
      />

      {/* Font families */}
      {fontTokens.length > 0 && (
        <>
          <div style={SECTION_HEADER}>Fonts</div>
          {fontTokens.map((token) => (
            <FontFamilyRow key={token.id} token={token} onChange={onTokenChange} />
          ))}
        </>
      )}

      {/* Type scale */}
      {sizeTokens.length > 0 && (
        <>
          <div style={SECTION_HEADER}>Text Sizes</div>
          {sizeTokens.map((token) => (
            <TypeScaleRow
              key={token.id}
              token={token}
              onChange={onTokenChange}
              onUndo={onUndo}
              canUndo={canUndo(token.id)}
              onRedo={onRedo}
              canRedo={canRedo(token.id)}
            />
          ))}
        </>
      )}
    </div>
  );
};
