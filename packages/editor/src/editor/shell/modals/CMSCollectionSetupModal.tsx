/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * CMSCollectionSetupModal — Create CMS Collection.
 *
 * ONE modal, board 4418:84646 with its SA-fix 6940:79789 (owner decision
 * 2026-09-24, "Figma wins" — the two-step wizard is gone). Name, the field
 * rows and "Generate a page per entry" sit together; Create Collection writes
 * the collection, its fields and, when the toggle is on, its slug pattern.
 * The board's step chips (✓ Name & Type → 2 Fields) are drawn as it draws
 * them — a label, not a navigation. A removed field leaves "Field removed ·
 * Undo" (6940:79789). A taken name stops at the clash notice (4418:88263).
 * Template path and SEO for dynamic pages are edited in the collection's
 * Dynamic pages view, not here (audit G3-072).
 *
 * @module editor/shell/modals/CMSCollectionSetupModal
 * @license BSD-3-Clause
 */

import { Trash2, Check } from "lucide-react";
import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, ModalTitle, Select, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import { slugify } from "@shared/utils/helpers/string";
import type { CMSFieldType } from "@/shared/types/cms";
import type { Composer } from "../../../engine";
// =============================================================================
// TYPES
// =============================================================================

type FieldType = "Text" | "Number" | "Image" | "Date" | "Boolean";

interface FieldRow {
  id: string;
  name: string;
  type: FieldType;
}

export interface CMSCollectionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FIELD_TYPES: FieldType[] = ["Text", "Number", "Image", "Date", "Boolean"];

const FIELD_TYPE_SLUG: Record<FieldType, CMSFieldType> = {
  Text: "text",
  Number: "number",
  Image: "image",
  Date: "date",
  Boolean: "boolean",
};

/** Board 4418:88263's "Use Menu items 2": the first `<name> N` (N ≥ 2) that
 *  no collection holds yet. Compared case-insensitively, as the clash is. */
