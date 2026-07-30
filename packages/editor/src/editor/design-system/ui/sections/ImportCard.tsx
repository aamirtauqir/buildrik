/**
 * ImportCard (S5) — drop-zone UI + conflict resolution per prototype s05.
 *
 * Flow:
 *   1. Idle  → drop zone (drag-and-drop / click-to-browse) + secondary
 *      "or paste JSON" expander.
 *   2. Parsed → RECENT detail block (Detected / Valid / Errors / Conflicts).
 *      When conflicts > 0 the Resolve section surfaces 3 strategy buttons.
 *   3. Action row → "Apply N valid only" (cobalt) + Cancel.
 *
 * Apply path still stages tokens through useImportTokens which routes each
 * token to the correct registry's updateToken (modify) or addToken (new).
 * That marks the registry dirty, which surfaces in the global Apply Changes
 * footer the same way as inline token edits.
 *
 * Conflict resolution is local to this component — strategy state filters
 * the staged token set before calling useImportTokens:
 *   - replace          → all incoming tokens (existing-id rows update in place)
 *   - merge-keep-mine  → only NEW ids (skip existing-id rows)
 *   - merge-keep-theirs → all incoming tokens (same as replace for v1)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input } from "@/editor/ui";
import { useToast } from "@/editor/ui";
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
import { Button, Textarea } from "flowbite-react";

type ConflictStrategy = "replace" | "keep-mine" | "keep-theirs";

interface ParsedState {
  rawSource: string;
  fileName: string | null;
  detected: string;
  tokens: DesignToken[];
  diff: DiffResult;
  errors: string[];
}

const cardStyle: React.CSSProperties = {
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: 8,
  padding: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 8,
  color: "var(--bk-ink)",
};

const dropZoneBaseStyle: React.CSSProperties = {
  border: "1.5px dashed var(--bk-border)",
  borderRadius: 8,
  padding: "32px 16px",
  textAlign: "center",
  cursor: "pointer",
  background: "var(--bk-bg-subtle, transparent)",
  color: "var(--bk-ink-soft)",
  fontSize: 12,
  lineHeight: 1.55,
  transition: "border-color 120ms ease, background 120ms ease",
};

const dropZoneActiveStyle: React.CSSProperties = {
  ...dropZoneBaseStyle,
  borderColor: "var(--bk-accent)",
  background: "rgba(45,109,255,0.06)",
};

const detailBlockStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 12,
};

const detailKeyStyle: React.CSSProperties = {
  color: "var(--bk-ink-muted)",
};

const detailValueStyle: React.CSSProperties = {
  fontFamily: "var(--bk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 11,
  textAlign: "right",
  color: "var(--bk-ink)",
};

const recentLabelStyle: React.CSSProperties = {
  marginTop: 12,
  fontFamily: "var(--bk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--bk-ink-muted)",
};

const conflictBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "rgba(245,158,11,0.08)",
  border: "1px solid rgba(245,158,11,0.4)",
  borderRadius: 6,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const conflictBtnRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const strategyBtnStyle = (selected: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  background: selected ? "var(--bk-accent)" : "transparent",
  color: selected ? "#fff" : "var(--bk-ink)",
  border: `1px solid ${selected ? "var(--bk-accent)" : "var(--bk-border)"}`,
  borderRadius: 6,
  fontSize: 11,
  cursor: "pointer",
});

const actionRowStyle: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const applyBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 14px",
  background: "var(--bk-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  color: "var(--bk-ink)",
  border: "1px solid var(--bk-border)",
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
  color: "var(--bk-ink)",
  fontSize: 12,
};

const pasteAreaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 100,
  marginTop: 6,
  padding: 8,
  background: "var(--bk-bg-subtle)",
  color: "var(--bk-ink-soft)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  fontFamily: "var(--bk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 11,
  lineHeight: 1.55,
  boxSizing: "border-box",
  resize: "vertical",
};

const pasteSubmitStyle: React.CSSProperties = {
  marginTop: 6,
  padding: "5px 10px",
  background: "transparent",
  color: "var(--bk-ink)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  fontSize: 11,
  cursor: "pointer",
};

/**
 * Cheap heuristic — peek at first ~200 chars to label the file format in the
 * detail block. Parsing still routes through parseImportJSON (JSON only), so
 * unsupported formats (Tailwind .ts AST) currently surface as parse errors.
 */
