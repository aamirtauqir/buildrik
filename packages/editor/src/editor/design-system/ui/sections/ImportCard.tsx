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
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useToast, Button, Textarea, TextInput } from "@/editor/chrome-ui";
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
/* Was `"replace" | "keep-mine" | "keep-theirs"`. `handleApply` filtered on
   "keep-mine" and sent everything otherwise, so Replace and "Merge · keep
   theirs" were the SAME branch — this file's own header said "same as replace
   for v1". Three buttons, two outcomes, and nothing on screen said so. Giving
   Replace its distinct meaning (drop tokens absent from the import) is a
   destructive operation that would need a warning and an undo path; two honest
   buttons is the smaller true thing. */
type ConflictStrategy = "replace" | "keep-mine";

interface ParsedState {
  rawSource: string;
  fileName: string | null;
  detected: string;
  tokens: DesignToken[];
  diff: DiffResult;
  errors: string[];
}

/* Board 153:120 gives IMPORT the same plain section header + full-bleed
   treatment as EXPORT — no card, no second inset. */
const CARD = "tw:flex tw:flex-col";
/* Board 220:839 · 28-tall caps header, matching EXPORT. */
const TITLE =
  "tw:flex tw:h-7 tw:items-center tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] " +
  "tw:text-[var(--bk-ink-muted)]";
/* base/active supply their own border-colour and background together — never
   two competing utilities for the same property (Row precedent). */
/* Board 153:152 · a 56-tall dashed band with ONE centred line, not the 128
   the 32-pixel padding was producing (and not the two-line "or click to
   browse" hint the row used to carry — the whole zone is still clickable,
   the board just doesn't spell that out). `h-14` fixes the 56px directly
   instead of reaching it through padding + line count. */
const DROP_BASE =
  "tw:flex tw:h-14 tw:items-center tw:justify-center tw:border-[1.5px] tw:border-dashed tw:rounded-lg " +
  "tw:px-4 tw:text-center tw:cursor-pointer tw:text-[var(--bk-ink-soft)] tw:text-xs " +
  "tw:[transition:var(--bk-transition-fast)]";
const DROP_IDLE = "tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-gray-50)]";
const DROP_ACTIVE = "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)]";
const DETAIL_BLOCK =
  "tw:mt-3 tw:p-3 tw:bg-[var(--bk-gray-50)] tw:border tw:border-[var(--bk-gray-200)] tw:rounded-md tw:flex tw:flex-col tw:gap-1.5";
const DETAIL_ROW = "tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:text-xs";
const DETAIL_KEY = "tw:text-[var(--bk-ink-muted)]";
const DETAIL_VALUE = "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:text-right tw:text-[var(--bk-ink)]";
const RECENT_LABEL =
  "tw:mt-3 tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-11)] tw:uppercase tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";
const CONFLICT_BOX =
  "tw:mt-3 tw:p-3 tw:bg-[var(--bk-warning-tint)] tw:border tw:border-yellow-200 tw:rounded-md tw:flex tw:flex-col tw:gap-2";
const ERROR_BOX =
  "tw:mt-2 tw:p-2 tw:rounded-md tw:bg-[var(--bk-error-tint)] tw:border tw:border-red-200 tw:text-[var(--bk-ink)] tw:text-xs";
const PASTE_AREA =
  "tw:w-full tw:min-h-25 tw:mt-1.5 tw:bg-[var(--bk-gray-50)] tw:[font-family:var(--bk-font-mono)] tw:text-[11px] " +
  "tw:leading-relaxed tw:resize-y";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

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

export interface ImportCardProps {
  /** Board 306:2265 / 306:2298 put an "Imported tokens" / "Import failed" badge
   *  under the back row. The badge belongs to the screen frame this card sits
   *  inside, so the outcome is reported upward rather than drawn here. */
  onOutcome?(outcome: "imported" | "import-failed"): void;
}