function nextFreeName(name: string, taken: Set<string>): string {
  for (let n = 2; ; n++) {
    const candidate = `${name} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// =============================================================================
// STYLES
// =============================================================================

/* `stepDotActive` and `stepDotDone` were byte-identical, as were `stepDone` and
   the `step` base — so two of the three step states were never distinguishable.
   Done reads as done now (a tick on a filled dot, muted label); the pretence of
   a third style is gone rather than invented. */
/* 4418:84646 — the chips sit straight above the caption, no rule under them. */
const STEP_BAR = "tw:flex tw:items-center tw:gap-2 tw:mb-3";
/* 1173:4816 — gap 6, and the step words are 11, not `text-xs`'s 12. */
const STEP = "tw:flex tw:items-center tw:gap-1.5 tw:text-[11px]";
/* 1173:4824 — the CURRENT step's word is --color/ink, not accent. The blue
   already lives one element to its left, on the dot; saying it twice made the
   step bar the loudest thing in a modal whose subject is a form. */
const STEP_LABEL_ON = "tw:text-[var(--bk-ink)] tw:font-semibold";
const STEP_LABEL_OFF = "tw:text-[var(--bk-ink-muted)]";
/* 1173:4817/4822 draw the marker as a PILL — 8/2 insets at radius 999 — not as
   a fixed 20px circle. `rounded-[999px]` rather than `rounded-full` because
   that is the number the board states; at this size the two render alike. */
const STEP_DOT =
  "tw:px-2 tw:py-0.5 tw:rounded-[999px] tw:flex tw:items-center tw:justify-center tw:text-[11px] tw:font-bold tw:flex-none";
const STEP_DOT_ON = "tw:bg-[var(--bk-accent)] tw:text-white";
/* The board marks a finished step with success green, not another blue. */
const STEP_DOT_DONE = "tw:bg-[var(--bk-success)] tw:text-white";
/* Board 1170:4713 — every measurement below is read off that frame. */
const BOARD_CAPTION = "tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]";
const BOARD_FIELD_LABEL = "tw:text-[length:var(--bk-text-11)] tw:font-medium tw:text-[var(--bk-ink-muted)]";
/* 4418:84646 — a bare row: handle, name, type, remove. No tinted box. */
const BOARD_ROW = "tw:flex tw:items-center tw:gap-2";
/* The board calls this colour ink-placeholder (`var(--bk-gray-400)`); the generated token
   set has no such name — ink-muted is `var(--bk-gray-500)` and ink-disabled is `var(--bk-gray-300)` —
   so this uses the utility that IS that colour rather than inventing a token.
   Caught by gate:token-resolution, which fails an undefined ref with no
   fallback: it would have rendered no colour at all. */
const BOARD_HANDLE = "tw:flex-none tw:cursor-grab tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]";
/* Button's `link` variant supplies the recipe; 11px medium is this modal's
   own board size. */
const BOARD_LINK = "tw:min-h-6 tw:text-[length:var(--bk-text-11)] tw:font-medium";
const BOARD_BLOCK =
  "tw:flex tw:flex-col tw:gap-1.5 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5 tw:py-2";
const SUCCESS_BANNER =
  "tw:flex tw:items-center tw:gap-2.5 tw:px-3.5 tw:py-3 tw:bg-[var(--bk-success-tint)] " +
  "tw:border tw:border-green-200 tw:rounded-lg tw:text-[var(--bk-success)] tw:text-[13px] tw:mt-3";
const ERROR_BANNER =
  "tw:mt-2.5 tw:px-3 tw:py-2 tw:bg-[var(--bk-error-tint)] tw:border tw:border-red-200 " +
  "tw:rounded-lg tw:text-[var(--bk-error)] tw:text-xs";
/* 4418:84646 draws no rule above the foot. */
const FOOTER = "tw:mt-4 tw:flex tw:justify-end tw:gap-2";
/* 4418:84646 — foot buttons 32 tall, radius 6, a 12px label. Only a
   SAME-property utility displaces a flowbite `size="xs"` default, which is why
   these are `h-*`/`py-*`/`rounded-*` and not `min-h-*`. */
const FOOT_BTN = "tw:h-8 tw:px-3 tw:py-0 tw:rounded-md tw:text-[12px] tw:font-normal";
/** The quiet in-row action (the field row's remove). */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
/* …and Cancel is a bordered WHITE button on the board, not a borderless ghost:
   a modal's two exits should read as two controls. */
const FOOT_CANCEL =
  "tw:border tw:border-solid tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] " +
  "tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-[var(--bk-gray-100)] tw:enabled:hover:text-[var(--bk-ink)]";

// =============================================================================
// COMPONENT
// =============================================================================

export const CMSCollectionSetupModal: React.FC<CMSCollectionSetupModalProps> = ({
  isOpen,
  onClose,
  composer,
}) => {
  const [name, setName] = React.useState("");
  const [fields, setFields] = React.useState<FieldRow[]>([{ id: makeId(), name: "title", type: "Text" }]);
  /* 6940:79789 — the last removed row and where it stood, for Undo. */
  const [removed, setRemoved] = React.useState<{ row: FieldRow; index: number } | null>(null);
  const [genPages, setGenPages] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  /* Board 4418:88263 — set when Create met a name that already exists;
     cleared by any edit to the name. */
  const [clashShown, setClashShown] = React.useState(false);

  // Reset state when modal closes (after the close animation).
  React.useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => {
      setName("");
      setFields([{ id: makeId(), name: "title", type: "Text" }]);
      setRemoved(null);
      setGenPages(false);
      setCreating(false);
      setSuccess(false);
      setError(null);
      setClashShown(false);
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen]);

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;
  /* Names are compared case-insensitively: "menu items" beside "Menu items"
     is the same collection to a reader, and the slug would collide too. */
  const takenNames = React.useMemo(
    () =>
      new Set(
        isOpen ? (composer?.cms?.collections?.getAllCollections() ?? []).map((c) => c.name.trim().toLowerCase()) : [],
      ),
    [isOpen, composer],
  );
  const clashes = takenNames.has(trimmed.toLowerCase());
  const slugPattern = `/${slugify(trimmed) || "collection"}/{slug}`;

  const editName = (value: string) => {
    setName(value);
    setClashShown(false);
  };

  const addField = () => setFields((prev) => [...prev, { id: makeId(), name: "", type: "Text" }]);
  const removeField = (id: string) =>
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index >= 0) setRemoved({ row: prev[index], index });
      return prev.filter((f) => f.id !== id);
    });
  const undoRemove = () => {
    if (!removed) return;
    setFields((prev) => [...prev.slice(0, removed.index), removed.row, ...prev.slice(removed.index)]);
    setRemoved(null);
  };
  const updateField = (id: string, patch: Partial<FieldRow>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleCreate = async () => {
    if (!canCreate) return;
    if (clashes) {
      setClashShown(true);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const collections = composer?.cms?.collections;
      if (!collections?.createCollection) {
        // No fake success: the collection was NOT created — say so.
        throw new Error("Collections are unavailable in this editor session.");
      }
      const collection = await collections.createCollection(trimmed, undefined, undefined);
      const named = fields.filter((f) => f.name.trim());
      for (const [order, field] of named.entries()) {
        await collections.addField(collection.id, {
          name: field.name.trim(),
          slug: field.name.trim().toLowerCase().replace(/\s+/g, "_"),
          type: FIELD_TYPE_SLUG[field.type],
          order,
        });
      }
      // E7: persist the dynamic-page binding so publish generates a page per entry.
      if (genPages && collections.updateCollection) {
        await collections.updateCollection(collection.id, { pageSlugPattern: slugPattern });
      }
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  return (
    /* Board 183:16 — a filled modal does not close on a stray scrim click. */
    <ModalRoot
      open={isOpen}
      onOpenChange={(next) => !next && onClose()}
      dirty={trimmed !== "" || fields.some((f) => f.name !== "title")}
    >
      <ModalContent size="form" data-testid="cms-setup-modal">
        <ModalTitle>
          {/* 4418:84646 sets the title at 18, off the 7-step scale; it snaps to
              --bk-text-16 (the design-debt ramp rule). The size rides on a span
              because a className font-size on the h2 ties MODAL_TITLE_CLASS's 14. */}
          <span className="tw:text-[length:var(--bk-text-16)]" data-testid="cms-setup-title">
            {trimmed ? `Fields for ${trimmed}` : "New collection"}
          </span>
        </ModalTitle>
        {/* 4418:84646 draws no ✕ — Cancel and Esc are the exits. */}
        <ModalBody>
          <div className={STEP_BAR} data-testid="cms-setup-steps" aria-hidden="true">
            <div className={STEP}>
              <div className={`${STEP_DOT} ${STEP_DOT_DONE}`}>
                <Check size={11} />
              </div>
              <span className={STEP_LABEL_OFF}>Name &amp; Type</span>
            </div>
            <span className={STEP_LABEL_OFF}>→</span>
            <div className={STEP}>
              <div className={`${STEP_DOT} ${STEP_DOT_ON}`}>2</div>
              <span className={STEP_LABEL_ON}>Fields</span>
            </div>
          </div>
          <p className={`${BOARD_CAPTION} tw:mt-0 tw:mb-3`} data-testid="cms-setup-caption">
            A collection stores structured records. Dynamic pages are optional.
          </p>

          <div className="tw:mb-3 tw:flex tw:flex-col tw:gap-1" data-testid="cms-setup-name-group">
            <label className={BOARD_FIELD_LABEL} htmlFor="cms-collection-name" data-testid="cms-setup-name-label">
              NAME
            </label>
            <TextInput
              id="cms-collection-name"
              className="tw:w-full tw:[&_input]:bg-[var(--bk-bg-subtle)]"
              data-testid="cms-setup-name"
              type="text"
              placeholder="Menu items"
              value={name}
              onChange={(e) => editName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="tw:flex tw:max-h-60 tw:flex-col tw:gap-1.5 tw:overflow-y-auto" data-testid="cms-setup-fields">
            {fields.map((field, i) => (
              <div key={field.id} className={BOARD_ROW} data-testid={`cms-setup-fieldrow-${i}`}>
                <span className={BOARD_HANDLE} aria-hidden="true">⠿</span>
                <TextInput
                  className="tw:flex-1"
                  type="text"
                  placeholder="field_name"
                  aria-label={`Field ${i + 1} name`}
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                />
                <Select
                  className="tw:w-28"
                  aria-label={`Field ${i + 1} type`}
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  className={`${GHOST} tw:size-6 tw:p-0 tw:flex-none tw:text-[var(--bk-error)]`}
                  onClick={() => removeField(field.id)}
                  title="Remove field"
                >
                  <Trash2 size={12} aria-hidden />
                </Button>
              </div>
            ))}
          </div>

          <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-3">
            {removed && (
              <span
                className={`${BOARD_LINK} tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:text-[var(--bk-accent-text)]`}
                data-testid="cms-setup-removed"
              >
                Field removed ·{" "}
                <Button type="button" color="light" size="xs" variant="link" className={`${BOARD_LINK} tw:p-0`} onClick={undoRemove}>
                  Undo
                </Button>
              </span>
            )}
            <Button type="button" color="light" size="xs" variant="link" className={BOARD_LINK} data-testid="cms-add-field" onClick={addField}>
              ＋ Add field
            </Button>
          </div>

          {/* E7 — dynamic-page binding. Board 1173:4825 / 4418:84646: a
              tinted block with a real switch and a one-line summary. */}
          <div className={`${BOARD_BLOCK} tw:mt-3`} data-testid="cms-setup-pages-block">
            <ToggleSwitch
              sizing="sm"
              className="tw:[&_span]:text-[length:var(--bk-text-11)]"
              checked={genPages} label="Generate a page per entry" onChange={(v: boolean) => setGenPages(v)} />
            {genPages && (
              <p className={`${BOARD_CAPTION} tw:m-0`} data-testid="cms-setup-pages-summary">
                Slug pattern — {slugPattern} · Template and SEO are set in the collection&apos;s Dynamic pages.
              </p>
            )}
          </div>

          {clashShown && (
            <div role="alert" className={ERROR_BANNER} data-testid="cms-setup-clash">
              <p className="tw:m-0 tw:font-semibold">Collection name already exists</p>
              <p className="tw:mt-1 tw:mb-2">A collection named “{trimmed}” already exists.</p>
              <Button
                type="button"
                color="light"
                size="xs"
                variant="link"
                className={BOARD_LINK}
                data-testid="cms-setup-clash-use"
                onClick={() => editName(nextFreeName(trimmed, takenNames))}
              >
                Use {nextFreeName(trimmed, takenNames)}
              </Button>
            </div>
          )}
          {error && <div className={ERROR_BANNER}>{error}</div>}
          {success && (
            <div className={SUCCESS_BANNER}>
              <Check size={16} />
              Collection &ldquo;{trimmed}&rdquo; created.
            </div>
          )}
          {/* 4418:84646 — the foot sits in the body: no rule above it, and
              buttons at the board's 32, not the modal foot's 28. */}
          <div className={FOOTER} data-testid="cms-setup-foot">
            <Button
              color="light"
              size="xs"
              onClick={onClose}
              disabled={creating}
              className={`${FOOT_BTN} ${FOOT_CANCEL}`}
              data-testid="cms-setup-cancel"
            >
              Cancel
            </Button>
            <Button
              size="xs"
              className={FOOT_BTN}
              disabled={!canCreate || creating}
              onClick={() => void handleCreate()}
              aria-busy={creating || undefined}
              data-testid="cms-setup-create"
            >
              Create Collection
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default CMSCollectionSetupModal;