function detectFormat(raw: string, fileName: string | null): string {
  const head = raw.slice(0, 200);
  if (fileName?.endsWith(".ts") || fileName?.endsWith(".js")) {
    return "Tailwind config (AST)";
  }
  if (/^\s*module\.exports|^\s*export\s+default/m.test(head)) {
    return "Tailwind config (AST)";
  }
  if (/"\$type"|"\$value"/.test(head)) {
    return "Tokens Studio JSON";
  }
  if (/"collections"\s*:|"modes"\s*:/.test(head)) {
    return "Figma Variables JSON";
  }
  if (/^\s*[[{]/.test(head)) {
    return "Design tokens JSON";
  }
  return "Unknown format";
}

export const ImportCard: React.FC = () => {
  const [parsed, setParsed] = React.useState<ParsedState | null>(null);
  const [showPaste, setShowPaste] = React.useState(false);
  const [pasteBuffer, setPasteBuffer] = React.useState("");
  const [strategy, setStrategy] = React.useState<ConflictStrategy>("replace");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
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

  const ingestRaw = (raw: string, fileName: string | null) => {
    setParseErrors([]);
    const parsedJson = parseImportJSON(raw);
    if (parsedJson.errors.length > 0) {
      setParseErrors(parsedJson.errors);
      setParsed(null);
      return;
    }
    const diff = diffTokens(allTokens, parsedJson.tokens);
    setParsed({
      rawSource: raw,
      fileName,
      detected: detectFormat(raw, fileName),
      tokens: parsedJson.tokens,
      diff,
      errors: [],
    });
    setStrategy("replace");
    setShowPaste(false);
    setPasteBuffer("");
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    ingestRaw(text, file.name);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleCancel = () => {
    setParsed(null);
    setParseErrors([]);
    setStrategy("replace");
    setShowPaste(false);
    setPasteBuffer("");
  };

  const handleApply = () => {
    if (!parsed) return;
    // Strategy filters the staged token set. `replace` and `keep-theirs` send
    // everything; `keep-mine` skips tokens whose id is already in any registry.
    const toApply: DesignToken[] =
      strategy === "keep-mine"
        ? parsed.tokens.filter((t) => parsed.diff.added.some((a) => a.id === t.id))
        : parsed.tokens;

    if (toApply.length === 0) {
      addToast({ description: "Nothing to apply", tone: "info" });
      return;
    }

    const stats = apply(toApply);
    addToast({
      description: `Imported · ${stats.modified} modified · ${stats.added} added${stats.skipped.length ? ` · ${stats.skipped.length} skipped` : ""}`,
      tone: "success",
    });
    handleCancel();
  };

  const conflictCount = parsed?.diff.modified.length ?? 0;
  const validCount = parsed ? parsed.diff.added.length + parsed.diff.modified.length : 0;
  const applyCount = strategy === "keep-mine"
    ? (parsed?.diff.added.length ?? 0)
    : validCount;

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Import tokens</div>

      {!parsed && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop tokens.json or tailwind.config.ts, or click to browse"
            data-testid="import-drop-zone"
            style={isDragOver ? dropZoneActiveStyle : dropZoneBaseStyle}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div style={{ fontWeight: 500, color: "var(--bk-ink)", marginBottom: 4 }}>
              Drop tokens.json or tailwind.config.ts
            </div>
            <div style={{ color: "var(--bk-ink-muted)" }}>
              or click to browse
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,.ts,.js"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
              aria-label="Upload JSON file"
            />
          </div>

          <Button
            type="button"
            color="light"
            size="xs"
            onClick={() => setShowPaste((v) => !v)}
            style={{
              marginTop: 8,
              padding: 0,
              background: "transparent",
              border: "none",
              color: "var(--bk-ink-muted)",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            aria-expanded={showPaste} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            or paste JSON
          </Button>

          {showPaste && (
            <div>
              <label>
                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                  Paste JSON
                </span>
                <Textarea
                  aria-label="Paste JSON"
                  value={pasteBuffer}
                  onChange={(e) => setPasteBuffer(e.target.value)}
                  placeholder='[{"id": "color-brand", "value": "#0055FF", ...}]'
                  style={pasteAreaStyle}
                />
              </label>
              <Button
                type="button"
                onClick={() => ingestRaw(pasteBuffer, null)}
                style={pasteSubmitStyle}
                disabled={!pasteBuffer.trim()}
              >
                Parse
              </Button>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div style={errorStyle} role="alert">
              {parseErrors.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          )}
        </>
      )}

      {parsed && (
        <>
          <div style={recentLabelStyle}>RECENT</div>
          <div style={detailBlockStyle} data-testid="import-detail-block">
            <div style={detailRowStyle}>
              <span style={detailKeyStyle}>Detected</span>
              <span style={detailValueStyle}>{parsed.detected}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailKeyStyle}>Valid tokens</span>
              <span style={{ ...detailValueStyle, color: "var(--bk-ink-muted)" }}>
                {parsed.tokens.length}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailKeyStyle}>Errors</span>
              <span style={{
                ...detailValueStyle,
                color: parsed.errors.length > 0 ? "var(--bk-ink-muted)" : "var(--bk-ink-muted)",
              }}>
                {parsed.errors.length === 0
                  ? "0"
                  : `${parsed.errors.length} (${parsed.errors[0]})`}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailKeyStyle}>Conflicts</span>
              <span style={{
                ...detailValueStyle,
                color: conflictCount > 0 ? "var(--bk-ink-muted)" : "var(--bk-ink-muted)",
              }}>
                {conflictCount === 0
                  ? "0"
                  : `${conflictCount} ID collisions`}
              </span>
            </div>
          </div>

          {conflictCount > 0 && (
            <div style={conflictBoxStyle} data-testid="import-resolve-box">
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--bk-ink)" }}>
                Resolve conflicts
              </div>
              <div style={{ fontSize: 11, color: "var(--bk-ink-muted)" }}>
                {conflictCount} tokens already exist with the same ID. Choose how to handle them:
              </div>
              <div style={conflictBtnRowStyle}>
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  onClick={() => setStrategy("replace")}
                  style={strategyBtnStyle(strategy === "replace")}
                  aria-pressed={strategy === "replace"}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  onClick={() => setStrategy("keep-mine")}
                  style={strategyBtnStyle(strategy === "keep-mine")}
                  aria-pressed={strategy === "keep-mine"}
                >
                  Merge · keep mine
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  onClick={() => setStrategy("keep-theirs")}
                  style={strategyBtnStyle(strategy === "keep-theirs")}
                  aria-pressed={strategy === "keep-theirs"}
                >
                  Merge · keep theirs
                </Button>
              </div>
            </div>
          )}

          <div style={actionRowStyle}>
            <Button
              type="button"
              onClick={handleApply}
              style={applyBtnStyle}
              disabled={applyCount === 0}
            >
              Apply {applyCount} valid only
            </Button>
            <Button
              type="button"
              color="light"
              onClick={handleCancel}
              style={cancelBtnStyle}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
