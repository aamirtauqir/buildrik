"use client";

import { useState } from "react";

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

interface WorkspaceFormProps {
  initialData?: {
    name?: string;
    slug?: string;
    defaultLanguage?: string;
    timezone?: string;
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
  const [accentColor, setAccentColor] = useState(initialData?.accentColor ?? "#E42313");
  const [defaultExpiration, setDefaultExpiration] = useState<string | null>(
    initialData?.defaultExpiration ?? null
  );
  const [requirePw, setRequirePw] = useState(initialData?.requirePw ?? false);
  const [allowEditors, setAllowEditors] = useState(initialData?.allowEditors ?? false);
  const [notify, setNotify] = useState(initialData?.notify ?? true);

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ name, slug, defaultLanguage, timezone });
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
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
                Workspace icon
              </p>
              <div
                className="w-16 h-16 rounded-lg border flex items-center justify-center cursor-pointer"
                style={{ borderColor: "#E8E8E8", backgroundColor: "#fafafa" }}
              >
                <span className="text-xs" style={{ color: "#B0B0B0" }}>
                  64×64
                </span>
              </div>
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
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded border cursor-pointer"
                  style={{ borderColor: "#E8E8E8" }}
                />
                <span className="text-sm font-mono" style={{ color: "#0D0D0D" }}>
                  {accentColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
            style={{ backgroundColor: "#E42313" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      <form onSubmit={handleSharingSubmit} className="space-y-4">
        <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
          Default sharing settings
        </h2>

        <div className="space-y-3">
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
              style={{ backgroundColor: requirePw ? "#E42313" : "#E8E8E8" }}
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
              style={{ backgroundColor: allowEditors ? "#E42313" : "#E8E8E8" }}
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
              style={{ backgroundColor: notify ? "#E42313" : "#E8E8E8" }}
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
            style={{ backgroundColor: "#E42313" }}
          >
            {saving ? "Saving…" : "Save sharing settings"}
          </button>
        </div>
      </form>

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
            Delete workspace
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#7A7A7A" }}>
            Permanently delete this workspace and all its data.
          </p>
        </div>
        <button
          type="button"
          onClick={onDeleteWorkspace}
          className="text-sm font-medium"
          style={{ color: "#E42313" }}
        >
          Delete workspace
        </button>
      </div>
    </div>
  );
}
