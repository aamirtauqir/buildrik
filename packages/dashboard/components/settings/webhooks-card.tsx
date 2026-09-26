"use client";

/**
 * A-12 (A01-6): workspace webhook management, moved here from the editor's
 * in-place Settings screen (WebhooksScreen.tsx) so it lives on the dashboard
 * settings surface with every other integration, using the same
 * trpc.webhooks.* procedures the editor screen called through its own
 * cross-origin api-client. Webhooks are workspace-scoped, not site-scoped,
 * so they belong beside Vercel/Slack/Zapier here regardless of the still-
 * open owner-surface consolidation (PD-1).
 */

import { useEffect, useId, useState } from "react";
import { Checkbox } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { writeClipboardText } from "@lib/clipboard";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, InputField, Pill } from "@/components/dashboard/primitives";
import { IntegrationCard } from "@/components/settings/integration-card";

const EVENTS = [
  { id: "site.publish", label: "site.publish — fires after every successful publish" },
  { id: "form.submit", label: "form.submit — ready, but nothing sends it yet (form capture is unbuilt)" },
] as const;
type EventId = (typeof EVENTS)[number]["id"];
const DEFAULT_EVENTS: EventId[] = ["site.publish", "form.submit"];
const isEventId = (id: string): id is EventId => EVENTS.some((ev) => ev.id === id);

function maskSecret(secret: string): string {
  return `${secret.slice(0, 6)}••••${secret.slice(-4)}`;
}

function ago(when: Date | string): string {
  const ms = Date.now() - new Date(when).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "under a minute ago";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function WebhooksCard() {
  const status = trpc.webhooks.status.useQuery();
  const utils = trpc.useUtils();

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<EventId[]>(DEFAULT_EVENTS);
  const urlId = useId();
  const eventsHeadingId = useId();
  const [confirming, setConfirming] = useState<"regenerate" | "disconnect" | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);
  const { addToast } = useToast();

  const connect = trpc.webhooks.connect.useMutation({
    onSuccess: () => { utils.webhooks.status.invalidate(); setEditing(false); },
  });
  const disconnect = trpc.webhooks.disconnect.useMutation({
    onSuccess: () => { utils.webhooks.status.invalidate(); setConfirming(null); },
  });
  const regenerate = trpc.webhooks.regenerateSecret.useMutation({
    onSuccess: () => { utils.webhooks.status.invalidate(); setConfirming(null); setSecretVisible(true); },
  });

  const forbidden = status.error?.data?.code === "FORBIDDEN";
  const data = status.data ?? null;

  useEffect(() => {
    if (!editing) return;
    setUrl(data?.url ?? "");
    // A stored event this card has no row for is dropped, not cast through.
    setEvents(data ? data.events.filter(isEventId) : DEFAULT_EVENTS);
    // Only re-seed when entering edit mode, not on every status refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const toggleEvent = (id: EventId, checked: boolean) => {
    setEvents((prev) => (checked ? [...prev, id] : prev.filter((e) => e !== id)));
  };

  const right = status.isLoading ? (
    <div className="h-8 w-24 animate-pulse rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
  ) : data ? (
    <Pill tone="success">Connected</Pill>
  ) : !forbidden && !editing ? (
    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}>
      Connect
    </Button>
  ) : null;

  return (
    <IntegrationCard
      tintIndex={1}
      initial="W"
      name="Webhooks"
      description="Workspace event deliveries"
      right={right}
      expandable={!!data || editing || forbidden}
      expanded={expanded || forbidden}
      onToggle={() => setExpanded((v) => !v)}
    >
      {forbidden ? (
        <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          Only a workspace admin can manage webhooks — the signing secret is part of the configuration.
        </p>
      ) : editing ? (
        <div className="space-y-3">
          <div>
            {/* Same eyebrow label the provider fields beside this card use
                (integrations-content), tied to the field by id. */}
            <label htmlFor={urlId} className="mb-1 block text-eyebrow font-medium" style={{ color: "var(--color-text-primary)" }}>Endpoint URL</label>
            <InputField
              id={urlId}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourapp.com/hooks/buildrick"
            />
          </div>
          <div role="group" aria-labelledby={eventsHeadingId}>
            <p id={eventsHeadingId} className="mb-1 block text-eyebrow font-medium" style={{ color: "var(--color-text-primary)" }}>Events</p>
            <div className="space-y-1.5">
              {EVENTS.map((ev) => (
                <label key={ev.id} className="flex items-start gap-2 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <Checkbox
                    color="blue"
                    checked={events.includes(ev.id)}
                    onChange={(e) => toggleEvent(ev.id, e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          {connect.isError && (
            <p className="text-body-sm" style={{ color: "var(--color-error)" }}>{connect.error?.message ?? "Couldn't save the webhook."}</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={connect.isPending || !url.trim() || events.length === 0}
              onClick={() => connect.mutate({ url: url.trim(), events })}
            >
              {connect.isPending ? "Saving…" : data ? "Save changes" : "Connect"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-3">
          <p className="truncate text-body-sm" title={data.url} style={{ color: "var(--color-text-primary)" }}>{data.url}</p>
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Events: {data.events.join(", ")}</p>
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            {!data.lastDeliveryAt
              ? "Never fired yet — publish the site or submit a form to see the first delivery."
              : data.failures24h > 0
                ? `⚠ ${data.failures24h} failed ${data.failures24h === 1 ? "delivery" : "deliveries"} in the last 24h · last attempt ${ago(data.lastDeliveryAt)}`
                : `✓ Delivering — last delivery ${ago(data.lastDeliveryAt)}.`}
          </p>
          <div>
            <p className="mb-1 block text-eyebrow font-medium" style={{ color: "var(--color-text-primary)" }}>Signing secret</p>
            <div className="flex items-center gap-2">
              <code className="text-body-sm">{secretVisible ? data.secret : maskSecret(data.secret)}</code>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSecretVisible((v) => !v)}>{secretVisible ? "Hide" : "Reveal"}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() =>
                  writeClipboardText(data.secret).then(
                    () => addToast("success", "Signing secret copied"),
                    () => addToast("error", "Couldn't copy the secret", "Reveal it and copy it by hand."),
                  )
                }>Copy</Button>
            </div>
          </div>

          {confirming === "regenerate" ? (
            <div className="space-y-2">
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Regenerate the secret? Every existing endpoint stops verifying until you update it with the new secret.
              </p>
              <div className="flex gap-2">
                <Button type="button" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>Regenerate</Button>
                <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
              </div>
            </div>
          ) : confirming === "disconnect" ? (
            <div className="space-y-2">
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Disconnect the endpoint? This is a workspace connection — every site stops sending events immediately.
              </p>
              <div className="flex gap-2">
                <Button type="button" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect</Button>
                <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming("regenerate")}>Regenerate secret</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming("disconnect")}>Disconnect</Button>
            </div>
          )}
        </div>
      ) : null}
    </IntegrationCard>
  );
}
