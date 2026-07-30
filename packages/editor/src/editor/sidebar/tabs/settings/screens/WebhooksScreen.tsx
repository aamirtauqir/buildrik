/**
 * WebhooksScreen — workspace webhook endpoint management (P6, Figma Site
 * boards 176:456…727, nested under Integrations in the design).
 *
 * ONE endpoint per workspace: connect form (url + event checkboxes), then a
 * status card — never fired / delivering · last N ago / N failed in 24h with
 * the failure log — plus the masked whsec_ secret with Regenerate and
 * Disconnect confirms. Everything is ADMIN-gated server-side; non-admins see
 * a read-blocked explainer instead of the form (the status endpoint itself
 * is ADMIN — the secret is in the payload).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Checkbox } from "@/editor/ui";
import { createBuildrikApiClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Field, Input, Screen, Section } from "../shared";
import type { ScreenProps } from "../types";
import { Button } from "flowbite-react";

const EVENTS = [
  { id: "site.publish", label: "site.publish — fires after every successful publish" },
  { id: "form.submit", label: "form.submit — fires on every form submission" },
] as const;

type EventId = (typeof EVENTS)[number]["id"];

interface WebhookStatus {
  url: string;
  events: string[];
  secret: string;
  lastDeliveryAt: string | null;
  lastStatus: string | null;
  failures24h: number;
  recentFailures: Array<{ error: string; createdAt: string }>;
}

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function client() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

function maskSecret(secret: string): string {
  return `${secret.slice(0, 6)}••••${secret.slice(-4)}`;
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "under a minute ago";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const WebhooksScreen: React.FC<ScreenProps> = ({ onDirtyChange }) => {
  const [status, setStatus] = React.useState<WebhookStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<EventId[]>(["site.publish", "form.submit"]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [confirming, setConfirming] = React.useState<"regenerate" | "disconnect" | null>(null);
  const [secretVisible, setSecretVisible] = React.useState(false);

  React.useEffect(() => {
    onDirtyChange?.(editing && url.trim().length > 0);
  }, [editing, url, onDirtyChange]);

  const reload = React.useCallback(async () => {
    try {
      const s = (await client().webhooks.status.query()) as WebhookStatus | null;
      setStatus(s);
      setForbidden(false);
      setLoadError(null);
    } catch (e) {
      // Server message for a non-admin is "Insufficient permissions" (403).
      if (e instanceof Error && /insufficient permissions|forbidden/i.test(e.message)) {
        setForbidden(true);
      } else {
        setLoadError("Couldn't load the webhook. Is the dashboard running?");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const startEdit = (existing: WebhookStatus | null) => {
    setUrl(existing?.url ?? "");
    setEvents((existing?.events as EventId[] | undefined) ?? ["site.publish", "form.submit"]);
    setSubmitError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed || events.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await client().webhooks.connect.mutate({ url: trimmed, events });
      setEditing(false);
      await reload();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Couldn't save the webhook.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    setConfirming(null);
    try {
      await client().webhooks.regenerateSecret.mutate();
      setSecretVisible(true); // show the fresh secret so it can be copied once
      await reload();
    } catch {
      setLoadError("Couldn't regenerate the secret.");
    }
  };

  const handleDisconnect = async () => {
    setConfirming(null);
    try {
      await client().webhooks.disconnect.mutate();
      await reload();
    } catch {
      setLoadError("Couldn't disconnect the webhook.");
    }
  };

  const toggleEvent = (id: EventId, checked: boolean) => {
    setEvents((prev) => (checked ? [...prev, id] : prev.filter((e) => e !== id)));
  };

  const renderDeliveryLine = (s: WebhookStatus) => {
    if (!s.lastDeliveryAt) {
      return <div className="bd-set-section-d">Never fired yet — publish the site or submit a form to see the first delivery.</div>;
    }
    if (s.failures24h > 0) {
      return (
        <div className="bd-set-webhook-failline">
          ⚠ {s.failures24h} failed {s.failures24h === 1 ? "delivery" : "deliveries"} in the last 24h · last attempt {ago(s.lastDeliveryAt)}
        </div>
      );
    }
    return <div className="bd-set-section-d">✓ Delivering — last delivery {ago(s.lastDeliveryAt)}.</div>;
  };

  if (forbidden) {
    return (
      <Screen>
        <Section title="Webhooks" desc="Send workspace events to your own endpoint.">
          <div className="bd-set-section-d">
            Only an admin can manage webhooks — the signing secret is part of the configuration.
            Ask a workspace admin to set this up.
          </div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Section
        title="Webhooks"
        desc="One endpoint per workspace. Buildrick POSTs JSON, signed with HMAC-SHA256 in the x-buildrick-signature header."
      >
        {loading && <div className="bd-set-section-d">Loading…</div>}
        {loadError && <div className="bd-set-section-d">{loadError}</div>}

        {!loading && !status && !editing && (
          <div className="bd-set-webhook-empty">
            <div className="bd-set-section-d">No endpoint connected.</div>
            <Button color="light" size="xs" onClick={() => startEdit(null)}>
              Connect endpoint
            </Button>
          </div>
        )}

        {editing && (
          <div className="bd-set-webhook-form">
            <Field label="Endpoint URL" hint="HTTPS endpoint that receives POST deliveries">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.yourapp.com/hooks/buildrick" autoFocus />
            </Field>
            <Field label="Events">
              <div className="bd-set-webhook-events">
                {EVENTS.map((ev) => (
                  <label key={ev.id} className="bd-set-webhook-event">
                    <Checkbox
                      checked={events.includes(ev.id)}
                      onChange={(e) => toggleEvent(ev.id, e.target.checked)}
                    />
                    <span>{ev.label}</span>
                  </label>
                ))}
              </div>
            </Field>
            {submitError && <div className="bd-set-section-d">{submitError}</div>}
            <div className="bd-set-webhook-actions">
              <Button
                size="xs"
                disabled={submitting || !url.trim() || events.length === 0}
                onClick={() => void handleSave()}
              >
                {submitting ? "Saving…" : status ? "Save changes" : "Connect"}
              </Button>
              <Button color="light" size="xs" onClick={() => setEditing(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!editing && status && (
          <div className="bd-set-webhook-card">
            <div className="bd-set-webhook-url" title={status.url}>{status.url}</div>
            <div className="bd-set-section-d">Events: {status.events.join(", ")}</div>
            {renderDeliveryLine(status)}

            {status.recentFailures.length > 0 && (
              <div className="bd-set-webhook-faillog">
                {status.recentFailures.map((f, i) => (
                  <div key={i} className="bd-set-webhook-failrow">
                    <span>{ago(f.createdAt)}</span>
                    <span title={f.error}>{f.error}</span>
                  </div>
                ))}
              </div>
            )}

            <Field label="Signing secret" hint="Verify deliveries by recomputing the HMAC with this secret">
              <div className="bd-set-webhook-secret">
                <code>{secretVisible ? status.secret : maskSecret(status.secret)}</code>
                <Button color="light" size="xs" onClick={() => setSecretVisible((v) => !v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                  {secretVisible ? "Hide" : "Reveal"}
                </Button>
                <Button color="light" size="xs" onClick={() => void navigator.clipboard?.writeText(status.secret)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                  Copy
                </Button>
              </div>
            </Field>

            {confirming === "regenerate" && (
              <div className="bd-set-webhook-confirm">
                <div className="bd-set-section-d">
                  Regenerate the secret? Every existing endpoint stops verifying until you update it
                  with the new secret.
                </div>
                <div className="bd-set-webhook-actions">
                  <Button size="xs" onClick={() => void handleRegenerate()}>Regenerate</Button>
                  <Button color="light" size="xs" onClick={() => setConfirming(null)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Cancel</Button>
                </div>
              </div>
            )}
            {confirming === "disconnect" && (
              <div className="bd-set-webhook-confirm">
                <div className="bd-set-section-d">
                  Disconnect the endpoint? This is a workspace connection — every site stops sending
                  events immediately.
                </div>
                <div className="bd-set-webhook-actions">
                  <Button size="xs" onClick={() => void handleDisconnect()}>Disconnect</Button>
                  <Button color="light" size="xs" onClick={() => setConfirming(null)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Cancel</Button>
                </div>
              </div>
            )}

            {confirming === null && (
              <div className="bd-set-webhook-actions">
                <Button color="light" size="xs" onClick={() => startEdit(status)}>Edit</Button>
                <Button color="light" size="xs" onClick={() => setConfirming("regenerate")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Regenerate secret</Button>
                <Button color="light" size="xs" onClick={() => setConfirming("disconnect")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Disconnect</Button>
              </div>
            )}
          </div>
        )}
      </Section>
    </Screen>
  );
};
