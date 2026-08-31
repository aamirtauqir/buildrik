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
import { CMSValidationError } from "../../../engine/cms/CollectionManager";
import type { CMSCollection, CMSContentItem, CMSField } from "../../../shared/types/cms";
import { Button, Checkbox, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, Select, TextInput, Textarea } from "@/editor/chrome-ui";

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

/* Board 1170:4749 draws the columns off the collection's own fields, then a
   fixed "Updated". Three fit the 688 frame; beyond that the table would
   out-grow the modal, so the leading three are shown and the rest live in the
   record form. The board's own sample (Title · Price · Photo) is three. */
const MAX_FIELD_COLUMNS = 3;

/** The quiet row-action treatment, previously repeated at each of the three
 *  call sites below. */
const GHOST_BTN = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

/** "today" for same-day, else "MMM D" — the board's own two shapes. */
function updatedLabel(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";
  const now = new Date();
  const sameDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate();
  if (sameDay) return "today";
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A media cell reads as presence, not as a path: the board draws a checked
 *  "photo" when the field is filled and a warn-toned "missing" when it is not.
 *  That is the only question a table can usefully answer about an image. */
function MediaCell({ filled, label }: { filled: boolean; label: string }) {
  return filled ? (
    <span className="tw:text-[var(--bk-ink-muted)]">✓ {label}</span>
  ) : (
    <span style={{ color: "var(--bk-warning)" }}>— missing</span>
  );
}

function cellText(item: CMSContentItem, field: CMSField): string {
  const v = item.data[field.slug];
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
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
  /* Publishing runs the collection's validation rules now (CollectionManager),
     so this row can be refused. Say which fields, on the row that was clicked —
     the list has no per-field form to mark up. */
  const [publishError, setPublishError] = React.useState<{ id: string; message: string } | null>(null);

  const collection = collections.find((c) => c.id === collectionId) ?? null;
  /* Columns follow the collection's field order, which is the order the user
     defined — not a re-sort of it. */
  const columns = React.useMemo(
    () => (collection?.fields ?? []).slice(0, MAX_FIELD_COLUMNS),
    [collection],
  );
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
    setPublishError(null);
    try {
      await composer.cms.collections.updateContentItem(id, { status });
      await reloadItems();
    } catch (e) {
      if (e instanceof CMSValidationError) setPublishError({ id, message: e.message });
      else throw e;
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
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        {/* Board 1170:4749 puts the collection and its record count IN the
            title — "Menu items — 12 records" — so the modal says what it is
            holding before you read a single row. */}
        <ModalTitle>
          {collection ? `${collection.name} — ${items.length} record${items.length === 1 ? "" : "s"}` : "Records"}
        </ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody className="tw:min-h-80">
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
                    <Button color="light" size="xs" onClick={() => setEditingId(null)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
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

                  {/* Board 1170:4749 — a table whose columns are the
                      collection's own leading fields plus Updated. The list it
                      replaced showed only the display field, so every other
                      field was invisible until you opened the record. */}
                  <table className="tw:w-full tw:text-[13px] tw:border-collapse">
                    <thead>
                      <tr>
                        {columns.map((f) => (
                          <th
                            key={f.id}
                            scope="col"
                            className="tw:px-3 tw:py-2 tw:text-left tw:text-xs tw:font-normal tw:text-[var(--bk-ink-muted)]"
                          >
                            {f.name}
                          </th>
                        ))}
                        <th scope="col" className="tw:px-3 tw:py-2 tw:text-left tw:text-xs tw:font-normal tw:text-[var(--bk-ink-muted)]">
                          Updated
                        </th>
                        {/* The board draws no row actions; the code has publish,
                            edit and delete, and rule 1 says a working capability
                            does not get dropped because a sample frame omits it. */}
                        <th scope="col" className="tw:px-3 tw:py-2">
                          <span className="tw:sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length + 2}
                            className="tw:px-3 tw:py-6 tw:text-center tw:text-[var(--bk-ink-muted)]"
                          >
                            No records yet.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => [
                          <tr key={item.id} className="tw:hover:bg-blue-50">
                            {columns.map((f, idx) => (
                              <td key={f.id} className="tw:px-3 tw:py-2.5 tw:text-[var(--bk-ink)]">
                                {f.type === "image" ? (
                                  <MediaCell
                                    filled={Boolean(item.data[f.slug])}
                                    label={f.name.toLowerCase()}
                                  />
                                ) : idx === 0 && collection ? (
                                  displayValue(item, collection)
                                ) : (
                                  cellText(item, f)
                                )}
                              </td>
                            ))}
                            <td className="tw:px-3 tw:py-2.5 tw:text-[var(--bk-ink-muted)]">
                              {updatedLabel(item.updatedAt)}
                            </td>
                            <td className="tw:px-3 tw:py-2.5">
                              <span className="tw:flex tw:justify-end tw:gap-1">
                                <Button
                                  color="light"
                                  size="xs"
                                  disabled={busy}
                                  onClick={() => setStatus(item.id, item.status === "published" ? "draft" : "published")}
                                  aria-label={item.status === "published" ? "Unpublish record" : "Publish record"}
                                  aria-busy={busy || undefined}
                                  className={GHOST_BTN}
                                >
                                  {item.status === "published" ? "Unpublish" : "Publish"}
                                </Button>
                                <Button color="light" size="xs" onClick={() => startEdit(item)} aria-label="Edit record" className={GHOST_BTN}>
                                  <Pencil size={13} />
                                </Button>
                                <Button color="light" size="xs" disabled={busy} onClick={() => remove(item.id)} aria-label="Delete record" aria-busy={busy || undefined} className={GHOST_BTN}>
                                  <Trash2 size={13} />
                                </Button>
                              </span>
                            </td>
                          </tr>,
                          publishError?.id === item.id ? (
                            <tr key={`${item.id}-error`}>
                              <td colSpan={(collection?.fields.length ?? 0) + 2} className="tw:px-3 tw:pb-2.5 tw:text-xs tw:text-[var(--bk-error)]">
                                <span role="alert">Can&apos;t publish: {publishError.message}</span>
                              </td>
                            </tr>
                          ) : null,
                        ])
                      )}
                    </tbody>
                  </table>

                  {/* Footer actions, right-aligned as the board draws them.
                      `Import JSON` sits beside Add record on the board and is
                      NOT built: the engine exposes createContentItem one record
                      at a time and has no bulk or JSON import path, so the
                      button would have nothing to call. Parsing, validating and
                      fanning a file out over N creates is a feature, not this
                      modal's layout. */}
                  <div className="tw:flex tw:justify-end tw:pt-3">
                    <Button size="xs" onClick={startAdd} disabled={!collection}>
                      <Plus size={13} /> Add record
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

const FieldLabel: React.FC<{ field: CMSField }> = ({ field }) => (
  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--bk-ink-soft)" }}>
    {field.name}
    {field.validation?.required && <span style={{ color: "var(--bk-error)" }}> *</span>}
  </label>
);

export default CMSRecordsModal;
