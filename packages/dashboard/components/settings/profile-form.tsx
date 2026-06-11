"use client";

import { useState, useRef } from "react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const INITIALS_COLORS = [
  "var(--color-primary)", "#3b82f6", "#8b5cf6", "#059669", "#d97706",
  "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#4f46e5",
];

function getInitialsColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

interface ProfileFormProps {
  initialData?: {
    fullName?: string;
    displayName?: string;
    email?: string;
    bio?: string;
    language?: string;
    timezone?: string;
    initials?: string;
    avatarUrl?: string;
  };
  onSave?: (data: {
    fullName: string;
    displayName: string;
    bio: string;
    language: string;
    timezone: string;
  }) => void;
  onAvatarUpload?: (file: File) => void;
  onAvatarRemove?: () => void;
  saving?: boolean;
}

export function ProfileForm({ initialData, onSave, onAvatarUpload, onAvatarRemove, saving }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [language, setLanguage] = useState(initialData?.language ?? "en");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "UTC");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (initialData?.initials ?? fullName)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const initialsColor = getInitialsColor(initialData?.initials ?? fullName);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    onAvatarUpload?.(file);
  }

  function handleRemovePhoto() {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onAvatarRemove?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ fullName, displayName, bio, language, timezone });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-5">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-semibold select-none flex-shrink-0"
            style={{ backgroundColor: initialsColor }}
          >
            {initials || "?"}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium px-3 py-1.5 rounded-md border"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              Upload photo
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-sm font-medium px-3 py-1.5 rounded-md border"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            JPG, PNG or GIF. Max 2 MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Appears on published sites.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="jane"
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Shown to team members.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Email
        </label>
        <input
          type="email"
          value={initialData?.email ?? ""}
          readOnly
          className="w-full px-3 py-2 text-sm rounded-md border outline-none"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-page)" }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Read-only. Change in Account tab.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A short bio about yourself..."
          className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2 resize-none"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
        <p
          className="text-xs mt-1"
          style={{ color: bio.length > 500 ? "var(--color-error)" : "var(--color-text-secondary)" }}
        >
          Optional. Shown on your profile. {bio.length}/500
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Used for email and date formatting.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Used for email and date formatting.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
