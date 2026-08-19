/**
 * TypeTokenList v11 — Type tab pane
 * Shows font families, type scale, and responsive preview.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ResponsiveMode } from "../../state/useTypeTokens";
import type { DesignToken } from "../../types";
import { TokenUsageChip } from "../sections/TokenUsageChip";
import { Button, Select, TextInput } from "@/editor/chrome-ui";

export interface TypeTokenListProps {
  tokens: DesignToken[];
  responsiveMode: ResponsiveMode;
  onTokenChange: (id: string, value: string) => void;
  onResponsiveModeChange: (mode: ResponsiveMode) => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
  onRedo: (id: string) => void;
  canRedo: (id: string) => boolean;
  /** T7 coverage: per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
  /** T8: row click → drill-in detail. Wired to each row's name/label area
   *  so it doesn't fight with the inline size input + B/I toggles. */
  onRowClick?: (tokenId: string) => void;
}

// ─── Icon buttons ─────────────────────────────────────────────────────────────

/** Preview-only shrink for the mobile specimen rows. */
const MOBILE_SPECIMEN_SCALE = 0.85;

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

/* Five `rgba(255,255,255,0.0x)` values in this file were dark-theme leftovers:
   white at 3-5% opacity on a white panel is nothing at all, so the type-scale
   and font rows had no visible separator and two controls had no visible fill.
   Real tokens now. */
const ROW = "tw:flex tw:items-center tw:gap-2 tw:py-2 tw:border-b tw:border-gray-200";
const ROW_NAME = "tw:text-xs tw:font-medium tw:text-gray-900";
const ROW_ID = "tw:text-xs tw:text-gray-500 tw:mt-px";
const MUTED = "tw:text-xs tw:text-gray-500 tw:flex-none";
const MODE_BTN = "tw:flex tw:items-center tw:gap-1.5 tw:px-2.5 tw:py-1.5 tw:text-xs";

const StyleToggle: React.FC<{
  label: string;
  active: boolean;
  onToggle: () => void;
  /** How the letter itself is drawn — B is bold, I is italic. Static per
   *  button, not derived from the token. */
  labelClass?: string;
}> = ({ label, active, onToggle, labelClass }) => (
  <Button
    color="light"
    size="xs"
    onClick={onToggle}
    aria-pressed={active}
    className={`${labelClass ?? ""} tw:size-6 tw:flex tw:items-center tw:justify-center tw:rounded tw:text-xs tw:font-bold tw:border ${
      active
        ? "tw:border-blue-700 tw:bg-[var(--bk-accent-tint)] tw:text-blue-700"
        : "tw:border-gray-200 tw:bg-transparent tw:text-gray-500"
    }`}
    title={`Toggle ${label}`}
  >
    {label}
  </Button>
);

// ─── Type scale row ───────────────────────────────────────────────────────────

const TYPE_SCALE_NAMES: Record<string, { semantic: string; previewText: string }> = {
  "font-size-xs": { semantic: "Caption", previewText: "Caption text XS" },
  "font-size-sm": { semantic: "Caption", previewText: "Caption text" },
  "font-size-base": { semantic: "Body", previewText: "Body text" },
  "font-size-lg": { semantic: "Body LG", previewText: "Body large text" },
  "font-size-xl": { semantic: "Sub-heading", previewText: "Sub-heading text" },
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
  usageCount: number;
  onRowClick?: (tokenId: string) => void;
}

const TypeScaleRow: React.FC<TypeScaleRowProps> = ({
  token,
  onChange,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  usageCount,
  onRowClick,
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
      className={ROW}
    >
      {/* Semantic label */}
      <div
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={onRowClick ? () => onRowClick(token.id) : undefined}
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(token.id);
                }
              }
            : undefined
        }
        className={`tw:w-16 tw:flex-none ${onRowClick ? "tw:cursor-pointer" : ""}`}
      >
        <div className={ROW_NAME}>{info?.semantic ?? token.name}</div>
        <div className={ROW_ID}>{token.id}</div>
      </div>

      {/* Size input */}
      <TextInput
        type="number"
        value={size}
        min={1}
        max={200}
        step={1}
        onChange={handleSizeInput}
        className="tw:w-11 tw:text-right tw:flex-none"
      />
      <span className={MUTED}>{unit}</span>

      {/* Style toggles */}
      <div className="tw:flex tw:gap-[3px]">
        <StyleToggle
          label="B"
          active={bold}
          onToggle={() => setBold((v) => !v)}
          labelClass="tw:font-extrabold"
        />
        <StyleToggle
          label="I"
          active={italic}
          onToggle={() => setItalic((v) => !v)}
          labelClass="tw:italic"
        />
      </div>

      {/* Preview */}
      <div
        style={{
          flex: 1,
          fontSize: token.value,
          fontWeight: bold ? 700 : 400,
          fontStyle: italic ? "italic" : "normal",
          color: "var(--bk-ink-soft)",
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
          className="tw:text-[var(--bk-warning)] tw:text-xs tw:flex-none"
        >
          ⚠
        </span>
      )}

      {/* Undo button */}
      {canUndo && (
        <Button
          color="light"
          size="xs"
          onClick={() => onUndo(token.id)}
          title="Undo"
          className="tw:border-transparent tw:bg-transparent tw:p-1 tw:text-[13px] tw:flex-none tw:text-[var(--bk-warning)]"
        >
          ↩
        </Button>
      )}

      {/* Redo button */}
      {canRedo && (
        <Button
          color="light"
          size="xs"
          onClick={() => onRedo(token.id)}
          title="Redo"
          className="tw:border-transparent tw:bg-transparent tw:p-1 tw:text-[13px] tw:flex-none tw:text-[var(--bk-accent)]"
        >
          ↪
        </Button>
      )}

      {/* Usage chip */}
      <div className="tw:flex-none">
        <TokenUsageChip count={usageCount} />
      </div>
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
  usageCount: number;
  onRowClick?: (tokenId: string) => void;
}

