"use client";

import { useState } from "react";

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

interface ProfileFormProps {
  initialData?: {
    fullName?: string;
    displayName?: string;
    bio?: string;
    language?: string;
    timezone?: string;
    initials?: string;
  };
  onSave?: (data: {
    fullName: string;
    displayName: string;
    bio: string;
    language: string;
    timezone: string;
  }) => void;
  saving?: boolean;
}

export function ProfileForm({ initialData, onSave, saving }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [language, setLanguage] = useState(initialData?.language ?? "en");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "UTC");

  const initials = (initialData?.initials ?? fullName)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ fullName, displayName, bio, language, timezone });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-semibold select-none flex-shrink-0"
          style={{ backgroundColor: "#E42313" }}
        >
          {initials || "?"}
        </div>
        <div>
          <button
            type="button"
            className="text-sm font-medium px-3 py-1.5 rounded-md border"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Upload photo
          </button>
          <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
            JPG, PNG or GIF. Max 2 MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          />
          <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
            Used on invoices and legal documents.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="jane"
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          />
          <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
            Shown to teammates and in comments.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A short bio about yourself…"
          className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2 resize-none"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        />
        <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
          {bio.length}/500 characters. Visible on your public profile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
            Controls the interface language.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
            Used for scheduling and date display.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
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
  );
}
