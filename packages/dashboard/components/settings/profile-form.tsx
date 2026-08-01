"use client";

import { useState, useRef } from "react";
import { trpc } from "@lib/trpc/client";
import { Button, InputField } from "@/components/dashboard/primitives";
import { useToast } from "@/components/dashboard/toast-provider";

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
  "var(--color-primary)", "#1A56DB", "#0d9488", "#059669", "#C27803",
  "#E02424", "#db2777", "#0891b2", "#be185d", "#0284c7",
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
    avatar: string | null;
  }) => void;
  saving?: boolean;
}

export function ProfileForm({ initialData, onSave, saving }: ProfileFormProps) {
  const { addToast } = useToast();
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [language, setLanguage] = useState(initialData?.language ?? "en");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "UTC");
  // avatarUrl = the persisted CDN URL we save; preview = transient data URL
  // shown while the upload is in flight.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatarUrl ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presignMutation = trpc.upload.presign.useMutation();
  const confirmMutation = trpc.upload.confirm.useMutation();

  const avatarShown = preview ?? avatarUrl;

  const initials = (initialData?.initials ?? fullName)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const initialsColor = getInitialsColor(initialData?.initials ?? fullName);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Real upload: presign → PUT body → confirm. Previously only a transient
    // createObjectURL blob was kept, so the avatar vanished on reload.
    setUploading(true);
    try {
      const result = await presignMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        context: "avatar",
      });
      await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const confirmed = await confirmMutation.mutateAsync({ fileId: result.fileId });
      setAvatarUrl(confirmed.cdnUrl);
    } catch (err) {
      // Was a bare try/finally — an upload failure threw an unhandled rejection
      // with zero user feedback. Toast it and drop the optimistic preview.
      addToast("error", "Couldn't upload photo", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }

  function handleRemovePhoto() {
    setAvatarUrl(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({ fullName, displayName, bio, language, timezone, avatar: avatarUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-5">
        {avatarShown ? (
          <img
            src={avatarShown}
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload photo"}
            </Button>
            {avatarShown && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                Remove photo
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            JPG or PNG. Max 5 MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Full name
          </label>
          <InputField
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
          />
          <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Appears on published sites.
          </p>
        </div>

        <div>
          <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Display name
          </label>
          <InputField
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="jane"
          />
          <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Shown to team members.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Email
        </label>
        <InputField
          type="email"
          value={initialData?.email ?? ""}
          readOnly
        />
        <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Read-only. Change in Account tab.
        </p>
      </div>

      <div>
        <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A short bio about yourself..."
          className="w-full px-3 py-2 text-body rounded-md border outline-none focus:ring-2 resize-none"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
        <p
          className="text-body-sm mt-1"
          style={{ color: bio.length > 500 ? "var(--color-error)" : "var(--color-text-secondary)" }}
        >
          Optional. Shown on your profile. {bio.length}/500
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-body rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Used for email and date formatting.
          </p>
        </div>

        <div>
          <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-body rounded-md border outline-none focus:ring-2"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-body-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Used for email and date formatting.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