const FontFamilyRow: React.FC<FontRowProps> = ({ token, onChange, usageCount, onRowClick }) => {
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
      className={ROW}
    >
      <div
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={onRowClick ? () => onRowClick(token.id) : undefined}
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(token.id);
                }
              }
            : undefined
        }
        className={`tw:flex-1 ${onRowClick ? "tw:cursor-pointer" : ""}`}
      >
        <div className={ROW_NAME}>
          {token.name}
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: token.value,
            color: "var(--bk-ink-muted)",
            marginTop: 2,
          }}
        >
          Aa Bb Cc 123
        </div>
        {fontLoadFailed && (
          <div className="tw:text-xs tw:text-[var(--bk-warning)] tw:mt-0.5">
            Font unavailable — may fall back to system font
          </div>
        )}
      </div>
      <Select
        value={token.value}
        onChange={(e) => onChange(token.id, e.target.value)}
        className="tw:cursor-pointer"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
        {!FONT_OPTIONS.includes(token.value) && <option value={token.value}>{token.value}</option>}
      </Select>
      <div className="tw:flex-none">
        <TokenUsageChip count={usageCount} />
      </div>
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
      // Specimen-only: 85% of the token, to show how the scale reads narrow.
      // No rule anywhere applies this to a real page.
      return `${Math.round(parseFloat(token.value) * MOBILE_SPECIMEN_SCALE)}px`;
    }
    return token.value;
  };

  return (
    <div
      className="tw:p-3 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-gray-200 tw:flex tw:flex-col tw:gap-2"
    >
      <div
        style={{
          fontFamily: headingFont,
          fontSize: getSize("font-size-4xl"),
          fontWeight: 700,
          color: "var(--bk-ink)",
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
          color: "var(--bk-ink)",
          lineHeight: 1.2,
        }}
      >
        Heading 2
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: getSize("font-size-base"),
          color: "var(--bk-ink-soft)",
          lineHeight: 1.6,
        }}
      >
        Body text — the quick brown fox jumps over the lazy dog.
      </div>
      <div
        className="tw:text-xs tw:text-gray-500 tw:text-right tw:tracking-[0.3px]"
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
  color: "var(--bk-ink-muted)",
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
  usageByTokenId,
  onRowClick,
}) => {
  const fontTokens = tokens.filter((t) => t.type === "font-family");
  const sizeTokens = tokens.filter((t) => t.type === "font-size");

  return (
    <div className="tw:flex tw:flex-col">
      {/* Device hint */}
      <div
        className="tw:text-xs tw:text-gray-500 tw:mb-1.5 tw:leading-normal"
      >
        One type scale for the whole site. The toggle below previews how it
        reads on a narrow screen; it does not set separate mobile sizes.
      </div>

      {/* Responsive toggle */}
      <div
        className="tw:flex tw:gap-1 tw:mb-2"
        /* Was "font sizes scale automatically for mobile", which nothing does:
           the 0.85 below is applied to the specimen text in this panel and
           nowhere else — not in the engine, not in the exported CSS. Per-screen
           sizes come from selecting an element and setting its size at that
           breakpoint, which is a different control and does work. */
        title="Preview only. The site does not resize type by itself — for a different size on phones, select the element and set it at the Mobile breakpoint."
      >
        <Button
          size="xs"
          onClick={() => onResponsiveModeChange("desktop")}
          title="Desktop preview"
          aria-pressed={responsiveMode === "desktop"}
          color={responsiveMode === "desktop" ? undefined : "light"}
          className={MODE_BTN}
        >
          <DesktopIcon />
          Desktop preview
        </Button>
        <Button
          size="xs"
          onClick={() => onResponsiveModeChange("mobile")}
          title="Mobile preview"
          aria-pressed={responsiveMode === "mobile"}
          color={responsiveMode === "mobile" ? undefined : "light"}
          className={MODE_BTN}
        >
          <MobileIcon />
          Mobile preview (85%)
        </Button>
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
            <FontFamilyRow
              key={token.id}
              token={token}
              onChange={onTokenChange}
              usageCount={usageByTokenId?.get(token.id) ?? 0}
              onRowClick={onRowClick}
            />
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
              usageCount={usageByTokenId?.get(token.id) ?? 0}
              onRowClick={onRowClick}
            />
          ))}
        </>
      )}
    </div>
  );
};
