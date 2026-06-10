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
import { Button } from "@/editor/shared/vibcoder/Button";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Select } from "@/editor/shared/vibcoder/Select";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
} from "@/editor/shared/vibcoder";

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

  const setField = (slug: string, value: unknown) => setForm((p) => ({ ...p, [slug]: value }));

  const renderField = (field: CMSField) => {
    const value = form[field.slug];
    const common = { key: field.id, style: { marginBottom: 10 } as React.CSSProperties };
    if (field.type === "boolean") {
      return (
        <label {...common} style={{ ...common.style, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setField(field.slug, e.target.checked)}
          />
          {field.name}
        </label>
      );
    }
    if (field.type === "textarea" || field.type === "richtext") {
      return (
        <div {...common}>
          <FieldLabel field={field} />
          <Textarea
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
        <Input
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
    <OverlayMount>
      <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>CMS Records</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body" style={{ minHeight: 320 }}>
            {collections.length === 0 ? (
              <p style={{ color: "var(--bd-text-secondary)" }}>
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
                      <Button variant="primary" size="sm" busy={busy} onClick={save}>
                        {editingId === "" ? "Add record" : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--bd-text-secondary)" }}>
                        {items.length} record{items.length === 1 ? "" : "s"}
                      </span>
                      <Button variant="secondary" size="sm" onClick={startAdd} disabled={!collection}>
                        <Plus size={13} /> Add record
                      </Button>
                    </div>
                    <div>
                      {items.length === 0 ? (
                        <p style={{ color: "var(--bd-text-secondary)", fontSize: 13 }}>No records yet.</p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bd-border)" }}
                          >
                            <span style={{ fontSize: 13 }}>
                              {collection ? displayValue(item, collection) : item.id}
                              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--bd-text-tertiary)" }}>{item.status}</span>
                            </span>
                            <span style={{ display: "flex", gap: 4 }}>
                              <Button variant="ghost" size="sm" onClick={() => startEdit(item)} aria-label="Edit record">
                                <Pencil size={13} />
                              </Button>
                              <Button variant="ghost" size="sm" busy={busy} onClick={() => remove(item.id)} aria-label="Delete record">
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
      </Modal>
    </OverlayMount>
  );
};

const FieldLabel: React.FC<{ field: CMSField }> = ({ field }) => (
  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--bd-text-secondary)" }}>
    {field.name}
    {field.validation?.required && <span style={{ color: "var(--bd-danger)" }}> *</span>}
  </label>
);

export default CMSRecordsModal;
