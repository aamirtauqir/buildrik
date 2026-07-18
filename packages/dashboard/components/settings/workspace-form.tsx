"use client";

import { useState, useRef } from "react";
import { trpc } from "@lib/trpc/client";
import { SectionCard, Button, InputField } from "@/components/dashboard/primitives";

// Shared field chrome for native <select> controls, matched to InputField's
// 42px / radius-lg / inset-ring look (no Select primitive exists yet — see
// components/dashboard/primitives/index.ts).
const SELECT_FIELD_CLASS =
  "h-[42px] w-full rounded-lg px-[13px] text-[13.5px] shadow-[var(--shadow-ring)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--color-primary)]";

// Canonical product accent (DESIGN.md §Surface Scope). Must be a real hex — the
// workspace update schema validates accentColor against /^#[0-9A-Fa-f]{6}$/, so
// a "var(--color-primary)" default failed validation on any unchanged save.
const DEFAULT_ACCENT = "#406ED6";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

const EXPIRY_OPTIONS = [
  { value: "", label: "No expiration" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

interface WorkspaceFormProps {
  initialData?: {
    name?: string;
    slug?: string;
    defaultLanguage?: string;
    timezone?: string;
    iconUrl?: string | null;
    accentColor?: string;
    editsRequireApproval?: boolean;
    defaultExpiration?: string | null;
    requirePw?: boolean;
    allowEditors?: boolean;
    notify?: boolean;
  };
  onSave?: (data: {
    name: string;
    slug: string;
    defaultLanguage: string;
    timezone: string;
    iconUrl: string | null;
    accentColor: string;
    editsRequireApproval: boolean;
  }) => void;
  onSaveSharing?: (data: {
    defaultExpiration: string | null;
    requirePw: boolean;
    allowEditors: boolean;
    notify: boolean;
  }) => void;
  onDeleteWorkspace?: () => void;
  saving?: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30);
}

function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function WorkspaceForm({
  initialData,
  onSave,
  onSaveSharing,
  onDeleteWorkspace,
  saving,
}: WorkspaceFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [defaultLanguage, setDefaultLanguage] = useState(initialData?.defaultLanguage ?? "en");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "UTC");
  const [iconUrl, setIconUrl] = useState<string | null>(initialData?.iconUrl ?? null);
  const [iconUploading, setIconUploading] = useState(false);
  const [accentColor, setAccentColor] = useState(initialData?.accentColor ?? DEFAULT_ACCENT);
  const [hexInput, setHexInput] = useState(initialData?.accentColor ?? DEFAULT_ACCENT);
  const [editsRequireApproval, setEditsRequireApproval] = useState(initialData?.editsRequireApproval ?? false);
  const presignMutation = trpc.upload.presign.useMutation();
  const confirmMutation = trpc.upload.confirm.useMutation();
  const [defaultExpiration, setDefaultExpiration] = useState<string | null>(
    initialData?.defaultExpiration ?? null
  );
  const [requirePw, setRequirePw] = useState(initialData?.requirePw ?? false);
  const [allowEditors, setAllowEditors] = useState(initialData?.allowEditors ?? false);
  const [notify, setNotify] = useState(initialData?.notify ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  function handleHexChange(value: string) {
    setHexInput(value);
    if (isValidHex(value)) {
      setAccentColor(value);
    }
  }

  async function handleIconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Real upload (presign → PUT → confirm). Previously a transient
    // createObjectURL blob was written straight to the DB, so the icon was a
    // dead blob:http://localhost… URL after reload.
    setIconUploading(true);
    try {
      const result = await presignMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        context: "workspace_icon",
      });
      await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const confirmed = await confirmMutation.mutateAsync({ fileId: result.fileId });
      setIconUrl(confirmed.cdnUrl);
    } finally {
      setIconUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ name, slug, defaultLanguage, timezone, iconUrl, accentColor, editsRequireApproval });
  }

  function handleSharingSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSaveSharing?.({ defaultExpiration, requirePw, allowEditors, notify });
  }

  return (
    <div className="space-y-4">
      <SectionCard title="General">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Workspace name
            </label>
            <InputField
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Inc."
            />
            <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Visible to all workspace members.
            </p>
          </div>

          <div>
            <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Workspace URL
            </label>
            <div
              className="flex h-[42px] items-center overflow-hidden rounded-lg shadow-[var(--shadow-ring)] transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
              style={{ backgroundColor: "var(--color-bg-surface)" }}
            >
              <span
                className="flex h-full shrink-0 items-center border-r px-[13px] text-[13.5px]"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-page)", color: "var(--color-text-secondary)" }}
              >
                buildrik.io/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="acme"
                className="h-full flex-1 bg-transparent px-[13px] text-[13.5px] outline-none"
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>
            {slug && (
              <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Preview: buildrik.io/{slug}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Default language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className={SELECT_FIELD_CLASS}
              style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={SELECT_FIELD_CLASS}
              style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Branding
          </h3>
          <div className="flex items-start gap-6">
            <div>
              <p className="text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Workspace icon
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleIconSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={iconUploading}
                className="w-16 h-16 rounded-lg border flex items-center justify-center cursor-pointer overflow-hidden disabled:opacity-60"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-page)" }}
              >
                {iconUploading ? (
                  <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>…</span>
                ) : iconUrl ? (
                  <img src={iconUrl} alt="Workspace icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                    64x64
                  </span>
                )}
              </button>
              <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                PNG or JPG. Max 1 MB.
              </p>
            </div>
            <div>
              <p className="text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Accent color
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    setHexInput(e.target.value);
                  }}
                  className="w-9 h-9 rounded-md border cursor-pointer"
                  style={{ borderColor: "var(--color-border-default)" }}
                />
                <input
                  type="text"
                  value={hexInput.toUpperCase()}
                  onChange={(e) => handleHexChange(e.target.value)}
                  maxLength={7}
                  className="w-24 h-9 px-2.5 text-[13.5px] font-mono rounded-lg shadow-[var(--shadow-ring)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
                  style={{
                    boxShadow: isValidHex(hexInput) ? undefined : "inset 0 0 0 1.5px var(--color-error)",
                    backgroundColor: "var(--color-bg-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <div
                  className="w-9 h-9 rounded-md border"
                  style={{ backgroundColor: accentColor, borderColor: "var(--color-border-default)" }}
                />
              </div>
              {!isValidHex(hexInput) && (
                <p className="text-body-sm mt-1" style={{ color: "var(--color-error)" }}>
                  Enter a valid hex color (e.g. #FF5500)
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Collaboration
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Edits need approval before publishing
              </p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Content editors send changes for review instead of publishing directly. An admin approves to go live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditsRequireApproval(!editsRequireApproval)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
              style={{ backgroundColor: editsRequireApproval ? "var(--color-primary)" : "var(--color-border-default)" }}
              aria-pressed={editsRequireApproval}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: editsRequireApproval ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving\u2026" : "Save changes"}
          </Button>
        </div>
      </form>
      </SectionCard>

      <SectionCard title="Default sharing settings">
      <form onSubmit={handleSharingSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Link expiration
            </label>
            <select
              value={defaultExpiration ?? ""}
              onChange={(e) => setDefaultExpiration(e.target.value || null)}
              className={`${SELECT_FIELD_CLASS} max-w-xs`}
              style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Default expiration for new shared links.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Require password on shared links
              </p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                New shared links will require a password by default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequirePw(!requirePw)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: requirePw ? "var(--color-primary)" : "var(--color-border-default)" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: requirePw ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Allow editors to share
              </p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Editors can create and manage shared links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowEditors(!allowEditors)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: allowEditors ? "var(--color-primary)" : "var(--color-border-default)" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: allowEditors ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Activity summary emails
              </p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Receive weekly summaries of workspace activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotify(!notify)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: notify ? "var(--color-primary)" : "var(--color-border-default)" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: notify ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving\u2026" : "Save sharing settings"}
          </Button>
        </div>
      </form>
      </SectionCard>
    </div>
  );
}