export const ImportCard: React.FC<ImportCardProps> = ({ onOutcome }) => {
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
      /* Board 306:2298. The card already showed the error detail inline; what
         it had no way to say was that the SCREEN is in a failed state, which is
         what the badge under the back row is for. */
      onOutcome?.("import-failed");
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
    // Strategy filters the staged token set: `replace` sends everything,
    // `keep-mine` skips tokens whose id is already in any registry.
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
      /* `ImportStats.skipped` has always carried the ids; the toast reported
         only its length, so "2 skipped" named nothing the user could act on. */
      description:
        `Imported · ${stats.modified} modified · ${stats.added} added` +
        (stats.skipped.length ? ` · skipped ${stats.skipped.join(", ")}` : ""),
      tone: "success",
    });
    onOutcome?.("imported");
    handleCancel();
  };

  const conflictCount = parsed?.diff.modified.length ?? 0;
  const validCount = parsed ? parsed.diff.added.length + parsed.diff.modified.length : 0;
  const applyCount = strategy === "keep-mine"
    ? (parsed?.diff.added.length ?? 0)
    : validCount;

  return (
    <div className={CARD}>
      <div className={TITLE}>IMPORT</div>

      {!parsed && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop tokens.json or tailwind.config.ts, or click to browse"
            data-testid="import-drop-zone"
            className={`${DROP_BASE} ${isDragOver ? DROP_ACTIVE : DROP_IDLE}`}
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
            {/* Board 153:120/153:152 draw one centred line: "Drop .json or
                .ts". The zone stays clickable (aria-label below keeps the
                fuller, accurate hint for assistive tech). */}
            Drop .json or .ts
            <TextInput
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,.ts,.js"
              className="tw:hidden"
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
            aria-expanded={showPaste}
            className={`${GHOST} tw:mt-2 tw:p-0 tw:text-[11px] tw:underline`}
          >
            or paste JSON
          </Button>

          {showPaste && (
            <div>
              <label>
                <span className="tw:sr-only">
                  Paste JSON
                </span>
                <Textarea
                  aria-label="Paste JSON"
                  value={pasteBuffer}
                  onChange={(e) => setPasteBuffer(e.target.value)}
                  placeholder='[{"id": "color-brand", "value": "#0055FF", ...}]'
                  className={PASTE_AREA}
                />
              </label>
              <Button
                type="button"
                onClick={() => ingestRaw(pasteBuffer, null)}
                color="light"
                size="xs"
                className="tw:mt-1.5"
                disabled={!pasteBuffer.trim()}
              >
                Parse
              </Button>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className={ERROR_BOX} role="alert">
              {parseErrors.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          )}
        </>
      )}

      {parsed && (
        <>
          <div className={RECENT_LABEL}>RECENT</div>
          <div className={DETAIL_BLOCK} data-testid="import-detail-block">
            <div className={DETAIL_ROW}>
              <span className={DETAIL_KEY}>Detected</span>
              <span className={DETAIL_VALUE}>{parsed.detected}</span>
            </div>
            <div className={DETAIL_ROW}>
              <span className={DETAIL_KEY}>Valid tokens</span>
              <span className={`${DETAIL_VALUE} tw:text-[var(--bk-ink-muted)]`}>
                {parsed.tokens.length}
              </span>
            </div>
            <div className={DETAIL_ROW}>
              <span className={DETAIL_KEY}>Errors</span>
              {/* This carried a ternary whose branches were the same colour. */}
              <span className={`${DETAIL_VALUE} tw:text-[var(--bk-ink-muted)]`}>
                {parsed.errors.length === 0
                  ? "0"
                  : `${parsed.errors.length} (${parsed.errors[0]})`}
              </span>
            </div>
            <div className={DETAIL_ROW}>
              <span className={DETAIL_KEY}>Conflicts</span>
              <span className={`${DETAIL_VALUE} tw:text-[var(--bk-ink-muted)]`}>
                {conflictCount === 0
                  ? "0"
                  : `${conflictCount} ID collisions`}
              </span>
            </div>
          </div>

          {conflictCount > 0 && (
            <div className={CONFLICT_BOX} data-testid="import-resolve-box">
              <div className="tw:text-xs tw:font-medium tw:text-[var(--bk-ink)]">
                Resolve conflicts
              </div>
              <div className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
                {conflictCount} tokens already exist with the same ID. Choose how to handle them:
              </div>
              <div className="tw:flex tw:gap-1.5 tw:flex-wrap">
                <Button
                  type="button"
                  size="xs"
                  color={strategy === "replace" ? undefined : "light"}
                  aria-pressed={strategy === "replace"}
                  onClick={() => setStrategy("replace")}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  size="xs"
                  color={strategy === "keep-mine" ? undefined : "light"}
                  aria-pressed={strategy === "keep-mine"}
                  onClick={() => setStrategy("keep-mine")}
                >
                  Merge · keep mine
                </Button>
              </div>
            </div>
          )}

          <div className="tw:mt-3 tw:flex tw:gap-2 tw:items-center">
            <Button
              type="button"
              onClick={handleApply}
              className="tw:flex-1"
              disabled={applyCount === 0}
            >
              Apply {applyCount} valid only
            </Button>
            <Button
              type="button"
              color="light"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
