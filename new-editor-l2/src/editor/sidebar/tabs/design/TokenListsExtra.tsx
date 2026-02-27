/**
 * Extra token list components — Layout, Buttons, Forms, Icons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../../../editor/inspector/shared/controls/Section";
import {
  tokenGridStyles,
  tokenRowStyles,
  tokenInfoStyles,
  tokenNameStyles,
  valueInputStyles,
  copyBtnStyles,
  colorPickerSmallStyles,
  hexInputSmallStyles,
  colorCardInfoStyles,
  tokenNameSmallStyles,
  fontHintStyles,
} from "./styles";
import { TokenGroup } from "./TokenLists";
import type { TokenListProps, DesignToken } from "./types";

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

// Generic row for length/number/string tokens
const TokenRow: React.FC<{
  token: DesignToken;
  onChange: (id: string, value: string) => void;
  onCopy: (id: string) => void;
}> = ({ token, onChange, onCopy }) => (
  <div style={tokenRowStyles}>
    <div style={tokenInfoStyles}>
      <div style={tokenNameStyles}>{token.name}</div>
      {token.description && (
        <div style={{ fontSize: 10, color: "var(--aqb-text-muted)", marginTop: 2 }}>
          {token.description}
        </div>
      )}
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
);

// Color row for color-type tokens
const ColorRow: React.FC<{
  token: DesignToken;
  onChange: (id: string, value: string) => void;
}> = ({ token, onChange }) => (
  <div
    style={{
      ...tokenRowStyles,
      gap: 8,
    }}
  >
    <input
      type="color"
      value={token.value}
      onChange={(e) => onChange(token.id, e.target.value)}
      style={{ ...colorPickerSmallStyles, width: 32, height: 32, flexShrink: 0 }}
    />
    <div style={colorCardInfoStyles}>
      <div style={tokenNameSmallStyles}>{token.name}</div>
      <input
        type="text"
        value={token.value}
        onChange={(e) => onChange(token.id, e.target.value)}
        style={hexInputSmallStyles}
      />
    </div>
  </div>
);

// Groups tokens by their group field
function groupBy(tokens: DesignToken[]): Map<string, DesignToken[]> {
  const map = new Map<string, DesignToken[]>();
  for (const token of tokens) {
    const key = token.group ?? "other";
    const existing = map.get(key);
    if (existing) {
      existing.push(token);
    } else {
      map.set(key, [token]);
    }
  }
  return map;
}

// ─── Layout / Grid ───────────────────────────────────────────────────────────

export const LayoutTokenList: React.FC<TokenListProps> = ({ tokens, onChange, onCopy }) => {
  const grouped = groupBy(tokens);
  const LABELS: Record<string, string> = {
    container: "CONTAINER",
    grid: "GRID",
    sections: "SECTIONS",
    breakpoints: "BREAKPOINTS",
  };

  return (
    <div style={tokenGridStyles}>
      {Array.from(grouped.entries()).map(([group, groupTokens]) => (
        <TokenGroup key={group} label={LABELS[group] ?? group.toUpperCase()}>
          {groupTokens.map((token) => (
            <TokenRow key={token.id} token={token} onChange={onChange} onCopy={onCopy} />
          ))}
        </TokenGroup>
      ))}
    </div>
  );
};

// ─── Buttons & CTA ───────────────────────────────────────────────────────────

export const ButtonsTokenList: React.FC<TokenListProps> = ({ tokens, onChange, onCopy }) => {
  const sizeTokens = tokens.filter((t) => t.group === "size");
  const styleTokens = tokens.filter((t) => t.group === "style");

  // Derive inline preview values directly from token array (not CSS vars, for instant feedback)
  const getVal = (id: string) => tokens.find((t) => t.id === id)?.value ?? "";

  const previewContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid var(--aqb-border)",
    marginBottom: 8,
    flexWrap: "wrap",
  };

  const mkBtnStyle = (heightId: string): React.CSSProperties => ({
    height: getVal(heightId),
    paddingLeft: getVal("btn-padding-x"),
    paddingRight: getVal("btn-padding-x"),
    borderRadius: getVal("btn-radius"),
    fontSize: getVal("btn-font-size"),
    fontWeight: getVal("btn-font-weight"),
    background: "var(--aqb-color-primary)",
    color: "#fff",
    border: "none",
    cursor: "default",
    whiteSpace: "nowrap",
  });

  return (
    <div style={tokenGridStyles}>
      <Section title="Live Preview" icon="⬜" defaultOpen={true}>
        <div style={previewContainerStyle}>
          <button style={mkBtnStyle("btn-height-sm")}>Small</button>
          <button style={mkBtnStyle("btn-height-md")}>Medium</button>
          <button style={mkBtnStyle("btn-height-lg")}>Large</button>
          <button
            style={{
              ...mkBtnStyle("btn-height-md"),
              borderRadius: getVal("cta-radius"),
            }}
          >
            CTA
          </button>
        </div>
      </Section>

      <TokenGroup label="SIZE">
        {sizeTokens.map((token) => (
          <TokenRow key={token.id} token={token} onChange={onChange} onCopy={onCopy} />
        ))}
      </TokenGroup>

      <TokenGroup label="STYLE">
        {styleTokens.map((token) => (
          <TokenRow key={token.id} token={token} onChange={onChange} onCopy={onCopy} />
        ))}
      </TokenGroup>
    </div>
  );
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const FormsTokenList: React.FC<TokenListProps> = ({ tokens, onChange, onCopy }) => {
  const getVal = (id: string) => tokens.find((t) => t.id === id)?.value ?? "";

  const previewContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid var(--aqb-border)",
    marginBottom: 8,
  };

  const labelPreviewStyle: React.CSSProperties = {
    fontSize: getVal("label-font-size"),
    fontWeight: getVal("label-weight"),
    color: "var(--aqb-text-primary)",
  };

  const inputPreviewStyle: React.CSSProperties = {
    height: getVal("input-height"),
    borderRadius: getVal("input-radius"),
    border: `1px solid ${getVal("input-border")}`,
    paddingLeft: getVal("input-padding-x"),
    paddingRight: getVal("input-padding-x"),
    fontSize: getVal("label-font-size"),
    background: "rgba(255,255,255,0.05)",
    color: "var(--aqb-text-muted)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const grouped = groupBy(tokens);
  const LABELS: Record<string, string> = {
    size: "SIZE",
    style: "STYLE",
    typography: "TYPOGRAPHY",
  };

  return (
    <div style={tokenGridStyles}>
      <Section title="Live Preview" icon="▭" defaultOpen={true}>
        <div style={previewContainerStyle}>
          <label style={labelPreviewStyle}>Email address</label>
          <input
            style={inputPreviewStyle}
            placeholder="placeholder@example.com"
            readOnly
          />
        </div>
      </Section>

      {Array.from(grouped.entries()).map(([group, groupTokens]) => (
        <TokenGroup key={group} label={LABELS[group] ?? group.toUpperCase()}>
          {groupTokens.map((token) =>
            token.type === "color" ? (
              <ColorRow key={token.id} token={token} onChange={onChange} />
            ) : (
              <TokenRow key={token.id} token={token} onChange={onChange} onCopy={onCopy} />
            )
          )}
        </TokenGroup>
      ))}
    </div>
  );
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const DEMO_ICON_PATH =
  "M12 5v14M5 12h14";

const DemoIcon: React.FC<{ size: string; stroke: string }> = ({ size, stroke }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
  >
    <path d={DEMO_ICON_PATH} />
  </svg>
);

export const IconsTokenList: React.FC<TokenListProps> = ({ tokens, onChange, onCopy }) => {
  const getVal = (id: string) => tokens.find((t) => t.id === id)?.value ?? "";

  const previewStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid var(--aqb-border)",
    marginBottom: 8,
    color: "var(--aqb-text-primary)",
  };

  const styleToken = tokens.find((t) => t.id === "icon-style");
  const otherTokens = tokens.filter((t) => t.id !== "icon-style");

  return (
    <div style={tokenGridStyles}>
      <Section title="Live Preview" icon="◈" defaultOpen={true}>
        <div style={previewStyle}>
          <DemoIcon size={getVal("icon-size-sm")} stroke={getVal("icon-stroke")} />
          <DemoIcon size={getVal("icon-size-md")} stroke={getVal("icon-stroke")} />
          <DemoIcon size={getVal("icon-size-lg")} stroke={getVal("icon-stroke")} />
          <div style={{ fontSize: 10, color: "var(--aqb-text-muted)" }}>SM / MD / LG</div>
        </div>
      </Section>

      {styleToken && (
        <div style={tokenRowStyles}>
          <div style={tokenInfoStyles}>
            <div style={tokenNameStyles}>{styleToken.name}</div>
          </div>
          <select
            value={styleToken.value}
            onChange={(e) => onChange(styleToken.id, e.target.value)}
            style={{
              ...valueInputStyles,
              cursor: "pointer",
            }}
          >
            {(styleToken.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button onClick={() => onCopy(styleToken.id)} style={copyBtnStyles} title="Copy">
            <CopyIcon />
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {otherTokens.map((token) => (
          <TokenRow key={token.id} token={token} onChange={onChange} onCopy={onCopy} />
        ))}
      </div>

      <div style={fontHintStyles}>Icon style affects SVG components using design tokens</div>
    </div>
  );
};
