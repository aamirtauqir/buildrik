/**
 * ChooseFont — the one font picker (2L9 R02, 247:31047), the tab's whole
 * body while it is open:
 *
 *   Choose font
 *   [ Search fonts            ]
 *   [   Studio Sans · Uploaded   ]
 *   studio-sans-regular.woff2 · Regular
 *   [   Studio Sans · Catalogue  ]
 *   Same family label · different source identity
 *   [ Inherit ]  [ Manage site fonts ]  [ Cancel ]
 *   Search, scroll and Hero heading → Font are retained.
 *
 * The Brand panel's font token uses it too (`form="family"`: a bare family,
 * no Inherit), so there is one picker in the editor.
 *
 * Rows are the families the font list really has: the site's uploaded fonts
 * (FontManager's custom fonts, named by file and weight), the system stacks,
 * and the Google catalogue. A catalogue family an uploaded font shares its
 * name with says so. The search and the list's scroll are kept per element
 * while the picker is open — leaving for Site fonts and coming back finds
 * them as they were — which is what the last line claims.
 *
 * A pick is one discrete write; when the engine records it, `captureUndo`
 * binds the Font row's "Undo font assignment" (R08) to that step. The
 * assignment lives here, not in the row, because the row is not mounted
 * while this body is.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, TextInput } from "@/editor/chrome-ui";
import { loadGoogleFont, searchGoogleFonts } from "@/services/GoogleFontsService";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { EVENTS } from "@/shared/constants/events";
import { useInspectorField } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { GROUP_TITLE, WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { SYSTEM_FONTS, namesFont, openSiteFonts, primaryFamily, useUploadedFonts } from "./FontPicker";
import { FONT_WEIGHTS } from "./FontControls";

// ============================================================================
// THE LAST ASSIGNMENT (R08) — read by the Font row
// ============================================================================

export interface FontAssignment {
  elementId: string;
  value: string;
  family: string;
  /** "uploaded" · "Google Fonts" · "system" — as the status line says it. */
  source: string;
  previous: string | null;
  undo: () => boolean;
}

let assignment: FontAssignment | null = null;
const assignmentListeners = new Set<() => void>();
const setAssignment = (next: FontAssignment | null) => {
  assignment = next;
  assignmentListeners.forEach((l) => l());
};

/** The last family picked for this element, or null. */
export function useFontAssignment(elementId: string | undefined): FontAssignment | null {
  const a = React.useSyncExternalStore(
    (l) => {
      assignmentListeners.add(l);
      return () => assignmentListeners.delete(l);
    },
    () => assignment,
  );
  return a && a.elementId === elementId ? a : null;
}

export const clearFontAssignment = (): void => setAssignment(null);

// ============================================================================
// WHAT IS KEPT WHILE OPEN — search and scroll, per element
// ============================================================================

const kept = new Map<string, { query: string; scrollTop: number }>();

// ============================================================================
// ROWS
// ============================================================================

interface Row {
  key: string;
  value: string;
  family: string;
  source: "Uploaded" | "System" | "Catalogue";
  detail: string | null;
  catalogue: boolean;
}

const weightWord = (weight: number | string) => FONT_WEIGHTS.find((w) => w.value === String(weight))?.label ?? String(weight);

