/**
 * ImportCard — Brand › Import / export › Import, Figma 2L9 B6-B15/B16/B17/B49.
 *
 *   idle     "Import tokens" · Choose JSON file (or drop it, or paste JSON) ·
 *            "Review compatible values and changes before applying." · the
 *            mode: Update matching ("Matching values update. Tokens absent
 *            from the file are kept.") or Add new only (code-ahead)
 *   dry run  "{n} detected · {v} valid · {u} unsupported", Added / Modified /
 *            Skipped / Unsupported, "Preview only · Nothing has been applied",
 *            Cancel · Apply {v} valid
 *   offline  "Apply with local recovery only?" — no server restore point; the
 *            one Undo still reverts it (B6-B17)
 *   applied  the same rows as a result, "Applied {n} of {d}, as shown in the
 *            preview." + the receipt with Undo (B6-B49)
 *
 * Apply takes a "Before import" restore point first (online), then writes the
 * tokens through useImportTokens — one write, one ⌘Z, live at once.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useToast, Button, Modal, Textarea, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { useOnline } from "@/editor/design-system/state/useOnline";
import { parseImportJSON, diffTokens, type DiffResult } from "@/editor/design-system/utils/importUtils";
import { useImportTokens } from "@/editor/design-system/state/useImportTokens";
import {
  useColorRegistry, useTypeRegistry, useSpacingRegistry,
  useRadiusRegistry, useShadowRegistry, useMotionRegistry,
  useBorderRegistry, useOpacityRegistry, useZindexRegistry,
  useBreakpointRegistry, useGridRegistry, useSizingRegistry,
  useIconRegistry, useImageryRegistry, useProjectTokenStore,
} from "@/editor/design-system/state/TokenRegistryContext";
import type { DesignToken } from "@/editor/design-system/types";
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

const CARD = "tw:flex tw:flex-col tw:gap-3";
const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const NOTE_STRONG = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]";
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
  /** For the "Before import" restore point; without one, no point is taken. */
  composer?: Composer | null;
}

type Result = { name: string; mode: ConflictStrategy; added: number; modified: number; skipped: number; detected: number; restorePoint: boolean };

