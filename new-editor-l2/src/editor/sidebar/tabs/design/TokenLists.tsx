/**
 * Token list components for Design System
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../../../editor/inspector/shared/controls/Section";
import { useToast } from "../../../../shared/ui/Toast";
import {
  tokenGridStyles,
  sectionHeaderStyles,
  tokenRowStyles,
  tokenInfoStyles,
  tokenNameStyles,
  valueInputStyles,
  copyBtnStyles,
  addTokenBtnStyles,
  scaleRowStyles,
  scaleItemStyles,
  scaleLabelStyles,
  scaleValueStyles,
  spacingGridStyles,
  spacingItemStyles,
  spacingBarStyles,
  spacingLabelStyles,
  spacingValueStyles,
  radiusGridStyles,
  radiusItemStyles,
  radiusPreviewStyles,
  radiusLabelStyles,
  radiusValueStyles,
  shadowRowStyles,
  shadowPreviewStyles,
  shadowValueStyles,
  fontHintStyles,
} from "./styles";
import type { TokenListProps } from "./types";

// Copy icon
const CopyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="4" y="4" width="8" height="8" rx="1" />
    <path d="M2 10V3a1 1 0 0 1 1-1h7" />
  </svg>
);

/** Shared sub-group header — use once, never inline twice */
export const TokenGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div style={{ ...sectionHeaderStyles, marginBottom: 6, marginTop: 8 }}>{label}</div>
    {children}
  </div>
);

interface TypographyTokenListProps extends TokenListProps {
  onFontUpload?: (fontName: string, fontUrl: string) => void;
}

export const TypographyTokenList: React.FC<TypographyTokenListProps> = ({
  tokens,
  onChange,
  onCopy,
  onFontUpload,
}) => {
  const fontTokens = tokens.filter((t) => t.name.includes("Font") && !t.name.includes("Font "));
  const sizeTokens = tokens.filter((t) => t.name.startsWith("Font "));
  const fontInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = React.useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const { addToast } = useToast();

  const handleFontSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".woff", ".woff2", ".ttf", ".otf"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validTypes.includes(ext)) {
      addToast({
        message: `Invalid font format. Supported: ${validTypes.join(", ")}`,
        variant: "error",
      });
      return;
    }

    setUploadStatus("uploading");

    try {
      const fontUrl = URL.createObjectURL(file);
      const fontName = file.name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]/g, " ");
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      onFontUpload?.(fontName, fontUrl);
      setUploadStatus("success");
      setTimeout(() => setUploadStatus("idle"), 2000);
    } catch {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 2000);
    }

    if (fontInputRef.current) fontInputRef.current.value = "";
  };

  return (
    <div style={tokenGridStyles}>
      <Section title="Font Families" icon="Aa" defaultOpen={true}>
        {fontTokens.map((token) => (
          <div key={token.id} style={tokenRowStyles}>
            <div style={tokenInfoStyles}>
              <div style={tokenNameStyles}>{token.name}</div>
              <div
                style={{
                  fontFamily: token.value,
                  fontSize: 14,
                  color: "var(--aqb-text-secondary)",
                }}
              >
                Aa Bb Cc
              </div>
            </div>
            <input
              type="text"
              value={token.value}
              onChange={(e) => onChange(token.id, e.target.value)}
              style={valueInputStyles}
            />
            <button onClick={() => onCopy(token.id)} style={copyBtnStyles} title="Copy">
              <CopyIcon />
            </button>
          </div>
        ))}
      </Section>

      <Section title="Font Scale" icon="↕" defaultOpen={true}>
        <div style={scaleRowStyles}>
          {sizeTokens.map((token) => (
            <div key={token.id} style={scaleItemStyles}>
              <span style={scaleLabelStyles}>{token.name.replace("Font ", "")}</span>
              <span style={scaleValueStyles}>{token.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Custom Fonts" icon="⬆" defaultOpen={false}>
        <input
          ref={fontInputRef}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          onChange={handleFontSelect}
          style={{ display: "none" }}
        />
        <button
          style={{
            ...addTokenBtnStyles,
            marginTop: 0,
            ...(uploadStatus === "uploading" ? { opacity: 0.6, cursor: "wait" } : {}),
            ...(uploadStatus === "success"
              ? { borderColor: "var(--aqb-success)", color: "var(--aqb-success)" }
              : {}),
            ...(uploadStatus === "error"
              ? { borderColor: "var(--aqb-error)", color: "var(--aqb-error)" }
              : {}),
          }}
          onClick={() => fontInputRef.current?.click()}
          disabled={uploadStatus === "uploading"}
        >
          {uploadStatus === "idle" && "Upload Custom Font"}
          {uploadStatus === "uploading" && "Loading..."}
          {uploadStatus === "success" && "Font Added"}
          {uploadStatus === "error" && "Upload Failed"}
        </button>
        <div style={fontHintStyles}>Supports: .woff, .woff2, .ttf, .otf</div>
      </Section>
    </div>
  );
};

export const SpacingTokenList: React.FC<TokenListProps> = ({ tokens }) => (
  <div style={tokenGridStyles}>
    <div style={sectionHeaderStyles}>SPACING (Base: 4px)</div>
    <div style={spacingGridStyles}>
      {tokens.map((token) => (
        <div key={token.id} style={spacingItemStyles}>
          <div style={spacingBarStyles}>
            <div
              style={{
                width: token.value,
                height: 8,
                background: "var(--aqb-primary)",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={spacingLabelStyles}>
            <span>{token.name.replace("Space ", "")}</span>
            <span style={spacingValueStyles}>{token.value}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EffectsTokenList: React.FC<TokenListProps> = ({ tokens, onCopy }) => {
  const radiusTokens = tokens.filter((t) => t.name.includes("Radius"));
  const shadowTokens = tokens.filter((t) => t.name.includes("Shadow"));

  return (
    <div style={tokenGridStyles}>
      <Section title="Border Radius" icon="◼" defaultOpen={true}>
        <div style={radiusGridStyles}>
          {radiusTokens.map((token) => (
            <div key={token.id} style={radiusItemStyles}>
              <div style={{ ...radiusPreviewStyles, borderRadius: token.value }} />
              <span style={radiusLabelStyles}>{token.name.replace("Radius ", "")}</span>
              <span style={radiusValueStyles}>{token.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadow Presets" icon="◉" defaultOpen={true}>
        {shadowTokens.map((token) => (
          <div key={token.id} style={shadowRowStyles}>
            <div style={{ ...shadowPreviewStyles, boxShadow: token.value }} />
            <div style={tokenInfoStyles}>
              <div style={tokenNameStyles}>{token.name}</div>
              <div style={shadowValueStyles}>{token.value}</div>
            </div>
            <button onClick={() => onCopy(token.id)} style={copyBtnStyles} title="Copy">
              <CopyIcon />
            </button>
          </div>
        ))}
      </Section>

      <Section title="Custom Shadows" icon="✦" defaultOpen={false}>
        <button style={{ ...addTokenBtnStyles, marginTop: 0 }}>+ Add Custom Shadow</button>
        <div style={fontHintStyles}>Create custom box-shadow values</div>
      </Section>
    </div>
  );
};
