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
import { ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, Portal, Stack } from "@/editor/ui";
import { BK_SELECT_BASE_THEME } from "@/editor/ui/selectTheme";
import type { Composer } from "../../../engine";
import { Button, Select, Textarea, TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/ui/textInputTheme";

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

const s: Record<string, React.CSSProperties> = {
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 0 16px",
    marginBottom: 16,
    borderBottom: "1px solid var(--bk-border)",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--bk-ink-muted)",
  },
  stepActive: {
    color: "var(--bk-accent)",
    fontWeight: 600,
  },
  stepDone: {
    color: "var(--bk-ink-muted)",
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: "var(--bk-radius-full)",
    background: "var(--bk-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepDotActive: {
    background: "var(--bk-accent)",
    color: "var(--bk-accent-on)",
  },
  stepDotDone: {
    background: "var(--bk-accent)",
    color: "var(--bk-accent-on)",
  },
  stepDivider: {
    flex: 1,
    height: 1,
    background: "var(--bk-border)",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--bk-ink-soft)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-lg)",
    color: "var(--bk-ink)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-lg)",
    color: "var(--bk-ink)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box" as const,
    appearance: "auto" as const,
  },
  textarea: {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-lg)",
    color: "var(--bk-ink)",
    fontSize: 13,
    outline: "none",
    resize: "vertical" as const,
    minHeight: 72,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  fieldRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    borderBottom: "1px solid var(--bk-border)",
  },
  fieldNameInput: {
    flex: 1,
    padding: "6px 10px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-sm)",
    color: "var(--bk-ink)",
    fontSize: 12,
    outline: "none",
  },
  fieldTypeSelect: {
    width: 110,
    padding: "6px 8px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-sm)",
    color: "var(--bk-ink)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    appearance: "auto" as const,
  },
  removeBtn: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    borderRadius: "var(--bk-radius-sm)",
    color: "var(--bk-ink-muted)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "color 0.15s, background 0.15s",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "var(--bk-radius-lg)",
    color: "#86efac",
    fontSize: 13,
    marginTop: 12,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 16,
    borderTop: "1px solid var(--bk-border)",
    marginTop: 8,
  },
};

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
    <div style={s.footer}>
      <Button color="light" size="xs" onClick={onClose} disabled={creating} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
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
    <Portal>
      <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Create Collection</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      {/* Step indicator */}
      <div style={s.stepIndicator}>
        <div style={s.step}>
          <div
            style={{
              ...s.stepDot,
              ...(step === 1 ? s.stepDotActive : s.stepDotDone),
            }}
          >
            {step > 1 ? <Check size={11} /> : "1"}
          </div>
          <span style={step === 1 ? s.stepActive : s.stepDone}>Name &amp; Type</span>
        </div>
        <div style={s.stepDivider} />
        <div style={s.step}>
          <div
            style={{
              ...s.stepDot,
              ...(step === 2 ? s.stepDotActive : {}),
            }}
          >
            2
          </div>
          <span style={step === 2 ? s.stepActive : {}}>Fields</span>
        </div>
      </div>
      {step === 1 && (
        <Stack gap="lg">
          {/* Collection name */}
          <div>
            <label style={s.label}>
              Collection name <span style={{ color: "var(--bk-error)" }}>*</span>
            </label>
            <TextInput theme={BK_TEXT_INPUT_THEME}
              style={s.input}
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
            <label style={s.label}>Content type</label>
            <Select
              theme={BK_SELECT_BASE_THEME}
              style={s.select}
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
            <label style={s.label}>Description (optional)</label>
            <Textarea
              style={s.textarea}
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
        </Stack>
      )}
      {step === 2 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--bk-ink-soft)" }}>
              Fields for <strong style={{ color: "var(--bk-ink)" }}>{name}</strong>
            </span>
            <Button color="light" size="xs" onClick={addField} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
              <Plus size={12} aria-hidden="true" />
              Add Field
            </Button>
          </div>

          {/* Header row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              paddingBottom: 6,
              borderBottom: "1px solid var(--bk-border)",
              marginBottom: 2,
            }}
          >
            <span style={{ flex: 1, fontSize: 11, color: "var(--bk-ink-muted)", fontWeight: 500 }}>
              FIELD NAME
            </span>
            <span style={{ width: 110, fontSize: 11, color: "var(--bk-ink-muted)", fontWeight: 500 }}>
              TYPE
            </span>
            <span style={{ width: 24 }} />
          </div>

          {/* Field rows */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {fields.map((field) => (
              <div key={field.id} style={s.fieldRow}>
                <TextInput theme={BK_TEXT_INPUT_THEME}
                  style={s.fieldNameInput}
                  type="text"
                  placeholder="field_name"
                  value={field.name}
                  onChange={(e) => updateFieldName(field.id, e.target.value)}
                />
                <Select
                  theme={BK_SELECT_BASE_THEME}
                  style={s.fieldTypeSelect}
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
                  style={s.removeBtn}
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

          {/* E7 — dynamic-page binding */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--bk-border)" }}>
            <Button
              type="button"
              color={genPages ? undefined : "light"}
              onClick={() => setGenPages((v) => !v)}
              style={{ fontSize: 12 }}
            >
              {genPages ? "✓ " : ""}Generate a page per entry
            </Button>
            {genPages && (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <TextInput theme={BK_TEXT_INPUT_THEME}   type="text" placeholder="Slug pattern — /blog/{slug}" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} />
                <TextInput theme={BK_TEXT_INPUT_THEME}   type="text" placeholder="Template page path — blog/_template/index.html" value={pageTemplate} onChange={(e) => setPageTemplate(e.target.value)} />
                <TextInput theme={BK_TEXT_INPUT_THEME}   type="text" placeholder="SEO title — {title} — Blog" value={pageSeoTitle} onChange={(e) => setPageSeoTitle(e.target.value)} />
                <TextInput theme={BK_TEXT_INPUT_THEME}   type="text" placeholder="SEO description — Read about {title}" value={pageSeoDesc} onChange={(e) => setPageSeoDesc(e.target.value)} />
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "rgba(243,139,168,0.1)",
                border: "1px solid rgba(243,139,168,0.25)",
                borderRadius: "var(--bk-radius-lg)",
                color: "var(--bk-error)",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div style={s.successBanner}>
              <Check size={16} />
              Collection "{name}" created successfully!
            </div>
          )}
        </div>
      )}
          </div>
          <ModalFooter>{footer}</ModalFooter>
        </ModalContent>
      </ModalRoot>
    </Portal>
  );
};

export default CMSCollectionSetupModal;