/** "studio-sans-regular.woff2" from the face's url; null for a url with no file name. */
function fileNameOf(url: string | undefined): string | null {
  if (!url || /^(blob|data):/.test(url)) return null;
  const last = url.split(/[?#]/)[0]?.split("/").pop();
  if (!last) return null;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function rowsFor(composer: Composer | null | undefined, query: string): Row[] {
  const q = query.trim().toLowerCase();
  const matches = (family: string) => !q || family.toLowerCase().includes(q);
  const uploaded = (composer?.fonts?.getAllFonts({ source: "custom" }) ?? []).filter((f) => matches(f.family));
  const uploadedFamilies = new Set(uploaded.map((f) => f.family));
  return [
    ...uploaded.map((f): Row => {
      const v = f.variants[0];
      const file = fileNameOf(v?.url);
      return {
        key: `uploaded:${f.id}`,
        value: `'${f.family}', sans-serif`,
        family: f.family,
        source: "Uploaded",
        detail: [file, v ? weightWord(v.weight) : null].filter(Boolean).join(" · ") || null,
        catalogue: false,
      };
    }),
    ...SYSTEM_FONTS.filter((f) => f.value !== "inherit" && matches(f.label)).map(
      (f): Row => ({ key: `system:${f.label}`, value: f.value, family: f.label, source: "System", detail: null, catalogue: false }),
    ),
    ...searchGoogleFonts(query)
      .slice(0, 50)
      .map(
        (f): Row => ({
          key: `catalogue:${f.family}`,
          value: `'${f.family}', ${f.category}`,
          family: f.family,
          source: "Catalogue",
          detail: uploadedFamilies.has(f.family) ? "Same family label · different source identity" : null,
          catalogue: true,
        }),
      ),
  ];
}

// ============================================================================
// COMPONENT
// ============================================================================

const NOTE = "tw:m-0 tw:pb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

export interface ChooseFontProps {
  composer: Composer | null | undefined;
  elementId: string;
  /** The element's own family ("" when it sets none). */
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  /** What a pick writes: the element's quoted stack ("'Inter', sans-serif"),
   *  or a Brand font token's bare family ("Inter"; a system stack with no
   *  single family stays as written). A token has no Inherit. */
  form?: "stack" | "family";
  /** Who the kept search belongs to, for the last line: "{layer} → Font"
   *  for an element; a Brand role names itself ("Body Font"). */
  subject?: string;
}

/** The value a row writes in the token's form: its family where it has one. */
const familyOf = (row: Row) => (row.source === "System" && primaryFamily(row.value) !== row.family ? row.value : row.family);

export function ChooseFont({ composer, elementId, value, onChange, onClose, form = "stack", subject }: ChooseFontProps) {
  const field = useInspectorField("font-family");
  const uploadedFonts = useUploadedFonts(composer);
  const [query, setQuery] = React.useState(() => kept.get(elementId)?.query ?? "");
  const listRef = React.useRef<HTMLDivElement>(null);
  /* Re-read when a font is added or removed in Site fonts (`uploadedFonts` changes). */
  const rows = React.useMemo(() => (uploadedFonts ? rowsFor(composer, query) : []), [composer, query, uploadedFonts]);
  /* A Brand role names itself; an element is named as the Layers panel names it. */
  const el = subject ? undefined : composer?.elements?.getElement(elementId);
  const layer = el ? (getLayerName(el) ?? elementTypeLabel(el.getType())) : "This element";

  React.useLayoutEffect(() => {
    const top = kept.get(elementId)?.scrollTop ?? 0;
    if (listRef.current) listRef.current.scrollTop = top;
  }, [elementId]);

  const remember = (next: Partial<{ query: string; scrollTop: number }>) =>
    kept.set(elementId, { query, scrollTop: listRef.current?.scrollTop ?? 0, ...next });

  const close = () => {
    kept.delete(elementId);
    onClose();
  };

  const pick = (row: Row | null) => {
    if (field.readOnly) return;
    const next = row ? (form === "family" ? familyOf(row) : row.value) : "inherit";
    if (next === value) return close();
    if (row?.catalogue) loadGoogleFont(row.family);
    /* One Undo step, the one the engine records for this write — bound only
       if a step was recorded, so the row's Undo never reverts an older edit. */
    let recorded = false;
    const onRecorded = () => {
      recorded = true;
    };
    composer?.on?.(EVENTS.HISTORY_RECORDED, onRecorded);
    try {
      field.discrete(() => onChange(next));
    } finally {
      composer?.off?.(EVENTS.HISTORY_RECORDED, onRecorded);
    }
    const undo = recorded ? composer?.history?.captureUndo?.() : undefined;
    setAssignment(
      row && undo
        ? {
            elementId,
            value: next,
            family: row.family,
            source: row.source === "Uploaded" ? "uploaded" : row.source === "Catalogue" ? "Google Fonts" : "system",
            previous: value && value !== "inherit" ? primaryFamily(value) || value : null,
            undo,
          }
        : null,
    );
    close();
  };

  const uploadedSelected = uploadedFonts.some((f) => namesFont(value, f));
  const isSelected = (row: Row) =>
    row.source === "Catalogue" ? !uploadedSelected && primaryFamily(value) === row.family : namesFont(value, { value: row.value, label: row.family, category: "system" });

  return (
    <div
      className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:px-3 tw:pb-3"
      role="group"
      aria-label="Choose font"
      data-testid="inspector-choose-font"
    >
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Choose font</div>
      <TextInput
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          remember({ query: e.target.value, scrollTop: 0 });
          if (listRef.current) listRef.current.scrollTop = 0;
        }}
        placeholder="Search fonts"
        aria-label="Search fonts"
        autoFocus
        className="tw:pb-2"
      />
      <div
        ref={listRef}
        onScroll={() => remember({ scrollTop: listRef.current?.scrollTop ?? 0 })}
        className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-2 tw:overflow-y-auto"
        role="list"
        aria-label="Fonts"
        data-testid="inspector-choose-font-list"
      >
        {rows.length === 0 ? <p className={NOTE}>Nothing matches “{query}”.</p> : null}
        {rows.map((row) => (
          <div key={row.key} role="listitem" className="tw:flex tw:flex-col tw:gap-1">
            <Button
              color="light"
              size="xs"
              className={`${WIDE_BUTTON} ${isSelected(row) ? "tw:bg-[var(--bk-accent-subtle)]" : ""}`}
              aria-pressed={isSelected(row)}
              disabled={field.readOnly}
              onClick={() => pick(row)}
              data-testid="inspector-choose-font-row"
              data-font-source={row.source.toLowerCase()}
            >
              {row.family} · {row.source}
            </Button>
            {row.detail ? <p className={NOTE}>{row.detail}</p> : null}
          </div>
        ))}
      </div>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-2">
        {form === "stack" ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} disabled={field.readOnly} onClick={() => pick(null)} data-testid="inspector-choose-font-inherit">
            Inherit
          </Button>
        ) : null}
        <Button
          color="light"
          size="xs"
          className={WIDE_BUTTON}
          onClick={() => {
            remember({});
            openSiteFonts(composer);
          }}
          data-testid="font-picker-manage-site-fonts"
        >
          Manage site fonts
        </Button>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={close} data-testid="inspector-choose-font-cancel">
          Cancel
        </Button>
        <p className={NOTE} data-testid="inspector-choose-font-kept">
          Search, scroll and {subject ?? `${layer} → Font`} are retained.
        </p>
      </div>
    </div>
  );
}
