"use client";

import { useState } from "react";
import { Pill, Button, InputField } from "@/components/dashboard/primitives";

export const INTEGRATION_CONFIGS = [
  {
    provider: "GOOGLE_ANALYTICS" as const,
    name: "Google Analytics",
    description: "Track site visitors",
    icon: "BarChart3",
    fields: [{ key: "trackingId", label: "Tracking ID", placeholder: "G-XXXXXXXXXX" }],
  },
  {
    provider: "MAILCHIMP" as const,
    name: "Mailchimp",
    description: "Sync form submissions",
    icon: "Mail",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "" },
      { key: "audienceId", label: "Audience ID", placeholder: "" },
    ],
  },
  {
    provider: "ZAPIER" as const,
    name: "Zapier",
    description: "Automate workflows",
    icon: "Zap",
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.zapier.com/\u2026" }],
  },
  {
    provider: "SLACK" as const,
    name: "Slack",
    description: "Get notifications",
    icon: "MessageSquare",
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/\u2026" }],
  },
] as const;

type Provider = (typeof INTEGRATION_CONFIGS)[number]["provider"];

interface ConnectedIntegration {
  id: string;
  provider: Provider;
  config: Record<string, string>;
}

interface IntegrationsTabProps {
  connected?: ConnectedIntegration[];
  onAdd?: (provider: Provider, config: Record<string, string>) => void;
  onRemove?: (id: string) => void;
  onUpdate?: (id: string, config: Record<string, string>) => void;
  onTestEvent?: (integrationId: string) => void;
  saving?: boolean;
}

const ZAPIER_TRIGGER_EVENTS = [
  { key: "form_submission", label: "Form submission" },
  { key: "site_published", label: "Site published" },
  { key: "member_joined", label: "Member joined" },
];

function IconPlaceholder({ name }: { name: string }) {
  const labels: Record<string, string> = {
    BarChart3: "\uD83D\uDCCA",
    Mail: "\u2709\uFE0F",
    Zap: "\u26A1",
    MessageSquare: "\uD83D\uDCAC",
  };
  return <span className="text-xl">{labels[name] ?? "\uD83D\uDD0C"}</span>;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? "var(--color-primary)" : "var(--color-border-default)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function GoogleAnalyticsConfig({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Tracking ID
        </label>
        <InputField
          type="text"
          value={values["trackingId"] ?? ""}
          onChange={(e) => onChange("trackingId", e.target.value)}
          placeholder="G-XXXXXXXXXX"
          wrapperClassName="w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Apply to all sites
        </p>
        <Toggle
          checked={values["applyToAll"] === "true"}
          onChange={(v) => onChange("applyToAll", String(v))}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Anonymize IP
        </p>
        <Toggle
          checked={values["anonymizeIp"] === "true"}
          onChange={(v) => onChange("anonymizeIp", String(v))}
        />
      </div>
    </div>
  );
}

function MailchimpConfig({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          API Key
        </label>
        <InputField
          type="text"
          value={values["apiKey"] ?? ""}
          onChange={(e) => onChange("apiKey", e.target.value)}
          placeholder="Enter your Mailchimp API key"
          wrapperClassName="w-full"
        />
      </div>
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Audience ID
        </label>
        <InputField
          type="text"
          value={values["audienceId"] ?? ""}
          onChange={(e) => onChange("audienceId", e.target.value)}
          placeholder="Enter your audience ID"
          wrapperClassName="w-full"
        />
      </div>
      {values["audienceId"] && (
        <div
          className="rounded-md p-3 text-body-sm"
          style={{ backgroundColor: "var(--color-bg-page)", color: "var(--color-text-secondary)" }}
        >
          <p className="font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>Field mapping</p>
          <p>Email → EMAIL</p>
          <p>Name → FNAME, LNAME</p>
          <p>Custom fields → MERGE tags</p>
        </div>
      )}
    </div>
  );
}

