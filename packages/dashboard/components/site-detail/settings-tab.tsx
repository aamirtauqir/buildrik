"use client";
import { useState, useRef } from "react";
import { ToggleSwitch } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { useUnsavedChanges } from "@lib/hooks/use-unsaved-changes";
import { Button, InputField, SectionCard } from "@/components/dashboard/primitives";
import { useToast } from "@/components/dashboard/toast-provider";

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
    hasPublishedPassword: boolean;
    touchIcon: string | null;
    favicon: string | null;
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
  // The server redacts the hash and returns a boolean. Initializing from the
  // (always-null) publishedPassword made the toggle default off and then saved
  // publishedPassword:null on every unrelated save, silently clearing it.
  const [passwordEnabled, setPasswordEnabled] = useState(site.hasPublishedPassword);
  const [password, setPassword] = useState("");
  const [faviconPreview, setFaviconPreview] = useState<string | null>(site.favicon);
  const [touchIconPreview, setTouchIconPreview] = useState<string | null>(site.touchIcon);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const touchIconInputRef = useRef<HTMLInputElement>(null);

  const isPro = site.plan !== "FREE";

  // Warn before losing edits — worst case here is pasted custom head/body code
  // vanishing on an accidental reload.
  const dirty =
    name !== site.name ||
    slug !== site.slug ||
    headCode !== (site.headCode ?? "") ||
    bodyCode !== (site.bodyCode ?? "") ||
    passwordEnabled !== site.hasPublishedPassword ||
    password.length > 0;
  useUnsavedChanges(dirty);

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

  // Show a local FileReader preview while the real upload runs, but on failure
  // REVERT to the last saved value — otherwise the base64 data URL stuck around
  // and Save persisted a giant data: URI into the site's favicon (and the
  // published <link rel=icon>). `uploading` also gates Save so a click can't
  // persist the transient preview mid-upload.
  async function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previous = faviconPreview;
    const reader = new FileReader();
    reader.onload = () => setFaviconPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      await handleFileUpload(file, "favicon", (url) => setFaviconPreview(url));
    } catch (err) {
      setFaviconPreview(previous);
      addToast("error", "Couldn't upload favicon", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleTouchIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previous = touchIconPreview;
    const reader = new FileReader();
    reader.onload = () => setTouchIconPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      await handleFileUpload(file, "touch_icon", (url) => setTouchIconPreview(url));
    } catch (err) {
      setTouchIconPreview(previous);
      addToast("error", "Couldn't upload touch icon", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
    }
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

    // Only touch publishedPassword on an explicit change. Omitting it (the
    // server skips undefined) preserves the existing hash, so unrelated saves
    // no longer wipe the password.
    const data: Record<string, unknown> = {
      name,
      slug,
      headCode,
      bodyCode,
      socialLinks: filteredSocial,
      // Never persist a transient FileReader data: URL (a failed/in-flight
      // upload) — fall back to the last saved value so a giant base64 blob can't
      // land in the column and the published <link rel=icon>.
      touchIcon: touchIconPreview?.startsWith("data:") ? site.touchIcon : touchIconPreview,
      favicon: faviconPreview?.startsWith("data:") ? site.favicon : faviconPreview,
    };
    if (!passwordEnabled) {
      if (site.hasPublishedPassword) data.publishedPassword = null; // explicit removal
    } else if (password) {
      data.publishedPassword = password; // set or changed
    } // enabled + blank field = keep existing (omit)

    onSave(data);
  }

  return (
    <div className="space-y-6">
      <SectionCard title="General">
        <div className="space-y-4">
          <Field label="Site Name" hint="This appears in browser tabs and search results">
            <InputField
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Slug" hint="Used in your site's URL.">
            <InputField
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Favicon & Icons">
        <div className="space-y-4">
          <Field label="Favicon" hint="ICO, PNG, or SVG. Max 500KB.">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => faviconInputRef.current?.click()}>
                Upload Favicon
              </Button>
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
              <Button type="button" variant="ghost" onClick={() => touchIconInputRef.current?.click()}>
                Upload Touch Icon
              </Button>
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
        </div>
      </SectionCard>

      <SectionCard title="Site Password">
        <ProGate isPro={isPro}>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={passwordEnabled}
              onChange={(next) => {
                if (!isPro) return;
                setPasswordEnabled(next);
              }}
              aria-label="Site password"
            />
            <span className="text-body" style={{ color: "var(--color-text-primary)" }}>
              Require password to view published site
            </span>
          </div>
          {/* The password is enforced by Vercel deployment protection, and the
              publish worker is the only thing that pushes it
              (`publish.service.ts` — "Reconcile published-site password
              protection on the live URL"). Saving here changes the stored
              value and nothing on the live site, so a site switched ON stays
              open to anyone with the URL until the next publish. The toggle
              said none of that. */}
          <p className="mt-2 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Applied when you next publish — the live site keeps its current access until then.
          </p>
          {passwordEnabled && (
            <div className="mt-3">
              <InputField
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter site password"
              />
            </div>
          )}
        </ProGate>
      </SectionCard>

      <SectionCard title="Custom Code">
        <ProGate isPro={isPro}>
          {/* The editor's own Advanced screen carries this warning; this copy of
              the same two fields did not, so a Pro user could paste an inline
              analytics snippet here, save, and never learn that the export
              sanitiser drops it (`sanitizeHeadCode`, applied to both fields). */}
          <p className="mb-3 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Scripts must load from a file — <code>&lt;script src=&quot;…&quot;&gt;</code>. Inline
            JavaScript is removed when the site is published.
          </p>
          <Field label="Head Code" hint="Injected before </head> on publish. Max 10KB.">
            <textarea
              value={headCode}
              onChange={(e) => {
                if (!isPro) return;
                setHeadCode(e.target.value);
              }}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-body font-mono"
              style={{ borderColor: "var(--color-border-default)" }}
              disabled={!isPro}
            />
          </Field>
          <Field label="Body Code" hint="Injected before </body> on publish. Max 10KB.">
            <textarea
              value={bodyCode}
              onChange={(e) => {
                if (!isPro) return;
                setBodyCode(e.target.value);
              }}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-body font-mono"
              style={{ borderColor: "var(--color-border-default)" }}
              disabled={!isPro}
            />
          </Field>
        </ProGate>
      </SectionCard>

      <SectionCard title="Social Links">
        <div className="space-y-3">
          {visiblePlatforms.map((platform) => (
            <div key={platform} className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                {PLATFORM_LABELS[platform]}
              </label>
              <InputField
                type="url"
                value={socialLinks[platform] ?? ""}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                wrapperClassName="flex-1"
              />
              <button
                type="button"
                onClick={() => removePlatform(platform)}
                className="shrink-0 rounded-lg px-2 py-1 text-body-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                Remove
              </button>
            </div>
          ))}
          {visiblePlatforms.length < SOCIAL_PLATFORMS.length && (
            <Button type="button" variant="ghost" onClick={addPlatform}>
              + Add Social Link
            </Button>
          )}
        </div>
      </SectionCard>

      <Button onClick={handleSave} disabled={uploading}>
        Save Changes
      </Button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </label>
      {hint && (
        <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
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
          <span className="text-body-sm font-medium" style={{ color: "var(--color-primary)" }}>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
