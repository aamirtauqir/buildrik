import type { EmailServiceConfig } from "../../shared/types";

/**
 * Email subscription data for adding contacts to mailing lists
 */
export interface EmailSubscription {
  /** Subscriber email address */
  email: string;
  /** Subscriber name (optional) */
  name?: string;
  /** Tags to apply to the subscriber */
  tags?: string[];
  /** Additional metadata for the subscriber */
  metadata?: Record<string, string>;
}

/**
 * Result of an email subscription operation
 */
export interface SubscriptionResult {
  success: boolean;
  error?: string;
}

/**
 * EmailMarketingService handles integration with email marketing providers
 * Supports: Mailchimp, SendGrid, Mailgun, and Resend
 *
 * L0: Stub — not wired to backend. See backlog.
 * All provider methods log instead of making real API calls.
 * In production, API calls should go through a backend proxy
 * to protect API keys from client-side exposure.
 */
export class EmailMarketingService {
  private config: EmailServiceConfig | null = null;

  /**
   * Configure the email service with provider settings
   */
  configure(config: EmailServiceConfig): void {
    this.config = config;
  }

  /**
   * Get the current configuration
   */
  getConfig(): EmailServiceConfig | null {
    return this.config;
  }

  /**
   * Check if the service is properly configured and enabled
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Subscribe a contact to the configured mailing list
   */
  async subscribe(subscription: EmailSubscription): Promise<SubscriptionResult> {
    if (!this.isConfigured()) {
      return { success: false, error: "Email service not configured" };
    }

    if (!this.config!.listId) {
      return { success: false, error: "List ID not configured" };
    }

    try {
      switch (this.config!.provider) {
        case "mailchimp":
          return await this.subscribeMailchimp(subscription);
        case "sendgrid":
          return await this.subscribeSendGrid(subscription);
        case "mailgun":
          return await this.subscribeMailgun(subscription);
        case "resend":
          return await this.subscribeResend(subscription);
        case "none":
          return { success: false, error: "No email provider selected" };
        default:
          return { success: false, error: "Unknown provider" };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Route subscription through backend proxy.
   * The backend holds provider API keys and handles real delivery.
   * Implement POST /api/email/subscribe in server/src/modules/email/ to activate.
   */
  private async subscribeViaBackendProxy(
    provider: string,
    _subscription: EmailSubscription
  ): Promise<SubscriptionResult> {
    throw new Error(
      `EmailMarketingService: backend proxy endpoint not yet configured. ` +
        `Implement POST /api/email/subscribe in server/src/modules/email/ ` +
        `to enable ${provider} subscriptions.`
    );
  }

  /**
   * Subscribe via Mailchimp API
   * Routed through backend proxy to protect API keys.
   * Backend endpoint: POST https://usX.api.mailchimp.com/3.0/lists/{listId}/members
   */
  private async subscribeMailchimp(subscription: EmailSubscription): Promise<SubscriptionResult> {
    return this.subscribeViaBackendProxy("mailchimp", subscription);
  }

  /**
   * Subscribe via SendGrid API
   * Routed through backend proxy to protect API keys.
   * Backend endpoint: PUT https://api.sendgrid.com/v3/marketing/contacts
   */
  private async subscribeSendGrid(subscription: EmailSubscription): Promise<SubscriptionResult> {
    return this.subscribeViaBackendProxy("sendgrid", subscription);
  }

  /**
   * Subscribe via Mailgun API
   * Routed through backend proxy to protect API keys.
   * Backend endpoint: POST https://api.mailgun.net/v3/lists/{listId}/members
   */
  private async subscribeMailgun(subscription: EmailSubscription): Promise<SubscriptionResult> {
    return this.subscribeViaBackendProxy("mailgun", subscription);
  }

  /**
   * Subscribe via Resend API
   * Routed through backend proxy to protect API keys.
   * Backend endpoint: POST https://api.resend.com/audiences/{audienceId}/contacts
   */
  private async subscribeResend(subscription: EmailSubscription): Promise<SubscriptionResult> {
    return this.subscribeViaBackendProxy("resend", subscription);
  }
}

/** Singleton instance of EmailMarketingService */
export const emailMarketingService = new EmailMarketingService();