export const ImportCard: React.FC<ImportCardProps> = ({ composer = null }) => {
  const [parsed, setParsed] = React.useState<ParsedState | null>(null);
  const [showPaste, setShowPaste] = React.useState(false);
  const [pasteBuffer, setPasteBuffer] = React.useState("");
  const [strategy, setStrategy] = React.useState<ConflictStrategy>("replace");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [offlineAsk, setOfflineAsk] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const online = useOnline();
  const guard = useGuardedApply();

  const apply = useImportTokens();
  const { undo } = useProjectTokenStore();
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
      /* G3-123: the outcome is a toast (no pill band); the card keeps the
         error detail inline. */
      addToast({ title: "Import failed", description: "Nothing was imported — the errors are listed in the card.", tone: "error" });
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

  /* Online: a "Before import" restore point first (no point → nothing is
     applied). Offline: only after "Apply locally" (B6-B17). */
  const handleApply = (local = false) =>
    guard.run(async () => {
      if (!parsed) return false;
      // Update matching sends everything; Add new only skips existing ids.
      const toApply: DesignToken[] =
        strategy === "keep-mine"
          ? parsed.tokens.filter((t) => parsed.diff.added.some((a) => a.id === t.id))
          : parsed.tokens;
      if (toApply.length === 0) {
        addToast({ description: "Nothing to apply", tone: "info" });
        return false;
      }
      if (!online && !local) {
        setOfflineAsk(true);
        return false;
      }
      setOfflineAsk(false);
      setFailed(false);
      const siteId = getSiteIdFromUrl();
      const restorePoint = !local && Boolean(composer && siteId);
      if (restorePoint && !(await takeRestorePoint(composer!, siteId!, "import"))) {
        setFailed(true);
        return false;
      }
      const stats = apply(toApply);
      if (stats.refused) {
        addToast({ title: "Import failed", description: "Nothing was imported — the brand can't be changed right now.", tone: "error" });
        return false;
      }
      /* B6-B49's receipt; its Undo is the one undo (composer.history). The
         skipped ids stay named — "2 skipped" alone named nothing to act on. */
      const imported = stats.modified + stats.added;
      addToast({
        description:
          `Imported ${imported} token${imported === 1 ? "" : "s"}. One Undo reverts the import.` +
          (stats.skipped.length ? ` Skipped ${stats.skipped.join(", ")}.` : ""),
        tone: "success",
        action: { label: "Undo", onClick: () => { undo(); } },
      });
      setResult({
        name: parsed.fileName ?? "Pasted JSON",
        mode: strategy,
        added: stats.added,
        modified: stats.modified,
        skipped: stats.skipped.length + (strategy === "keep-mine" ? parsed.diff.modified.length : 0),
        detected: parsed.tokens.length + parsed.errors.length,
        restorePoint,
      });
      handleCancel();
      return true;
    });

  const conflictCount = parsed?.diff.modified.length ?? 0;
  const validCount = parsed ? parsed.diff.added.length + parsed.diff.modified.length : 0;
  const applyCount = strategy === "keep-mine"
    ? (parsed?.diff.added.length ?? 0)
    : validCount;

  const modeLabel = (m: ConflictStrategy) => (m === "replace" ? "Update matching" : "Add new only");
  const kindsOf = (tokens: readonly DesignToken[]) => {
    const n = tokens.length;
    return `${n} token${n === 1 ? "" : "s"}`;
  };
  const rows = (r: { added: string; modified: string; skipped: string; unsupported: string }) => (
    <dl className={DETAIL_BLOCK} data-testid="import-detail-block">
      {(
        [
          ["Added", r.added],
          ["Modified", r.modified],
          ["Skipped", r.skipped],
          ["Unsupported", r.unsupported],
        ] as const
      ).map(([k, v]) => (
        <div key={k} className={DETAIL_ROW}>
          <dt className={DETAIL_KEY}>{k}</dt>
          <dd className={`${DETAIL_VALUE} tw:m-0`}>{v}</dd>
        </div>
      ))}
    </dl>
  );

  const unsupported = parsed?.errors.length ?? 0;
  const skipped = strategy === "keep-mine" ? conflictCount : 0;

  return (
    <div className={CARD} data-testid="brand-import">
      <p className={TITLE} data-testid="brand-import-head">Import tokens</p>

      {result && !parsed && (
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="import-result">
          <p className={NOTE_STRONG}>Imported {result.name} · {modeLabel(result.mode)}</p>
          {rows({
            added: `${result.added} token${result.added === 1 ? "" : "s"}`,
            modified: `${result.modified} matching token${result.modified === 1 ? "" : "s"}`,
            skipped: String(result.skipped),
            unsupported: "0",
          })}
          <p className={NOTE}>
            Applied {result.added + result.modified} of {result.detected}, as shown in the preview.
            {result.restorePoint ? " Restore point “Before import” was saved first." : ""}
          </p>
        </div>
      )}

      {!parsed && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose JSON file, or drop it here"
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
            Choose JSON file
            <TextInput
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="tw:hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
              aria-label="Upload JSON file"
            />
          </div>
          <p className={NOTE}>Review compatible values and changes before applying.</p>


          <Button
            type="button"
            color="light"
            size="xs"
            onClick={() => setShowPaste((v) => !v)}
            aria-expanded={showPaste}
            className={`${GHOST} tw:self-start tw:p-0 tw:text-[11px] tw:underline`}
          >
            or paste JSON
          </Button>

          {showPaste && (
            <div>
              <label>
                <span className="tw:sr-only">Paste JSON</span>
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

      {/* The mode is chosen before or after the file (B6-B15 / B6-B16). */}
      <div className="tw:flex tw:flex-col tw:gap-1" role="radiogroup" aria-label="Import mode">
        {(["replace", "keep-mine"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="xs"
            role="radio"
            aria-checked={strategy === m}
            color={strategy === m ? undefined : "light"}
            className="tw:self-start"
            onClick={() => setStrategy(m)}
            data-testid={`import-mode-${m}`}
          >
            {modeLabel(m)}
          </Button>
        ))}
        <p className={NOTE}>
          {strategy === "replace"
            ? "Matching values update. Tokens absent from the file are kept."
            : "Only tokens new to this site are added. Matching values are left as they are."}
        </p>
      </div>
      {parsed && (
        <>
          <p className={NOTE_STRONG} data-testid="import-file">
            {parsed.fileName ?? "Pasted JSON"} · {modeLabel(strategy)}
          </p>
          <p className={NOTE} data-testid="import-summary" title={parsed.detected}>
            {parsed.tokens.length + unsupported} detected · {applyCount} valid · {unsupported} unsupported
          </p>
          {rows({
            added: kindsOf(parsed.diff.added),
            modified: `${conflictCount} matching token${conflictCount === 1 ? "" : "s"}`,
            skipped: String(skipped),
            unsupported: unsupported === 0 ? "0" : parsed.errors.join(", "),
          })}
          <p className={`${NOTE} tw:bg-[var(--bk-accent-tint)] tw:p-2`} role="status">
            Preview only · Nothing has been applied
          </p>
          {failed && (
            <p className={ERROR_BOX} role="alert" data-testid="import-restore-failed">
              We couldn't save a restore point — nothing was changed.
            </p>
          )}
          <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
            <Button type="button" color="light" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleApply()} disabled={applyCount === 0 || guard.busy} data-testid="import-apply">
              {failed ? "Retry" : `Apply ${applyCount} valid`}
            </Button>
          </div>
        </>
      )}

      <Modal
        open={offlineAsk}
        onClose={() => setOfflineAsk(false)}
        title="Apply with local recovery only?"
        testId="import-offline-dialog"
        footer={
          <>
            <Button type="button" color="light" size="xs" onClick={() => setOfflineAsk(false)}>
              Cancel
            </Button>
            <Button type="button" size="xs" onClick={() => void handleApply(true)} data-testid="import-apply-local">
              Apply locally
            </Button>
          </>
        }
      >
        <p className={NOTE}>You’re offline. A server restore point can’t be created.</p>
        <p className={NOTE}>Undo is available on this device. Cancel keeps your Brand unchanged.</p>
      </Modal>
    </div>
  );
};
