"use client";
import { useState } from "react";

interface SettingsTabProps {
  site: {
    id: string; name: string; slug: string;
    headCode: string | null; bodyCode: string | null;
    socialLinks: Record<string, string> | null;
    metaTitleTemplate: string | null;
  };
  onSave: (data: Record<string, unknown>) => void;
}

export function SettingsTab({ site, onSave }: SettingsTabProps) {
  const [name, setName] = useState(site.name);
  const [slug, setSlug] = useState(site.slug);
  const [headCode, setHeadCode] = useState(site.headCode ?? "");
  const [bodyCode, setBodyCode] = useState(site.bodyCode ?? "");

  return (
    <div className="space-y-6">
      <Section title="General">
        <Field label="Site Name" hint="This appears in browser tabs and search results">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
        </Field>
        <Field label="Slug" hint={`${slug}.buildrik.app`}>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
        </Field>
      </Section>
      <Section title="Custom Code (Pro+)">
        <Field label="Head Code" hint="Injected before </head>. Max 10KB.">
          <textarea value={headCode} onChange={(e) => setHeadCode(e.target.value)} rows={4} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" style={{ borderColor: "#E8E8E8" }} />
        </Field>
        <Field label="Body Code" hint="Injected before </body>. Max 10KB.">
          <textarea value={bodyCode} onChange={(e) => setBodyCode(e.target.value)} rows={4} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" style={{ borderColor: "#E8E8E8" }} />
        </Field>
      </Section>
      <button onClick={() => onSave({ name, slug, headCode, bodyCode })} className="rounded-lg px-6 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Save Changes</button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{label}</label>
      {hint && <p className="text-xs" style={{ color: "#B0B0B0" }}>{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
