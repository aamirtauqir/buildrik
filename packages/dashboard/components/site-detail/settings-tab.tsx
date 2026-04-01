"use client";
import { useState, useRef } from "react";
import { trpc } from "@lib/trpc/client";

const SOCIAL_PLATFORMS = ["twitter", "instagram", "linkedin", "youtube", "github"] as const;
type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitter: "Twitter / X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
};

interface SettingsTabProps {
  site: {
    id: string;
    name: string;
    slug: string;
    headCode: string | null;
    bodyCode: string | null;
    socialLinks: Record<string, string> | unknown;
    metaTitleTemplate: string | null;
    publishedPassword: string | null;
    touchIcon: string | null;
    plan: string;
  };
  onSave: (data: Record<string, unknown>) => void;
}

export function SettingsTab({ site, onSave }: SettingsTabProps) {
  const [name, setName] = useState(site.name);
  const [slug, setSlug] = useState(site.slug);
  const [headCode, setHeadCode] = useState(site.headCode ?? "");
  const [bodyCode, setBodyCode] = useState(site.bodyCode ?? "");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(() => {
    const raw = site.socialLinks;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, string>;
    return {};
  });
  const [visiblePlatforms, setVisiblePlatforms] = useState<SocialPlatform[]>(
    SOCIAL_PLATFORMS.filter((p) => socialLinks[p]),
  );
  const [passwordEnabled, setPasswordEnabled] = useState(!!site.publishedPassword);
  const [password, setPassword] = useState(site.publishedPassword ?? "");
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [touchIconPreview, setTouchIconPreview] = useState<string | null>(site.touchIcon);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const touchIconInputRef = useRef<HTMLInputElement>(null);

  const isPro = site.plan !== "FREE";

  const presignMutation = trpc.upload.presign.useMutation();
  const confirmMutation = trpc.upload.confirm.useMutation();

  async function handleFileUpload(
    file: File,
    context: "favicon" | "touch_icon",
    onComplete: (url: string) => void,
  ) {
    const result = await presignMutation.mutateAsync({
      fileName: file.name,
      fileType: file.type,
      context,
      siteId: site.id,
    });
    await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const confirmed = await confirmMutation.mutateAsync({ fileId: result.fileId });
    onComplete(confirmed.cdnUrl);
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFaviconPreview(reader.result as string);
    reader.readAsDataURL(file);
    handleFileUpload(file, "favicon", (url) => setFaviconPreview(url));
  }

  function handleTouchIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTouchIconPreview(reader.result as string);
    reader.readAsDataURL(file);
    handleFileUpload(file, "touch_icon", (url) => setTouchIconPreview(url));
  }

  function updateSocialLink(platform: string, value: string) {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  }

  function addPlatform() {
    const next = SOCIAL_PLATFORMS.find((p) => !visiblePlatforms.includes(p));
    if (next) setVisiblePlatforms((prev) => [...prev, next]);
  }

  function removePlatform(platform: SocialPlatform) {
    setVisiblePlatforms((prev) => prev.filter((p) => p !== platform));
    setSocialLinks((prev) => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  }

  function handleSave() {
    const filteredSocial: Record<string, string> = {};
    for (const [k, v] of Object.entries(socialLinks)) {
      if (v.trim()) filteredSocial[k] = v.trim();
    }

    onSave({
      name,
      slug,
      headCode,
      bodyCode,
      socialLinks: filteredSocial,
      publishedPassword: passwordEnabled ? password : null,
      touchIcon: touchIconPreview,
    });
  }

  return (
    <div className="space-y-6">
      <Section title="General">
        <Field label="Site Name" hint="This appears in browser tabs and search results">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#E8E8E8" }}
          />
        </Field>
        <Field label="Slug" hint={`${slug}.buildrik.app`}>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#E8E8E8" }}
          />
        </Field>
      </Section>

      <Section title="Favicon & Icons">
        <Field label="Favicon" hint="ICO, PNG, or SVG. Max 500KB.">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              Upload Favicon
            </button>
            <input
              ref={faviconInputRef}
              type="file"
              accept=".ico,.png,.svg"
              onChange={handleFaviconChange}
              className="hidden"
            />
            {faviconPreview && (
              <div className="flex items-center gap-3">
                <img src={faviconPreview} alt="Favicon 16px" className="rounded" style={{ width: 16, height: 16 }} />
                <img src={faviconPreview} alt="Favicon 32px" className="rounded" style={{ width: 32, height: 32 }} />
                <img src={faviconPreview} alt="Favicon 64px" className="rounded" style={{ width: 64, height: 64 }} />
              </div>
            )}
          </div>
        </Field>
        <Field label="Touch Icon (180x180 PNG)" hint="Auto-generated from favicon if not set">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => touchIconInputRef.current?.click()}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              Upload Touch Icon
            </button>
            <input
              ref={touchIconInputRef}
              type="file"
              accept=".png"
              onChange={handleTouchIconChange}
              className="hidden"
            />
            {touchIconPreview && (
              <img
                src={touchIconPreview}
                alt="Touch icon preview"
                className="rounded-lg"
                style={{ width: 60, height: 60 }}
              />
            )}
          </div>
        </Field>
      </Section>

      <Section title="Site Password">
        <ProGate isPro={isPro}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={passwordEnabled}
              onClick={() => {
                if (!isPro) return;
                setPasswordEnabled((v) => !v);
              }}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
              style={{ backgroundColor: passwordEnabled ? "#E42313" : "#E8E8E8" }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: passwordEnabled ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
            <span className="text-sm" style={{ color: "#0D0D0D" }}>
              Require password to view published site
            </span>
          </div>
          {passwordEnabled && (
            <div className="mt-3">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter site password"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "#E8E8E8" }}
              />
            </div>
          )}
        </ProGate>
      </Section>

      <Section title="Custom Code">
        <ProGate isPro={isPro}>
          <Field label="Head Code" hint="Injected before </head>. Max 10KB.">
            <textarea
              value={headCode}
              onChange={(e) => {
                if (!isPro) return;
                setHeadCode(e.target.value);
              }}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ borderColor: "#E8E8E8" }}
              disabled={!isPro}
            />
          </Field>
          <Field label="Body Code" hint="Injected before </body>. Max 10KB.">
            <textarea
              value={bodyCode}
              onChange={(e) => {
                if (!isPro) return;
                setBodyCode(e.target.value);
              }}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ borderColor: "#E8E8E8" }}
              disabled={!isPro}
            />
          </Field>
        </ProGate>
      </Section>

      <Section title="Social Links">
        <div className="space-y-3">
          {visiblePlatforms.map((platform) => (
            <div key={platform} className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-sm font-medium" style={{ color: "#0D0D0D" }}>
                {PLATFORM_LABELS[platform]}
              </label>
              <input
                type="url"
                value={socialLinks[platform] ?? ""}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "#E8E8E8" }}
              />
              <button
                type="button"
                onClick={() => removePlatform(platform)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium"
                style={{ color: "#E42313" }}
              >
                Remove
              </button>
            </div>
          ))}
          {visiblePlatforms.length < SOCIAL_PLATFORMS.length && (
            <button
              type="button"
              onClick={addPlatform}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              + Add Social Link
            </button>
          )}
        </div>
      </Section>

      <button
        onClick={handleSave}
        className="rounded-lg px-6 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "#E42313" }}
      >
        Save Changes
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
        {label}
      </label>
      {hint && (
        <p className="text-xs" style={{ color: "#B0B0B0" }}>
          {hint}
        </p>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ProGate({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {!isPro && (
        <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#FFF8F7" }}>
          <LockIcon />
          <span className="text-xs font-medium" style={{ color: "#E42313" }}>
            Available on Pro
          </span>
        </div>
      )}
      <div className={!isPro ? "pointer-events-none opacity-50" : ""}>{children}</div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E42313" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