function ZapierConfig({
  values,
  onChange,
  onTestEvent,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onTestEvent?: () => void;
}) {
  const selectedTriggers = (values["triggers"] ?? "").split(",").filter(Boolean);

  function toggleTrigger(key: string) {
    const updated = selectedTriggers.includes(key)
      ? selectedTriggers.filter((t) => t !== key)
      : [...selectedTriggers, key];
    onChange("triggers", updated.join(","));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Webhook URL
        </label>
        <InputField
          type="text"
          value={values["webhookUrl"] ?? ""}
          onChange={(e) => onChange("webhookUrl", e.target.value)}
          placeholder="https://hooks.zapier.com/\u2026"
          wrapperClassName="w-full"
        />
      </div>
      <div>
        <p className="text-body-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
          Trigger events
        </p>
        <div className="space-y-2">
          {ZAPIER_TRIGGER_EVENTS.map((evt) => (
            <label key={evt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTriggers.includes(evt.key)}
                onChange={() => toggleTrigger(evt.key)}
                className="rounded"
              />
              <span className="text-body-sm" style={{ color: "var(--color-text-primary)" }}>
                {evt.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      {values["webhookUrl"] && onTestEvent && (
        <Button type="button" variant="ghost" size="sm" onClick={onTestEvent}>
          Send test event
        </Button>
      )}
    </div>
  );
}

function SlackConfig({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Webhook URL
        </label>
        <InputField
          type="text"
          value={values["webhookUrl"] ?? ""}
          onChange={(e) => onChange("webhookUrl", e.target.value)}
          placeholder="https://hooks.slack.com/\u2026"
          wrapperClassName="w-full"
        />
      </div>
      <div>
        <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Channel name
        </label>
        <InputField
          type="text"
          value={values["channelName"] ?? ""}
          onChange={(e) => onChange("channelName", e.target.value)}
          placeholder="#general"
          wrapperClassName="w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Quiet hours
          </p>
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Suppress notifications 10 PM - 8 AM
          </p>
        </div>
        <Toggle
          checked={values["quietHours"] === "true"}
          onChange={(v) => onChange("quietHours", String(v))}
        />
      </div>
    </div>
  );
}

function ProviderConfigFields({
  provider,
  values,
  onChange,
  onTestEvent,
}: {
  provider: Provider;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onTestEvent?: () => void;
}) {
  switch (provider) {
    case "GOOGLE_ANALYTICS":
      return <GoogleAnalyticsConfig values={values} onChange={onChange} />;
    case "MAILCHIMP":
      return <MailchimpConfig values={values} onChange={onChange} />;
    case "ZAPIER":
      return <ZapierConfig values={values} onChange={onChange} onTestEvent={onTestEvent} />;
    case "SLACK":
      return <SlackConfig values={values} onChange={onChange} />;
  }
}

export function IntegrationsTab({ connected = [], onAdd, onRemove, onUpdate, onTestEvent, saving }: IntegrationsTabProps) {
  const [expandedProvider, setExpandedProvider] = useState<Provider | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  function getConnection(provider: Provider) {
    return connected.find((c) => c.provider === provider);
  }

  function handleFieldChange(provider: Provider, key: string, value: string) {
    setFieldValues((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] ?? {}), [key]: value },
    }));
  }

  function handleConnect(provider: Provider) {
    const config = fieldValues[provider] ?? {};
    onAdd?.(provider, config);
    setExpandedProvider(null);
  }

  return (
    <div className="space-y-3">
      {INTEGRATION_CONFIGS.map((cfg) => {
        const connection = getConnection(cfg.provider);
        const isExpanded = expandedProvider === cfg.provider;
        const values = connection
          ? { ...(connection.config as Record<string, string>), ...(fieldValues[cfg.provider] ?? {}) }
          : fieldValues[cfg.provider] ?? {};

        return (
          <div
            key={cfg.provider}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: connection ? "#BCF0DA" : "var(--color-border-default)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <IconPlaceholder name={cfg.icon} />
                <div>
                  <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {cfg.name}
                  </p>
                  <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {cfg.description}
                  </p>
                </div>
                {connection ? (
                  <Pill tone="success">Connected</Pill>
                ) : (
                  <Pill tone="neutral">Disconnected</Pill>
                )}
              </div>

              <div className="flex items-center gap-2">
                {connection ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedProvider(isExpanded ? null : cfg.provider)
                      }
                    >
                      {isExpanded ? "Hide" : "Configure"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove?.(connection.id)}
                      disabled={saving}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setExpandedProvider(isExpanded ? null : cfg.provider)
                    }
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div
                className="px-4 pb-4 pt-2 space-y-3"
                style={{ borderTop: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-page)" }}
              >
                <ProviderConfigFields
                  provider={cfg.provider}
                  values={values}
                  onChange={(key, value) => handleFieldChange(cfg.provider, key, value)}
                  onTestEvent={connection ? () => onTestEvent?.(connection.id) : undefined}
                />
                <div className="flex gap-2 pt-1">
                  {!connection && (
                    <Button
                      type="button"
                      onClick={() => handleConnect(cfg.provider)}
                      disabled={saving}
                    >
                      {saving ? "Connecting\u2026" : "Save & connect"}
                    </Button>
                  )}
                  {connection && (
                    <Button
                      type="button"
                      onClick={() => onUpdate?.(connection.id, values)}
                      disabled={saving}
                    >
                      {saving ? "Saving\u2026" : "Save changes"}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={() => setExpandedProvider(null)}>
                    {connection ? "Close" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
