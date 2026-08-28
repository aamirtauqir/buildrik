"use client";

import { useState } from "react";
import { ArrowRight, Plus, Trash2, Download, Upload, Pencil } from "lucide-react";
import { Button, StatCard, MetricValue, DataTable, Pill, InputField, type Column, SelectField } from "@/components/dashboard/primitives";

export interface RedirectRow {
  id: string;
  fromPath: string;
  toUrl: string;
  type: string;
  createdAt: Date | string;
}

interface RedirectsTabProps {
  redirects: RedirectRow[];
  limit: number; // -1 = unlimited
  canEdit: boolean;
  onCreate: (data: { fromPath: string; toUrl: string; type: "301" | "302" }) => void;
  onUpdate?: (id: string, data: { fromPath: string; toUrl: string; type: "301" | "302" }) => void;
  onDelete: (id: string) => void;
  onImport: (csv: string) => void;
  onExport: () => void;
  saving?: boolean;
}

export function RedirectsTab({ redirects, limit, canEdit, onCreate, onUpdate, onDelete, onImport, onExport, saving }: RedirectsTabProps) {
  const [fromPath, setFromPath] = useState("");
  const [toUrl, setToUrl] = useState("");
  const [type, setType] = useState<"301" | "302">("301");
  // Editing an existing redirect reuses this same form (was Add/Delete only — a
  // typo meant delete-and-re-add). null = adding a new one.
  const [editingId, setEditingId] = useState<string | null>(null);

  const atLimit = limit !== -1 && redirects.length >= limit;

  const startEdit = (r: RedirectRow) => {
    setEditingId(r.id);
    setFromPath(r.fromPath);
    setToUrl(r.toUrl);
    setType(r.type === "302" ? "302" : "301");
  };
  const resetForm = () => {
    setEditingId(null);
    setFromPath("");
    setToUrl("");
    setType("301");
  };

  const submit = () => {
    if (!fromPath.trim() || !toUrl.trim()) return;
    const from = fromPath.trim().startsWith("/") ? fromPath.trim() : `/${fromPath.trim()}`;
    if (editingId) {
      onUpdate?.(editingId, { fromPath: from, toUrl: toUrl.trim(), type });
    } else {
      onCreate({ fromPath: from, toUrl: toUrl.trim(), type });
    }
    resetForm();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const columns: Column<RedirectRow>[] = [
    { key: "fromPath", header: "From", render: (r) => <MetricValue className="text-body-sm">{r.fromPath}</MetricValue> },
    {
      key: "toUrl",
      header: "To",
      render: (r) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          <MetricValue className="text-body-sm">{r.toUrl}</MetricValue>
        </span>
      ),
    },
    { key: "type", header: "Type", render: (r) => <Pill tone="neutral">{r.type}</Pill> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        canEdit ? (
          <div className="inline-flex items-center gap-3">
            {onUpdate && (
              <button type="button" onClick={() => startEdit(r)} className="inline-flex items-center gap-1 text-body-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                <Pencil size={13} /> Edit
              </button>
            )}
            <button type="button" onClick={() => onDelete(r.id)} className="inline-flex items-center gap-1 text-body-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)]">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>Redirects</h2>
          {/* This said "Forward old URLs to new ones", which the product does
              not do: the publish payload is HTML pages plus robots.txt — no
              vercel.json, no redirect config — so nothing here is ever applied
              to the deployed site. The rules ARE stored and exportable, which
              is what the copy now claims. */}
          <p className="mt-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Plan and keep your redirect map here — 301 = permanent (SEO), 302 = temporary. Applying
            it to the published site isn&rsquo;t wired up yet; export the CSV for your host in the
            meantime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onExport} className="gap-1.5">
            <Download size={14} /> Export
          </Button>
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-body" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
              <Upload size={14} /> Import CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active" value={<MetricValue>{redirects.length}</MetricValue>} />
        <StatCard label="Plan limit" value={<MetricValue>{limit === -1 ? "∞" : limit}</MetricValue>} />
        <StatCard label="Permanent (301)" value={<MetricValue>{redirects.filter((r) => r.type === "301").length}</MetricValue>} />
      </div>

      {/* Add / edit row — shown at limit too when editing (edit doesn't add). */}
      {canEdit && (!atLimit || editingId) && (
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          {atLimit && !editingId ? (
            <p className="text-body text-[var(--color-warning-text)]">
              You&apos;ve hit your plan&apos;s redirect limit. <a href="/dashboard/settings/billing" className="font-medium underline">Upgrade</a> to add more.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-body-sm font-medium text-[var(--color-text-muted)]">From</label>
                <InputField value={fromPath} onChange={(e) => setFromPath(e.target.value)} placeholder="/old-page" className="font-mono" wrapperClassName="mt-1" />
              </div>
              <ArrowRight size={16} className="mb-2 text-neutral-400" />
              <div className="flex-1 min-w-[140px]">
                <label className="block text-body-sm font-medium text-[var(--color-text-muted)]">To</label>
                <InputField value={toUrl} onChange={(e) => setToUrl(e.target.value)} placeholder="/new-page" className="font-mono" wrapperClassName="mt-1" />
              </div>
              {/* Named: the two option values are the only text near it, so a
                  screen reader announced "combo box" with no idea it chose the
                  redirect kind (axe: select-name). */}
              <SelectField
                size="sm"
                aria-label="Redirect type"
                value={type}
                onChange={(e) => setType(e.target.value as "301" | "302")}
                wrapperClassName="w-[88px] shrink-0"
              >
                <option value="301">301</option>
                <option value="302">302</option>
              </SelectField>
              <Button type="button" size="sm" onClick={submit} disabled={saving || !fromPath.trim() || !toUrl.trim()} className="gap-1">
                {editingId ? <><Pencil size={14} /> Update</> : <><Plus size={14} /> Add</>}
              </Button>
              {editingId && (
                <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* List */}
      <DataTable
        columns={columns}
        rows={redirects}
        keyOf={(r) => r.id}
        empty={
          <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "var(--color-border-default)" }}>
            <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>No redirects yet</p>
            {/* "Renaming a page slug auto-creates one" — nothing does: the
                editor keeps a page's slug history on the page itself and no
                code path writes a Redirect row. Every row here is one someone
                typed or imported. */}
            <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>Add one above, or import a CSV.</p>
          </div>
        }
      />
    </div>
  );
}
