/**
 * CMSRecordsModal — manage records (content items) of a CMS collection.
 *
 * The engine (CollectionManager) had full record CRUD but no UI ever called it,
 * so collections could be created but never filled — the CMS was unusable. This
 * modal wires getAllCollections / getContentItems / create / update / delete into
 * a records table + field-driven add/edit form.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Composer } from "../../../engine";
import type { CMSCollection, CMSContentItem, CMSField } from "../../../shared/types/cms";
import {
  ModalClose,
  ModalContent,
  ModalRoot,
  ModalTitle,
  Portal,
} from "@/editor/chrome-ui";
import { Button, Checkbox, Select, Textarea, TextInput } from "@/editor/chrome-ui";

export interface CMSRecordsModalProps {
  composer: Composer | null;
  isOpen: boolean;
  onClose: () => void;
}

/** A blank form keyed by field slug, seeded with each field's default. */
function emptyForm(fields: CMSField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.slug] = f.defaultValue ?? (f.type === "boolean" ? false : "");
  return out;
}

function displayValue(item: CMSContentItem, collection: CMSCollection): string {
  const key = collection.displayField || collection.fields[0]?.slug;
  const v = key ? item.data[key] : undefined;
  return v == null || v === "" ? "(untitled)" : String(v);
}

export const CMSRecordsModal: React.FC<CMSRecordsModalProps> = ({ composer, isOpen, onClose }) => {
  const [collections, setCollections] = React.useState<CMSCollection[]>([]);
  const [collectionId, setCollectionId] = React.useState<string>("");
  const [items, setItems] = React.useState<CMSContentItem[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null); // null=not editing, ""=new
  const [form, setForm] = React.useState<Record<string, unknown>>({});
  const [busy, setBusy] = React.useState(false);

  const collection = collections.find((c) => c.id === collectionId) ?? null;
  const publishedCount = items.filter((i) => i.status === "published").length;
  const hasDynamicPages = Boolean(collection?.pageSlugPattern);

  // Load collections when opened.
  React.useEffect(() => {
    if (!isOpen || !composer) return;
    const all = composer.cms.collections.getAllCollections();
    setCollections(all);
    setCollectionId((prev) => prev || all[0]?.id || "");
    setEditingId(null);
  }, [isOpen, composer]);

  const reloadItems = React.useCallback(async () => {
    if (!composer || !collectionId) {
      setItems([]);
      return;
    }
    const rows = await composer.cms.collections.getContentItems(collectionId);
    setItems(rows);
  }, [composer, collectionId]);

  React.useEffect(() => {
    if (isOpen) void reloadItems();
  }, [isOpen, reloadItems]);

  const startAdd = () => {
    if (!collection) return;
    setForm(emptyForm(collection.fields));
    setEditingId("");
  };
  const startEdit = (item: CMSContentItem) => {
    if (!collection) return;
    setForm({ ...emptyForm(collection.fields), ...item.data });
    setEditingId(item.id);
  };

  const save = async () => {
    if (!composer || !collection || editingId === null) return;
    setBusy(true);
    try {
      if (editingId === "") {
        await composer.cms.collections.createContentItem(collection.id, form);
      } else {
        await composer.cms.collections.updateContentItem(editingId, { data: form });
      }
      setEditingId(null);
      await reloadItems();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!composer) return;
    setBusy(true);
    try {
      await composer.cms.collections.deleteContentItem(id);
      await reloadItems();
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: CMSContentItem["status"]) => {
    if (!composer) return;
    setBusy(true);
    try {
      await composer.cms.collections.updateContentItem(id, { status });
      await reloadItems();
    } finally {
      setBusy(false);
    }
  };

  const setField = (slug: string, value: unknown) => setForm((p) => ({ ...p, [slug]: value }));

  const renderField = (field: CMSField) => {
    const value = form[field.slug];
    const common = { key: field.id, style: { marginBottom: 10 } as React.CSSProperties };
    if (field.type === "boolean") {
      return (
        <div {...common}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <Checkbox
              color="blue"
              className="tw:bg-white"
              checked={Boolean(value)}
              onChange={(e) => setField(field.slug, e.target.checked)}
            />
            <span>{field.name}</span>
          </label>
        </div>
      );
    }
    if (field.type === "textarea" || field.type === "richtext") {
      return (
        <div {...common}>
          <FieldLabel field={field} />
          <Textarea
            className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
            value={String(value ?? "")}
            onChange={(e) => setField(field.slug, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
    }
    if ((field.type === "select" || field.type === "multiselect") && field.options?.length) {
      return (
        <div {...common}>
          <FieldLabel field={field} />
          <Select value={String(value ?? "")} onChange={(e) => setField(field.slug, e.target.value)}>
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        </div>
      );
    }
    const inputType = field.type === "number" ? "number" : field.type === "date" || field.type === "datetime" ? "date" : "text";
    return (
      <div {...common}>
        <FieldLabel field={field} />
        <TextInput
          type={inputType}
          value={String(value ?? "")}
          onChange={(e) =>
            setField(field.slug, field.type === "number" ? Number(e.target.value) : e.target.value)
          }
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  return (
    <Portal>
      <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>CMS Records</ModalTitle>
          <ModalClose aria-label="Close modal" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body" style={{ minHeight: "20rem" }}>
            {collections.length === 0 ? (
              <p style={{ color: "var(--bk-ink-soft)" }}>
                No collections yet. Create one from an element&apos;s CMS binding first.
              </p>
            ) : (
              <>
                <div style={{ marginBottom: 12, maxWidth: 280 }}>
                  <Select
                    value={collectionId}
                    onChange={(e) => {
                      setCollectionId(e.target.value);
                      setEditingId(null);
                    }}
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>

                {editingId !== null && collection ? (
                  <div>
                    {collection.fields.map(renderField)}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button size="xs" disabled={busy} onClick={save} aria-busy={busy || undefined}>
                        {editingId === "" ? "Add record" : "Save"}
                      </Button>
                      <Button color="light" size="xs" onClick={() => setEditingId(null)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {hasDynamicPages && publishedCount === 0 && (
                      <div
                        role="status"
                        style={{
                          marginBottom: 10,
                          padding: "8px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          color: "var(--bk-warning-text, var(--bk-warning))",
                          background: "var(--bk-warning-tint)",
                          border: "1px solid var(--bk-warning-text)",
                        }}
                      >
                        No records published yet — this collection generates a page per entry, but
                        dynamic pages won&apos;t generate until at least one record is published.
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--bk-ink-soft)" }}>
                        {items.length} record{items.length === 1 ? "" : "s"}
                      </span>
                      <Button color="light" size="xs" onClick={startAdd} disabled={!collection}>
                        <Plus size={13} /> Add record
                      </Button>
                    </div>
                    <div>
                      {items.length === 0 ? (
                        <p style={{ color: "var(--bk-ink-soft)", fontSize: 13 }}>No records yet.</p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bk-border)" }}
                          >
                            <span style={{ fontSize: 13 }}>
                              {collection ? displayValue(item, collection) : item.id}
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: item.status === "published" ? "var(--bk-success)" : "var(--bk-ink-muted)",
                                }}
                              >
                                {item.status}
                              </span>
                            </span>
                            <span style={{ display: "flex", gap: 4 }}>
                              <Button
                                color="light"
                                size="xs"
                                disabled={busy}
                                onClick={() => setStatus(item.id, item.status === "published" ? "draft" : "published")}
                                aria-label={item.status === "published" ? "Unpublish record" : "Publish record"} aria-busy={busy || undefined} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                              >
                                {item.status === "published" ? "Unpublish" : "Publish"}
                              </Button>
                              <Button color="light" size="xs" onClick={() => startEdit(item)} aria-label="Edit record" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                                <Pencil size={13} />
                              </Button>
                              <Button color="light" size="xs" disabled={busy} onClick={() => remove(item.id)} aria-label="Delete record" aria-busy={busy || undefined} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                                <Trash2 size={13} />
                              </Button>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ModalContent>
      </ModalRoot>
    </Portal>
  );
};

const FieldLabel: React.FC<{ field: CMSField }> = ({ field }) => (
  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--bk-ink-soft)" }}>
    {field.name}
    {field.validation?.required && <span style={{ color: "var(--bk-error)" }}> *</span>}
  </label>
);

export default CMSRecordsModal;
