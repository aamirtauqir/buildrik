/**
 * FontPicker — the Typography section's Font row: the family and its source,
 * the applied stack, and after a pick the R08 note with "Undo font
 * assignment". Clicking it opens Choose font (`./ChooseFont`, 2L9 R02), the
 * one font picker, as the tab's whole body.
 *
 * @module editor/inspector/sections/typography/FontPicker
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { clearFontAssignment, useFontAssignment } from "./ChooseFont";
import { loadGoogleFont } from "@/services/GoogleFontsService";
import { openSubview } from "@/editor/inspector/tabs/subviewStore";
import { Button } from "@/editor/chrome-ui";
import { fieldTestId, labelTestId, rowTestId } from "@/editor/inspector/shared/controls";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { FieldDot } from "@/editor/inspector/shared/controls/FieldDot";
import { useInspectorField, mixedName } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";
// ============================================================================
// TYPES
// ============================================================================

export interface SystemFont {
  value: string;
  label: string;
  category: "system" | "sans-serif" | "serif" | "monospace";
}

// ============================================================================
// CONSTANTS
// ============================================================================

// System fonts (always available)
export const SYSTEM_FONTS: SystemFont[] = [
  { value: "inherit", label: "Inherit", category: "system" },
  { value: "-apple-system, BlinkMacSystemFont, sans-serif", label: "System", category: "system" },
  { value: "Arial, sans-serif", label: "Arial", category: "sans-serif" },
  { value: "Georgia, serif", label: "Georgia", category: "serif" },
  { value: "'Times New Roman', serif", label: "Times New Roman", category: "serif" },
  { value: "'Courier New', monospace", label: "Courier New", category: "monospace" },
];

/**
 * The family a value names — `'Inter Var', sans-serif` → `Inter Var`, and a
 * token's bare `Inter Var` → itself. The inspector holds the quoted stack and
 * the Brand token the bare family; one comparison reads both back.
 */
