/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * CMSCollectionSetupModal — Create CMS Collection (WS-14a)
 * PRD §12.2 — Two-step wizard: Name/Type then Fields
 *
 * @module editor/shell/modals/CMSCollectionSetupModal
 * @license BSD-3-Clause
 */

import { X, Plus, Trash2, Check } from "lucide-react";
import * as React from "react";
import { Button, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, Select, TextInput, Textarea, ToggleSwitch } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
// =============================================================================
// TYPES
// =============================================================================

type ContentType = "articles" | "products" | "team" | "custom";

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

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "articles", label: "Articles" },
  { value: "products", label: "Products" },
  { value: "team", label: "Team Members" },
  { value: "custom", label: "Custom" },
];

const FIELD_TYPES: FieldType[] = ["Text", "Number", "Image", "Date", "Boolean"];

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
const STEP_BAR = "tw:flex tw:items-center tw:gap-2 tw:pb-4 tw:mb-4 tw:border-b tw:border-gray-200";
const STEP = "tw:flex tw:items-center tw:gap-1.5 tw:text-xs";
const STEP_LABEL_ON = "tw:text-blue-700 tw:font-semibold";
const STEP_LABEL_OFF = "tw:text-gray-500";
const STEP_DOT =
  "tw:size-5 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-[11px] tw:font-bold tw:flex-none";
const STEP_DOT_ON = "tw:bg-blue-700 tw:text-white";
/* The board marks a finished step with success green, not another blue. */
const STEP_DOT_DONE = "tw:bg-[var(--bk-success)] tw:text-white";
const STEP_DOT_OFF = "tw:bg-gray-200 tw:text-gray-500";
const STEP_DIVIDER = "tw:flex-1 tw:h-px tw:bg-gray-200";
const LABEL = "tw:block tw:text-xs tw:font-medium tw:text-[var(--bk-ink-soft)] tw:mb-1.5";
const FIELD_ROW = "tw:flex tw:items-center tw:gap-2 tw:py-1.5 tw:border-b tw:border-gray-200";
const COL_HEAD = "tw:text-[11px] tw:text-gray-500 tw:font-medium";
/* Board 1170:4713 — every measurement below is read off that frame. */
const BOARD_CAPTION = "tw:text-[10px] tw:text-[var(--bk-ink-muted)]";
const BOARD_GROUP_LABEL = "tw:text-[9px] tw:font-semibold tw:text-[var(--bk-ink-muted)]";
const BOARD_FIELD_LABEL = "tw:text-[10px] tw:font-medium tw:text-[var(--bk-ink-muted)]";
const BOARD_ROW =
  "tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5 tw:py-1.5";
/* The board calls this colour ink-placeholder (#9ca3af); the generated token
   set has no such name — ink-muted is #6B7280 and ink-disabled is #D1D5DB —
   so this uses the utility that IS that colour rather than inventing a token.
   Caught by gate:token-resolution, which fails an undefined ref with no
   fallback: it would have rendered no colour at all. */
const BOARD_HANDLE = "tw:flex-none tw:cursor-grab tw:text-[10px] tw:text-gray-400";
const BOARD_LINK =
  "tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[11px] tw:font-medium tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline";
const BOARD_BLOCK =
  "tw:flex tw:flex-col tw:gap-1.5 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5 tw:py-2";
const SUCCESS_BANNER =
  "tw:flex tw:items-center tw:gap-2.5 tw:px-3.5 tw:py-3 tw:bg-[var(--bk-success-tint)] " +
  "tw:border tw:border-green-200 tw:rounded-lg tw:text-[var(--bk-success)] tw:text-[13px] tw:mt-3";
const ERROR_BANNER =
  "tw:mt-2.5 tw:px-3 tw:py-2 tw:bg-[var(--bk-error-tint)] tw:border tw:border-red-200 " +
  "tw:rounded-lg tw:text-[var(--bk-error)] tw:text-xs";
const FOOTER = "tw:flex tw:justify-end tw:gap-2 tw:pt-4 tw:mt-2 tw:border-t tw:border-gray-200";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

// =============================================================================
// COMPONENT
// =============================================================================

