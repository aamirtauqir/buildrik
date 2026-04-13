/**
 * Integrations screen — functional project-settings wiring for payments and email.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { EmailServiceConfig, StripeConfig } from "../../../../../shared/types/project";
import { StickyFooter } from "../../../shared/StickyFooter";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { Field, Section, Toggle } from "../shared";

import type { ScreenProps } from "../types";

const DEFAULT_STRIPE: StripeConfig = {
  enabled: false,
  publishableKey: "",
  checkoutMode: "payment-links",
  currency: "USD",
};

const DEFAULT_EMAIL: EmailServiceConfig = {
  provider: "none",
  enabled: false,
};

const EMAIL_PROVIDERS: EmailServiceConfig["provider"][] = [
  "none",
  "mailchimp",
  "sendgrid",
  "mailgun",
  "resend",
];

export const IntegrationsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const { value: savedIntegrations } = useSettingsScreen(
    composer,
    (settings) => ({
      stripe: settings.integrations?.stripe ?? DEFAULT_STRIPE,
      email: settings.integrations?.email ?? DEFAULT_EMAIL,
    }),
    {
      stripe: DEFAULT_STRIPE,
      email: DEFAULT_EMAIL,
    }
  );

  const [stripe, setStripe] = React.useState<StripeConfig>(savedIntegrations.stripe);
  const [email, setEmail] = React.useState<EmailServiceConfig>(savedIntegrations.email);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setStripe(savedIntegrations.stripe);
    setEmail(savedIntegrations.email);
    setHasChanges(false);
  }, [savedIntegrations]);

  React.useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleSave = () => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      integrations: {
        ...current.integrations,
        stripe,
        email,
      },
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setStripe(savedIntegrations.stripe);
    setEmail(savedIntegrations.email);
    setHasChanges(false);
  };

  return (
    <div className="aqb-st-screen">
      <Section title="Stripe Checkout">
        <Toggle
          label="Enable Stripe"
          checked={stripe.enabled}
          onChange={(enabled) => {
            setStripe((prev) => ({ ...prev, enabled }));
            setHasChanges(true);
          }}
        />

        <Field label="Stripe Publishable Key" htmlFor="stripe-publishable-key">
          <input
            id="stripe-publishable-key"
            className="aqb-st-input"
            type="text"
            value={stripe.publishableKey}
            onChange={(e) => {
              setStripe((prev) => ({ ...prev, publishableKey: e.target.value }));
              setHasChanges(true);
            }}
            placeholder="pk_test_..."
          />
        </Field>

        <Field label="Checkout Mode" htmlFor="stripe-checkout-mode">
          <select
            id="stripe-checkout-mode"
            className="aqb-st-input"
            value={stripe.checkoutMode}
            onChange={(e) => {
              setStripe((prev) => ({
                ...prev,
                checkoutMode: e.target.value as StripeConfig["checkoutMode"],
              }));
              setHasChanges(true);
            }}
          >
            <option value="payment-links">Payment Links</option>
            <option value="api">API</option>
          </select>
        </Field>
      </Section>

      <Section title="Email Marketing">
        <Field label="Email Provider" htmlFor="email-provider">
          <select
            id="email-provider"
            className="aqb-st-input"
            value={email.provider}
            onChange={(e) => {
              const provider = e.target.value as EmailServiceConfig["provider"];
              setEmail((prev) => ({
                ...prev,
                provider,
                enabled: provider !== "none",
              }));
              setHasChanges(true);
            }}
          >
            {EMAIL_PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider === "none" ? "None" : provider}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Email API Key" htmlFor="email-api-key">
          <input
            id="email-api-key"
            className="aqb-st-input"
            type="text"
            value={email.apiKey ?? ""}
            onChange={(e) => {
              setEmail((prev) => ({ ...prev, apiKey: e.target.value }));
              setHasChanges(true);
            }}
            placeholder="api-key-..."
          />
        </Field>

        <Field label="Audience or List ID" htmlFor="email-list-id">
          <input
            id="email-list-id"
            className="aqb-st-input"
            type="text"
            value={email.listId ?? ""}
            onChange={(e) => {
              setEmail((prev) => ({ ...prev, listId: e.target.value }));
              setHasChanges(true);
            }}
            placeholder="list_123"
          />
        </Field>
      </Section>

      <Section title="Additional Integrations">
        <p style={hintStyles}>
          Form providers and automation connectors still rely on external setup docs. Stripe and
          email settings above are now stored in project settings and used by export/runtime paths.
        </p>
      </Section>

      <StickyFooter
        primaryLabel="Save Changes"
        onPrimary={handleSave}
        secondaryLabel="Cancel"
        onSecondary={handleCancel}
        hasChanges={hasChanges}
        disabled={!composer}
      />
    </div>
  );
};

const hintStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--aqb-text-muted)",
};
