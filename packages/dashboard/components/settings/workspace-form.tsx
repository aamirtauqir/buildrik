"use client";

import { useState, useRef } from "react";

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
  const [accentColor, setAccentColor] = useState(initialData?.accentColor ?? "var(--color-primary)");
  const [hexInput, setHexInput] = useState(initialData?.accentColor ?? "var(--color-primary)");
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

  function handleIconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setIconUrl(url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ name, slug, defaultLanguage, timezone, iconUrl, accentColor });
  }

  function handleSharingSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSaveSharing?.({ defaultExpiration, requirePw, allowEditors, notify });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
          General
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Inc."
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            />
            <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
              Visible to all workspace members.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Workspace URL
            </label>
            <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: "#E8E8E8" }}>
              <span className="px-3 py-2 text-sm border-r" style={{ borderColor: "#E8E8E8", backgroundColor: "#fafafa", color: "#7A7A7A" }}>
                buildrik.io/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="acme"
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ color: "#0D0D0D" }}
              />
            </div>
            {slug && (
              <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
                Preview: buildrik.io/{slug}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Default language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
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
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#0D0D0D" }}>
            Branding
          </h3>
          <div className="flex items-start gap-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
                Workspace icon
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                onChange={handleIconSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ borderColor: "#E8E8E8", backgroundColor: "#fafafa" }}
              >
                {iconUrl ? (
                  <img src={iconUrl} alt="Workspace icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs" style={{ color: "#B0B0B0" }}>
                    64x64
                  </span>
                )}
              </button>
              <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
                PNG or SVG recommended.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
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
                  className="w-9 h-9 rounded border cursor-pointer"
                  style={{ borderColor: "#E8E8E8" }}
                />
                <input
                  type="text"
                  value={hexInput.toUpperCase()}
                  onChange={(e) => handleHexChange(e.target.value)}
                  maxLength={7}
                  className="w-24 px-2 py-1.5 text-sm font-mono rounded-md border outline-none"
                  style={{
                    borderColor: isValidHex(hexInput) ? "#E8E8E8" : "#ef4444",
                    color: "#0D0D0D",
                  }}
                />
                <div
                  className="w-9 h-9 rounded border"
                  style={{ backgroundColor: accentColor, borderColor: "#E8E8E8" }}
                />
              </div>
              {!isValidHex(hexInput) && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                  Enter a valid hex color (e.g. #FF5500)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving ? "Saving\u2026" : "Save changes"}
          </button>
        </div>
      </form>

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      <form onSubmit={handleSharingSubmit} className="space-y-4">
        <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
          Default sharing settings
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Link expiration
            </label>
            <select
              value={defaultExpiration ?? ""}
              onChange={(e) => setDefaultExpiration(e.target.value || null)}
              className="w-full max-w-xs px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
              Default expiration for new shared links.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                Require password on shared links
              </p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>
                New shared links will require a password by default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequirePw(!requirePw)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: requirePw ? "var(--color-primary)" : "#E8E8E8" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: requirePw ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                Allow editors to share
              </p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>
                Editors can create and manage shared links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowEditors(!allowEditors)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: allowEditors ? "var(--color-primary)" : "#E8E8E8" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: allowEditors ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                Activity summary emails
              </p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>
                Receive weekly summaries of workspace activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotify(!notify)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: notify ? "var(--color-primary)" : "#E8E8E8" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: notify ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving ? "Saving\u2026" : "Save sharing settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
