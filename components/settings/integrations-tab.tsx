"use client";

import { useState } from "react";

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
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.zapier.com/…" }],
  },
  {
    provider: "SLACK" as const,
    name: "Slack",
    description: "Get notifications",
    icon: "MessageSquare",
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/…" }],
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
  saving?: boolean;
}

function IconPlaceholder({ name }: { name: string }) {
  const labels: Record<string, string> = {
    BarChart3: "📊",
    Mail: "✉️",
    Zap: "⚡",
    MessageSquare: "💬",
  };
  return <span className="text-xl">{labels[name] ?? "🔌"}</span>;
}

export function IntegrationsTab({ connected = [], onAdd, onRemove, saving }: IntegrationsTabProps) {
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
        const values = fieldValues[cfg.provider] ?? {};

        return (
          <div
            key={cfg.provider}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <IconPlaceholder name={cfg.icon} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                    {cfg.name}
                  </p>
                  <p className="text-xs" style={{ color: "#7A7A7A" }}>
                    {cfg.description}
                  </p>
                </div>
                {connection && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                  >
                    Connected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {connection ? (
                  <button
                    type="button"
                    onClick={() => onRemove?.(connection.id)}
                    disabled={saving}
                    className="text-sm px-3 py-1.5 rounded-md border disabled:opacity-60"
                    style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProvider(isExpanded ? null : cfg.provider)
                    }
                    className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
                    style={{ backgroundColor: "#E42313" }}
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {isExpanded && !connection && (
              <div
                className="px-4 pb-4 pt-2 space-y-3"
                style={{ borderTop: "1px solid #E8E8E8", backgroundColor: "#fafafa" }}
              >
                {cfg.fields.map((field) => (
                  <div key={field.key}>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "#0D0D0D" }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={values[field.key] ?? ""}
                      onChange={(e) => handleFieldChange(cfg.provider, field.key, e.target.value)}
                      placeholder={"placeholder" in field ? field.placeholder : ""}
                      className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                      style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleConnect(cfg.provider)}
                    disabled={saving}
                    className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
                    style={{ backgroundColor: "#E42313" }}
                  >
                    {saving ? "Connecting…" : "Save & connect"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedProvider(null)}
                    className="text-sm px-4 py-2 rounded-md border"
                    style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