export const primaryFamily = (value: string): string =>
  (value.split(",")[0] ?? "").trim().replace(/^['"]|['"]$/g, "");

/** Whether a value names this preset — by its exact stack or by its family. */
export const namesFont = (value: string, font: SystemFont): boolean =>
  value === font.value || (value !== "" && primaryFamily(value) === font.label);

/** The door every picker carries — Site fonts (3686:42317) listens in StudioPanels. */
export const openSiteFonts = (composer: Composer | null | undefined): void => {
  composer?.emit("ui:site-fonts", {});
};

// ============================================================================
// COMPONENT
// ============================================================================

interface FontPickerProps {
  value: string;
  /** The element (or page root) the row edits — Choose font opens for it. */
  elementId?: string;
  /** Source of the UPLOADED group — the FontManager's custom fonts, which the
   *  Composer registers from the media library's ADDED site fonts. */
  composer?: Composer | null;
  /** The family the element renders in when it sets none (Page panel, board
   *  21: "Inter"). Shown, never written. */
  inheritedValue?: string;
}

/* Clone 3721:43423 — an uploaded font is "a separate uploaded source; it does
   not replace the built-in family". Read on mount and on every font event, so
   a font added in Site fonts shows up here without a reopen. Both pickers
   (Typography's Family row, the Brand font token) read through this one hook. */
export function useUploadedFonts(composer: Composer | null | undefined): SystemFont[] {
  const fontManager = composer?.fonts;
  const read = React.useCallback(
    (): SystemFont[] =>
      (fontManager?.getAllFonts({ source: "custom" }) ?? []).map((f) => ({
        value: `'${f.family}', sans-serif`,
        label: f.family,
        category: "sans-serif",
      })),
    [fontManager],
  );
  const [fonts, setFonts] = React.useState<SystemFont[]>(read);
  React.useEffect(() => {
    setFonts(read());
    if (!fontManager) return;
    const refresh = () => setFonts(read());
    const events = [EVENTS.FONT_UPLOADED, EVENTS.FONT_LOADED, EVENTS.FONT_DELETED];
    for (const ev of events) fontManager.on(ev, refresh);
    return () => {
      for (const ev of events) fontManager.off(ev, refresh);
    };
  }, [fontManager, read]);
  return fonts;
}

/** Families the FontManager failed to load (FONT_ERROR), this session. */
const failedFamilies = new Set<string>();

type LoadState = "loaded" | "loading" | "failed";

/** Whether a face of this family has loaded in the document, is still on its
 *  way, or failed (a face in error, or the FontManager reported the family
 *  unloadable — 2L9 R05). Re-read whenever the document finishes loading
 *  fonts or the manager reports. Null when there is no family to ask about. */
function useFamilyLoaded(family: string | null, composer: Composer | null | undefined): [LoadState | null, () => void] {
  const read = React.useCallback((): LoadState | null => {
    if (!family || typeof document === "undefined" || typeof document.fonts?.forEach !== "function") return null;
    let state: LoadState = failedFamilies.has(family) ? "failed" : "loading";
    document.fonts.forEach((f) => {
      if (f.family.replace(/["']/g, "") !== family) return;
      if (f.status === "loaded") state = "loaded";
      else if (f.status === "error" && state !== "loaded") state = "failed";
    });
    return state;
  }, [family]);
  const [state, setState] = React.useState(read);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    setState(read());
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    const manager = composer?.fonts;
    const refresh = () => setState(read());
    const onError = (payload: unknown) => {
      const failed = (payload as { font?: { family?: string } } | null)?.font?.family;
      if (failed) failedFamilies.add(failed);
      refresh();
    };
    manager?.on?.(EVENTS.FONT_ERROR, onError);
    manager?.on?.(EVENTS.FONT_LOADED, refresh);
    if (family && typeof fonts?.load === "function") fonts.load(`16px "${family}"`).then(refresh, refresh);
    if (family && typeof fonts?.addEventListener === "function") fonts.addEventListener("loadingdone", refresh);
    return () => {
      manager?.off?.(EVENTS.FONT_ERROR, onError);
      manager?.off?.(EVENTS.FONT_LOADED, refresh);
      if (typeof fonts?.removeEventListener === "function") fonts.removeEventListener("loadingdone", refresh);
    };
  }, [family, read, composer, attempt]);
  /* Retry: the same source again — the uploaded file re-registered, the
     catalogue family re-requested. The family and source stay as assigned. */
  const retry = React.useCallback(() => {
    if (!family) return;
    failedFamilies.delete(family);
    const own = composer?.fonts?.getAllFonts({ source: "custom" }).find((f) => f.family === family);
    const url = own?.variants[0]?.url;
    if (url) void composer?.fonts?.registerLibraryFont({ filename: url.split(/[?#]/)[0]?.split("/").pop() ?? family, url }).catch(() => failedFamilies.add(family));
    else loadGoogleFont(family);
    setAttempt((n) => n + 1);
  }, [family, composer]);
  return [state, retry];
}

export const FontPicker: React.FC<FontPickerProps> = ({ value: ownValue, composer, inheritedValue, elementId }) => {
  const field = useInspectorField("font-family");
  const value = ownValue || inheritedValue || "";
  const uploadedFonts = useUploadedFonts(composer);
  const latest = useFontAssignment(elementId);

  /* An uploaded family reads back as one: the trigger says so for the walk
     (`data-font-source`). */
  const uploaded = uploadedFonts.some((f) => namesFont(value, f));

  // Get current font name for display
  const currentFontName = React.useMemo(() => {
    if (field.mixed) return "Mixed";
    if (!value) return "Select font...";

    // Check system + uploaded fonts
    const systemFont = [...uploadedFonts, ...SYSTEM_FONTS].find((f) => f.value === value);
    if (systemFont) return systemFont.label;

    /* Board 1 reads "Inter", not the stack "Inter, sans-serif". */
    return primaryFamily(value) || value;
  }, [value, uploadedFonts, field.mixed]);

  /* 2L9 R01: where the family comes from, beside its name ("Inter · System"),
     and the stack the element actually writes under the row. */
  const source =
    field.mixed || !value || value === "inherit" || /^var\(/.test(value)
      ? null
      : !ownValue && inheritedValue
        ? "inherited"
      : uploaded
        ? "Uploaded"
        : SYSTEM_FONTS.some((f) => f.value === value)
          ? "System"
          : "Google Fonts";
  /* Shown while the element still carries the family picked (R08) — an
     undo, ⌘Z or another pick ends it. */
  const assigned = latest && latest.value === ownValue && !field.mixed ? latest : null;
  const [load, retryLoad] = useFamilyLoaded(assigned && assigned.source !== "system" ? assigned.family : null, composer);
  const stack = ownValue && !field.mixed && ownValue.includes(",") && !assigned ? ownValue.replace(/'/g, "") : null;

  return (
    /* Board 1 reads "Font  [Inter]" — one row, label left, the same column
       every other row uses. `.bdi-ddn` is the shared control frame. The one
       style left inline is the preview typeface, which is the field's value
       and cannot be a class. The row is the door to Choose font (R02), the
       tab's whole body while open. */
    <div className="bdi-row-ctrl tw:relative" data-testid={rowTestId("Font")}>
      <label className="bdi-lb" data-testid={labelTestId("Font")}>
        Font
        <FieldDot field={field} />
      </label>
      <Button
        onClick={() => {
          if (!field.readOnly && elementId) openSubview({ kind: "font-picker", elementId });
        }}
        aria-haspopup="dialog"
        aria-label={field.mixed ? mixedName("Font family") : "Font family"}
        aria-disabled={field.readOnly || undefined}
        data-testid={fieldTestId("Font")}
        data-font-source={uploaded ? "uploaded" : undefined}
        className="bdi-ddn tw:justify-between tw:text-left"
        style={{ fontFamily: field.mixed ? "inherit" : value || "inherit" }}
      >
        <span className={"tw:min-w-0 tw:truncate" + (field.mixed ? " tw:text-[var(--bk-ink-muted)]" : "")}>
          {currentFontName}
          {source ? <span className="tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-ui)]" data-testid="font-source"> · {source}</span> : null}
        </span>
        {/* The field chevron every other select in the column draws. */}
        <ChevronDown size={12} aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
      </Button>
      {stack ? (
        <p className="tw:col-span-full tw:m-0 tw:pb-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="font-applied-stack">
          Applied stack: {stack}
        </p>
      ) : null}
      {assigned ? (
        <div className="tw:col-span-full tw:flex tw:flex-col tw:gap-2 tw:pb-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="font-assignment">
          {assigned.source === "system" ? null : load === "failed" ? (
            /* R05: the intended family and source stay; the fallback renders. */
            <>
              <p className="tw:m-0" role="alert" data-testid="font-assignment-status">
                Font unavailable — fallback is rendering. The intended family and source are retained.
              </p>
              <Button color="light" size="xs" className={WIDE_BUTTON} onClick={retryLoad} data-testid="font-assignment-retry">
                Retry font load
              </Button>
            </>
          ) : (
            <p className="tw:m-0" data-testid="font-assignment-status">
              {load === "loaded"
                ? `${assigned.family} loaded · ${assigned.source} source ready.`
                : `Loading ${assigned.family} · ${assigned.source} source.`}
            </p>
          )}
          <Button
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => {
              assigned.undo();
              clearFontAssignment();
            }}
            data-testid="font-assignment-undo"
          >
            Undo font assignment
          </Button>
          {load === "failed" ? (
            <p className="tw:m-0">A late load cannot reapply an undone choice. Project save and font loading are separate statuses.</p>
          ) : (
          <p className="tw:m-0">
            {assigned.previous
              ? `Undo restores the previous ${assigned.previous} stack`
              : "Undo restores the inherited font"}
            {assigned.source === "uploaded" ? " without deleting the uploaded font." : "."}
          </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FontPicker;