export const CMSCollectionSetupModal: React.FC<CMSCollectionSetupModalProps> = ({
  isOpen,
  onClose,
  composer,
}) => {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [name, setName] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("articles");
  const [description, setDescription] = React.useState("");
  const [fields, setFields] = React.useState<FieldRow[]>([
    { id: makeId(), name: "title", type: "Text" },
  ]);
  const [creating, setCreating] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // E7 dynamic-page binding: generate one published page per entry.
  const [genPages, setGenPages] = React.useState(false);
  const [pageSlug, setPageSlug] = React.useState("/{slug}");
  const [pageTemplate, setPageTemplate] = React.useState("");
  const [pageSeoTitle, setPageSeoTitle] = React.useState("");
  const [pageSeoDesc, setPageSeoDesc] = React.useState("");

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      // Delay reset to avoid visible flash during close animation
      const t = setTimeout(() => {
        setStep(1);
        setName("");
        setContentType("articles");
        setDescription("");
        setFields([{ id: makeId(), name: "title", type: "Text" }]);
        setCreating(false);
        setSuccess(false);
        setError(null);
        setGenPages(false);
        setPageSlug("/{slug}");
        setPageTemplate("");
        setPageSeoTitle("");
        setPageSeoDesc("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const canProceed = name.trim().length > 0;

  const addField = React.useCallback(() => {
    setFields((prev) => [...prev, { id: makeId(), name: "", type: "Text" }]);
  }, []);

  const removeField = React.useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFieldName = React.useCallback((id: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, name: value } : f)));
  }, []);

  const updateFieldType = React.useCallback((id: string, value: FieldType) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, type: value } : f)));
  }, []);

  const handleCreate = React.useCallback(async () => {
    if (!canProceed) return;
    setCreating(true);
    setError(null);

    try {
      // Map UI field types to CMSFieldType slugs
      const typeMap: Record<FieldType, string> = {
        Text: "text",
        Number: "number",
        Image: "image",
        Date: "date",
        Boolean: "boolean",
      };

      const collections = composer?.cms?.collections;
      if (!collections?.createCollection) {
        // No fake success: if the engine write path is unavailable, the
        // collection was NOT created — surface that instead of closing green.
        throw new Error("Collections are unavailable in this editor session.");
      }

      const collection = await collections.createCollection(
        name.trim(),
        undefined,
        description.trim() || undefined
      );

      // Add fields (skip title which may be auto-created)
      for (const field of fields) {
        if (!field.name.trim()) continue;
        await collections.addField(collection.id, {
          name: field.name.trim(),
          slug: field.name.trim().toLowerCase().replace(/\s+/g, "_"),
          type: typeMap[field.type] as import("../../../shared/types/cms").CMSFieldType,
          order: fields.indexOf(field),
        });
      }

      // E7: persist the dynamic-page binding so publish generates one page per entry.
      if (genPages && pageSlug.trim() && collections.updateCollection) {
        await collections.updateCollection(collection.id, {
          pageSlugPattern: pageSlug.trim(),
          pageTemplatePath: pageTemplate.trim() || undefined,
          pageSeoTitle: pageSeoTitle.trim() || undefined,
          pageSeoDescription: pageSeoDesc.trim() || undefined,
        });
      }

      // Only after a confirmed create.
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setCreating(false);
    }
  }, [canProceed, composer, name, description, fields, onClose, genPages, pageSlug, pageTemplate, pageSeoTitle, pageSeoDesc]);

  const footer = (
    <div className={FOOTER}>
      <Button color="light" size="xs" onClick={onClose} disabled={creating} className={GHOST}>
        Cancel
      </Button>
      {step === 1 ? (
        <Button
          size="xs"
          disabled={!canProceed}
          onClick={() => setStep(2)}
        >
          Next: Add Fields
        </Button>
      ) : (
        <Button
          size="xs"
          disabled={!canProceed || creating}
          onClick={handleCreate}
          aria-busy={creating || undefined}
        >
          Create Collection
        </Button>
      )}
    </div>
  );

  return (
    /* Board 183:16 — a filled wizard does not close on a stray scrim click.
       Anything typed counts: a name, a description, or a field renamed off
       the default. */
    <ModalRoot
      open={isOpen}
      onOpenChange={(next) => !next && onClose()}
      dirty={
        name.trim() !== "" ||
        description.trim() !== "" ||
        fields.some((f) => f.name !== "title")
      }
    >
      <ModalContent size="form">
        {/* Board 1170:4713's own title is the step, not the wizard. */}
        <ModalTitle>{step === 2 && name.trim() ? `Fields for ${name.trim()}` : "Create Collection"}</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    {/* Step indicator */}
    <div className={STEP_BAR}>
      <div className={STEP}>
        <div className={`${STEP_DOT} ${step > 1 ? STEP_DOT_DONE : STEP_DOT_ON}`} aria-hidden="true">
          {step > 1 ? <Check size={11} /> : "1"}
        </div>
        <span className={step === 1 ? STEP_LABEL_ON : STEP_LABEL_OFF}>Name &amp; Type</span>
      </div>
      <div className={STEP_DIVIDER} />
      <div className={STEP}>
        <div className={`${STEP_DOT} ${step === 2 ? STEP_DOT_ON : STEP_DOT_OFF}`} aria-hidden="true">
          2
        </div>
        <span className={step === 2 ? STEP_LABEL_ON : STEP_LABEL_OFF}>Fields</span>
      </div>
    </div>
    <p className={`${BOARD_CAPTION} tw:-mt-2 tw:mb-4`}>
      A collection turns rows of data into pages — one page per row.
    </p>
    {step === 1 && (
      <div className="tw:flex tw:flex-col tw:gap-4">
        {/* Collection name */}
        <div>
          <label className={LABEL}>
            Collection name <span className="tw:text-[var(--bk-error)]">*</span>
          </label>
          <TextInput
            className="tw:w-full"
            type="text"
            placeholder="Blog Posts"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--bk-accent)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--bk-border)";
            }}
          />
        </div>

        {/* Content type */}
        <div>
          <label className={LABEL}>Content type</label>
          <Select
            className="tw:w-full"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
          >
            {CONTENT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Description */}
        <div>
          <label className={LABEL}>Description (optional)</label>
          <Textarea
            className="tw:w-full tw:min-h-18 tw:resize-y"
            placeholder="Describe the purpose of this collection…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--bk-accent)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--bk-border)";
            }}
          />
        </div>
      </div>
    )}
    {step === 2 && (
      <div>
        {/* The board keeps the name editable on step 2 — you learn what the
            fields are FOR while you are naming them. */}
        <div className="tw:mb-3 tw:flex tw:flex-col tw:gap-1">
          <label className={BOARD_FIELD_LABEL} htmlFor="cms-collection-name-2">NAME</label>
          <TextInput
            id="cms-collection-name-2"
            className="tw:w-full"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <span className={`${BOARD_GROUP_LABEL} tw:mb-1.5 tw:block`}>FIELDS</span>

        {/* Field rows */}
        <div className="tw:flex tw:max-h-60 tw:flex-col tw:gap-1.5 tw:overflow-y-auto">
          {fields.map((field) => (
            <div key={field.id} className={BOARD_ROW}>
              <span className={BOARD_HANDLE} aria-hidden="true">⠿</span>
              <TextInput
                className="tw:flex-1"
                type="text"
                placeholder="field_name"
                value={field.name}
                onChange={(e) => updateFieldName(field.id, e.target.value)}
              />
              <Select
                className="tw:w-28"
                value={field.type}
                onChange={(e) => updateFieldType(field.id, e.target.value as FieldType)}
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                className={`${GHOST} tw:size-6 tw:p-0 tw:flex-none`}
                onClick={() => removeField(field.id)}
                title="Remove field"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--bk-error)";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(243,139,168,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--bk-ink-muted)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Trash2 size={12} aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          color="light"
          size="xs"
          className={`${BOARD_LINK} tw:mt-1.5`}
          data-testid="cms-add-field"
          onClick={addField}
        >
          ＋ Add field
        </Button>

        {/* E7 — dynamic-page binding. Board 1173:4825 draws it as a tinted
            block with a real switch, not a button that toggles its own label. */}
        <div className={`${BOARD_BLOCK} tw:mt-4`}>
          <ToggleSwitch
            checked={genPages}
            label="Generate a page per entry"
            onChange={(v: boolean) => setGenPages(v)}
          />
          {genPages && (
            <div className="tw:grid tw:gap-2">
              <TextInput   type="text" placeholder="Slug pattern — /blog/{slug}" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} />
              <TextInput   type="text" placeholder="Template page path — blog/_template/index.html" value={pageTemplate} onChange={(e) => setPageTemplate(e.target.value)} />
              <TextInput   type="text" placeholder="SEO title — {title} — Blog" value={pageSeoTitle} onChange={(e) => setPageSeoTitle(e.target.value)} />
              <TextInput   type="text" placeholder="SEO description — Read about {title}" value={pageSeoDesc} onChange={(e) => setPageSeoDesc(e.target.value)} />
            </div>
          )}
        </div>

        {error && (
          <div className={ERROR_BANNER}>
            {error}
          </div>
        )}

        {success && (
          <div className={SUCCESS_BANNER}>
            <Check size={16} />
            Collection "{name}" created successfully!
          </div>
        )}
      </div>
    )}
        </ModalBody>
        <ModalFooter>{footer}</ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default CMSCollectionSetupModal;
