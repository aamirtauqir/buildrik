/**
 * ImportCard (S5) — paste/upload + diff preview + Apply.
 *
 * Apply path stages tokens through useImportTokens which routes each token
 * to the correct registry's updateToken (modify) or addToken (new). That
 * marks the registry dirty, which surfaces in the global Apply Changes
 * footer the same way as inline token edits — keeping the import flow
 * inside the existing ReviewModal pipeline.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { useToast } from "@/editor/shared/vibcoder";
import { parseImportJSON, diffTokens, type DiffResult } from "../../utils/importUtils";
import { useImportTokens } from "../../state/useImportTokens";
import {
  useColorRegistry, useTypeRegistry, useSpacingRegistry,
  useRadiusRegistry, useShadowRegistry, useMotionRegistry,
  useBorderRegistry, useOpacityRegistry, useZindexRegistry,
  useBreakpointRegistry, useGridRegistry, useSizingRegistry,
  useIconRegistry, useImageryRegistry,
} from "../../state/TokenRegistryContext";
import type { DesignToken } from "../../types";

const cardStyle: React.CSSProperties = {
  background: "var(--bd-bg-subtle)",
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  padding: 12,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: 8,
  background: "var(--bd-bg-canvas, #0e0e10)",
  color: "var(--bd-fg-secondary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  fontFamily: "var(--bd-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 11,
  lineHeight: 1.55,
  boxSizing: "border-box",
  resize: "vertical",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
  flexWrap: "wrap",
};

const previewBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "transparent",
  color: "var(--bd-fg-primary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

const applyBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "var(--bd-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 8,
  borderRadius: 6,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.4)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
};

const summaryRowStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 6,
  background: "rgba(45,109,255,0.08)",
  border: "1px solid rgba(45,109,255,0.3)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

interface PreviewState {
  tokens: DesignToken[];
  diff: DiffResult;
}

export const ImportCard: React.FC = () => {
  const [raw, setRaw] = React.useState("");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [preview, setPreview] = React.useState<PreviewState | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const apply = useImportTokens();
  const { addToast } = useToast();

  // Snapshot of the union of current tokens — drives the diff calc. Reading
  // each registry separately so React invalidates on any kind change.
  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();
  const allTokens: DesignToken[] = React.useMemo(
    () => [
      ...color.tokens, ...type.tokens, ...spacing.tokens,
      ...radius.tokens, ...shadow.tokens, ...motion.tokens,
      ...border.tokens, ...opacity.tokens, ...zindex.tokens,
      ...breakpoint.tokens, ...grid.tokens, ...sizing.tokens,
      ...icon.tokens, ...imagery.tokens,
    ],
    [
      color.tokens, type.tokens, spacing.tokens,
      radius.tokens, shadow.tokens, motion.tokens,
      border.tokens, opacity.tokens, zindex.tokens,
      breakpoint.tokens, grid.tokens, sizing.tokens,
      icon.tokens, imagery.tokens,
    ],
  );

  const handlePreview = () => {
    setErrors([]);
    setPreview(null);
    const parsed = parseImportJSON(raw);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
      return;
    }
    setPreview({ tokens: parsed.tokens, diff: diffTokens(allTokens, parsed.tokens) });
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
    // Auto-preview after upload — saves a click.
    const parsed = parseImportJSON(text);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
      setPreview(null);
      return;
    }
    setErrors([]);
    setPreview({ tokens: parsed.tokens, diff: diffTokens(allTokens, parsed.tokens) });
  };

  const handleApply = () => {
    if (!preview) return;
    const stats = apply(preview.tokens);
    addToast({
      description: `Imported · ${stats.modified} modified · ${stats.added} added${stats.skipped.length ? ` · ${stats.skipped.length} skipped` : ""}`,
      tone: "success",
    });
    setPreview(null);
    setRaw("");
  };

  const totalChanges = preview ? preview.diff.added.length + preview.diff.modified.length : 0;

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--bd-fg-primary)" }}>
        Import tokens
      </div>
      <div style={{ fontSize: 12, color: "var(--bd-fg-muted)", marginBottom: 8 }}>
        Paste a JSON token file or upload one. Imports stage as unsaved changes —
        review them in the footer before applying.
      </div>
      <label style={{ display: "block" }}>
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          Paste JSON
        </span>
        <textarea
          aria-label="Paste JSON"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='[{"id": "color-brand", "value": "#0055FF", ...}]'
          style={textareaStyle}
        />
      </label>

      <div style={buttonRowStyle}>
        <button onClick={handlePreview} style={previewBtnStyle} disabled={!raw.trim()}>
          Preview
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={previewBtnStyle}
        >
          Upload .json
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          aria-label="Upload JSON file"
        />
      </div>

      {errors.length > 0 && (
        <div style={errorStyle} role="alert">
          {errors.map((msg, i) => <div key={i}>{msg}</div>)}
        </div>
      )}

      {preview && (
        <div style={summaryRowStyle}>
          <div>
            <strong>{preview.diff.added.length} added</strong>
            <span style={{ margin: "0 6px", color: "var(--bd-fg-muted)" }}>·</span>
            <strong>{preview.diff.modified.length} modified</strong>
            {totalChanges === 0 && (
              <span style={{ marginLeft: 6, color: "var(--bd-fg-muted)" }}>
                — nothing to apply
              </span>
            )}
          </div>
          {totalChanges > 0 && (
            <details>
              <summary style={{ cursor: "pointer", color: "var(--bd-accent)" }}>Show details</summary>
              <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
                {preview.diff.added.map((t) => (
                  <li key={`a-${t.id}`}>+ {t.id} · {t.value}</li>
                ))}
                {preview.diff.modified.map((m) => (
                  <li key={`m-${m.id}`}>~ {m.id} · {m.previousValue} → {m.nextValue}</li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={handleApply} style={applyBtnStyle} disabled={totalChanges === 0}>
            Apply Import
          </button>
        </div>
      )}
    </div>
  );
};
