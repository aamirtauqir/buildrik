"use client";

import { useState } from "react";
import { ArrowRight, Plus, Trash2, Download, Upload } from "lucide-react";
import { StatCard, MetricValue, DataTable, Pill, type Column } from "@/components/dashboard/primitives";

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
  onDelete: (id: string) => void;
  onImport: (csv: string) => void;
  onExport: () => void;
  saving?: boolean;
}

export function RedirectsTab({ redirects, limit, canEdit, onCreate, onDelete, onImport, onExport, saving }: RedirectsTabProps) {
  const [fromPath, setFromPath] = useState("");
  const [toUrl, setToUrl] = useState("");
  const [type, setType] = useState<"301" | "302">("301");

  const atLimit = limit !== -1 && redirects.length >= limit;

  const submit = () => {
    if (!fromPath.trim() || !toUrl.trim()) return;
    const from = fromPath.trim().startsWith("/") ? fromPath.trim() : `/${fromPath.trim()}`;
    onCreate({ fromPath: from, toUrl: toUrl.trim(), type });
    setFromPath("");
    setToUrl("");
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
    { key: "fromPath", header: "From", render: (r) => <MetricValue className="text-xs">{r.fromPath}</MetricValue> },
    {
      key: "toUrl",
      header: "To",
      render: (r) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          <MetricValue className="text-xs">{r.toUrl}</MetricValue>
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
          <button type="button" onClick={() => onDelete(r.id)} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600">
            <Trash2 size={13} /> Delete
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Redirects</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Forward old URLs to new ones. 301 = permanent (SEO), 302 = temporary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExport} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
            <Download size={14} /> Export
          </button>
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
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

      {/* Add row */}
      {canEdit && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-default)" }}>
          {atLimit ? (
            <p className="text-sm text-amber-700">
              You&apos;ve hit your plan&apos;s redirect limit. <a href="/dashboard/billing" className="font-medium underline">Upgrade</a> to add more.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-neutral-500">From</label>
                <input value={fromPath} onChange={(e) => setFromPath(e.target.value)} placeholder="/old-page" className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm font-mono outline-none focus:border-[var(--color-primary)]" style={{ borderColor: "var(--color-border-default)" }} />
              </div>
              <ArrowRight size={16} className="mb-2 text-neutral-400" />
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-neutral-500">To</label>
                <input value={toUrl} onChange={(e) => setToUrl(e.target.value)} placeholder="/new-page" className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm font-mono outline-none focus:border-[var(--color-primary)]" style={{ borderColor: "var(--color-border-default)" }} />
              </div>
              <select value={type} onChange={(e) => setType(e.target.value as "301" | "302")} className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--color-border-default)" }}>
                <option value="301">301</option>
                <option value="302">302</option>
              </select>
              <button type="button" onClick={submit} disabled={saving || !fromPath.trim() || !toUrl.trim()} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                <Plus size={14} /> Add
              </button>
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
          <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: "var(--color-border-default)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No redirects yet</p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>Renaming a page slug auto-creates one, or add yours above.</p>
          </div>
        }
      />
    </div>
  );
}
