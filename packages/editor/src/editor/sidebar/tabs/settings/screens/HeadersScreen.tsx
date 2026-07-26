/**
 * HeadersScreen — security headers for published site.
 * CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.
 *
 * Persists to Site columns via siteDetail.settings.update; published-site
 * middleware (Phase D) reads these and sets HTTP response headers.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import { createBuildrikApiClient } from "@/services/api-client";
import { Field, Input, Screen, Section, Select, Textarea } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

type XFrameValue = "DENY" | "SAMEORIGIN" | "";
type ReferrerValue =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url"
  | "";

const HSTS_PRESETS: { label: string; seconds: number | null }[] = [
  { label: "Disabled", seconds: null },
  { label: "5 minutes (testing)", seconds: 300 },
  { label: "1 day", seconds: 86400 },
  { label: "1 year", seconds: 31536000 },
  { label: "2 years (recommended)", seconds: 63072000 },
];

export const HeadersScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  registerSaveHandler,
}) => {
  const [csp, setCsp] = React.useState("");
  const [hstsMaxAge, setHstsMaxAge] = React.useState<number | null>(null);
  const [xFrame, setXFrame] = React.useState<XFrameValue>("");
  const [referrer, setReferrer] = React.useState<ReferrerValue>("");
  const [permissions, setPermissions] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    getClient()
      .siteDetail.settings.get.query({ siteId: projectId })
      .then((s) => {
        const settings = s as {
          cspPolicy?: string | null;
          hstsMaxAge?: number | null;
          xFrameOptions?: string | null;
          referrerPolicy?: string | null;
          permissionsPolicy?: string | null;
        };
        setCsp(settings.cspPolicy ?? "");
        setHstsMaxAge(settings.hstsMaxAge ?? null);
        setXFrame((settings.xFrameOptions as XFrameValue) ?? "");
        setReferrer((settings.referrerPolicy as ReferrerValue) ?? "");
        setPermissions(settings.permissionsPolicy ?? "");
        setDirty(false);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load headers."))
      .finally(() => setLoading(false));
  }, [projectId]);

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const markDirty = () => setDirty(true);

  const handleSave = React.useCallback(async () => {
    if (!projectId || !dirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      await getClient().siteDetail.settings.update.mutate({
        id: projectId,
        cspPolicy: csp.trim() || null,
        hstsMaxAge,
        xFrameOptions: xFrame === "" ? null : xFrame,
        referrerPolicy: referrer === "" ? null : referrer,
        permissionsPolicy: permissions.trim() || null,
      });
      setDirty(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save headers.";
      setSaveError(msg);
      // Re-throw so SettingsTab.handleSave catch path keeps savebar visible.
      throw e;
    } finally {
      setSaving(false);
    }
  }, [projectId, dirty, csp, hstsMaxAge, xFrame, referrer, permissions]);

  // Register screen save handler with the central savebar so the
  // "Save" button writes Headers fields rather than calling
  // composer.saveProject() (which doesn't serialize them).
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? handleSave : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, handleSave]);

  if (!projectId) {
    return (
      <Screen>
        <Section title="Headers / Security">
          <div style={emptyStyles}>Open this site from the dashboard to manage headers.</div>
        </Section>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <Section title="Headers / Security">
          <div style={emptyStyles}>Loading…</div>
        </Section>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <Section title="Headers / Security">
          <div role="alert" style={errorStyles}>{loadError}</div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <div role="alert" style={enforcementBannerStyles}>
        <strong>Not yet enforced.</strong> Values save to your site config but
        are not applied to HTTP responses until the published-site middleware
        ships. Treat this screen as storage-only for now.
      </div>
      <Section
        title="Content Security Policy"
        desc="Restricts which scripts, styles, images, and other resources can load on your site. Wrong values can break the site — leave empty to use the platform default."
      >
        <Field label="CSP header value" hint="e.g. default-src 'self'; img-src 'self' data: https:">
          <Textarea
            value={csp}
            onChange={(e) => {
              setCsp(e.target.value);
              markDirty();
            }}
            placeholder="default-src 'self'"
            rows={4}
            disabled={saving}
          />
        </Field>
      </Section>

      <Section
        title="HSTS (HTTP Strict Transport Security)"
        desc="Forces browsers to use HTTPS for the configured duration. Don't enable until your custom domain has a valid certificate — incorrect HSTS can lock visitors out for the entire max-age window."
      >
        <Field label="Max age">
          <Select
            value={String(hstsMaxAge ?? "null")}
            onChange={(e) => {
              const next = e.target.value === "null" ? null : Number(e.target.value);
              setHstsMaxAge(Number.isNaN(next as number) ? null : next);
              markDirty();
            }}
            disabled={saving}
          >
            {HSTS_PRESETS.map((p) => (
              <option key={p.label} value={p.seconds === null ? "null" : String(p.seconds)}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section
        title="X-Frame-Options"
        desc="Controls whether your site can be embedded in an iframe. DENY blocks all framing; SAMEORIGIN allows only your own site."
      >
        <Field label="Policy">
          <Select
            value={xFrame}
            onChange={(e) => {
              setXFrame(e.target.value as XFrameValue);
              markDirty();
            }}
            disabled={saving}
          >
            <option value="">Not set</option>
            <option value="DENY">DENY — block all framing</option>
            <option value="SAMEORIGIN">SAMEORIGIN — only own origin</option>
          </Select>
        </Field>
      </Section>

      <Section
        title="Referrer-Policy"
        desc="Controls how much information browsers send in the Referer header when visitors click off your site."
      >
        <Field label="Policy">
          <Select
            value={referrer}
            onChange={(e) => {
              setReferrer(e.target.value as ReferrerValue);
              markDirty();
            }}
            disabled={saving}
          >
            <option value="">Not set</option>
            <option value="no-referrer">no-referrer</option>
            <option value="no-referrer-when-downgrade">no-referrer-when-downgrade</option>
            <option value="origin">origin</option>
            <option value="origin-when-cross-origin">origin-when-cross-origin</option>
            <option value="same-origin">same-origin</option>
            <option value="strict-origin">strict-origin</option>
            <option value="strict-origin-when-cross-origin">strict-origin-when-cross-origin (recommended)</option>
            <option value="unsafe-url">unsafe-url</option>
          </Select>
        </Field>
      </Section>

      <Section
        title="Permissions-Policy"
        desc="Restricts which browser features (camera, microphone, geolocation, etc.) your site can use. Comma-separated list of features with origin allowlists."
      >
        <Field label="Header value" hint="e.g. camera=(), microphone=(), geolocation=(self)">
          <Input
            value={permissions}
            onChange={(e) => {
              setPermissions(e.target.value);
              markDirty();
            }}
            placeholder="camera=(), microphone=()"
            disabled={saving}
          />
        </Field>
      </Section>

      <Section title="">
        {saveError && (
          <div role="alert" style={errorStyles}>{saveError}</div>
        )}
        <Button
          kind="primary"
          size="sm"
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save headers"}
        </Button>
      </Section>
    </Screen>
  );
};

const emptyStyles: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  background: "var(--bk-bg-subtle)",
  border: "1px dashed var(--bk-border-medium)",
  borderRadius: 6,
};

const errorStyles: React.CSSProperties = {
  marginTop: 4,
  marginBottom: 8,
  padding: "8px 10px",
  font: "500 11.5px var(--bk-font-ui)",
  color: "var(--bk-error)",
  background: "rgba(220, 38, 38, 0.06)",
  border: "1px solid rgba(220, 38, 38, 0.25)",
  borderRadius: 6,
};

const enforcementBannerStyles: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 14px",
  font: "500 12px var(--bk-font-ui)",
  color: "var(--bk-ink)",
  background: "var(--bk-warning-tint)",
  border: "1px solid var(--bk-warning-text)",
  borderLeft: "3px solid var(--bk-warning)",
  borderRadius: 6,
  lineHeight: 1.5,
};

const saveButtonStyles: React.CSSProperties = {
  marginTop: 4,
  padding: "8px 14px",
  font: "600 12px var(--bk-font-ui)",
  color: "var(--bk-ink-muted)",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 6,
  cursor: "not-allowed",
};

const saveButtonActiveStyles: React.CSSProperties = {
  ...saveButtonStyles,
  color: "#fff",
  background: "var(--bk-accent)",
  borderColor: "var(--bk-accent)",
  cursor: "pointer",
};
