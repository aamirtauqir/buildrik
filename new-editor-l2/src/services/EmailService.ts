/**
 * EmailService - Handle email notifications for form submissions
 * @module services/EmailService
 * @license BSD-3-Clause
 */

import { escapeHTML } from "../shared/utils/html/encoding";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Email template types
 */
export type EmailTemplate = "form_confirmation" | "form_notification" | "welcome" | "custom";

/**
 * Email recipient configuration
 */
export interface EmailRecipient {
  /** Email address */
  email: string;
  /** Display name (optional) */
  name?: string;
}

/**
 * Email message configuration
 */
export interface EmailMessage {
  /** Recipient(s) */
  to: EmailRecipient | EmailRecipient[];
  /** Email subject */
  subject: string;
  /** Plain text body */
  text?: string;
  /** HTML body (optional) */
  html?: string;
  /** Reply-to address */
  replyTo?: string;
  /** CC recipients */
  cc?: EmailRecipient[];
  /** Template to use */
  template?: EmailTemplate;
  /** Template variables */
  templateVars?: Record<string, string>;
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
  /** Provider type */
  provider: "smtp" | "sendgrid" | "mailgun" | "resend" | "mock";
  /** API key for cloud providers */
  apiKey?: string;
  /** From email address */
  fromEmail: string;
  /** From name */
  fromName?: string;
  /** SMTP configuration */
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
}

/**
 * Result of sending an email
 */
export interface EmailSendResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Message ID if successful */
  messageId?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Form submission email options
 */
export interface FormEmailOptions {
  /** Send confirmation to form submitter */
  sendConfirmation: boolean;
  /** Confirmation email subject */
  confirmationSubject?: string;
  /** Confirmation email body template */
  confirmationBody?: string;
  /** Send notification to site owner */
  sendNotification: boolean;
  /** Notification email recipients */
  notificationRecipients?: string[];
  /** Notification email subject */
  notificationSubject?: string;
  /** Subscribe form submitter to mailing list via EmailMarketingService */
  subscribeToList?: boolean;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const TEMPLATES: Record<
  EmailTemplate,
  (vars: Record<string, string>) => { subject: string; html: string; text: string }
> = {
  form_confirmation: (vars) => ({
    subject: vars.subject || "Thank you for your submission",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Thank You!</h1>
        <p>We've received your submission and will get back to you soon.</p>
        ${vars.details ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">${vars.details}</div>` : ""}
        <p style="color: #666; font-size: 14px;">This is an automated message. Please do not reply.</p>
      </div>
    `,
    text: `Thank you!\n\nWe've received your submission and will get back to you soon.\n\n${vars.details || ""}\n\nThis is an automated message. Please do not reply.`,
  }),

  form_notification: (vars) => ({
    subject: vars.subject || "New Form Submission",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Form Submission</h1>
        <p>A new form submission has been received:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${vars.formData || "No data provided"}
        </div>
        <p style="color: #666; font-size: 14px;">Form: ${vars.formName || "Unknown"} | Submitted: ${vars.timestamp || new Date().toISOString()}</p>
      </div>
    `,
    text: `New Form Submission\n\nA new form submission has been received:\n\n${vars.formData || "No data provided"}\n\nForm: ${vars.formName || "Unknown"} | Submitted: ${vars.timestamp || new Date().toISOString()}`,
  }),

  welcome: (vars) => ({
    subject: vars.subject || "Welcome!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome${vars.name ? `, ${vars.name}` : ""}!</h1>
        <p>Thank you for signing up. We're excited to have you.</p>
      </div>
    `,
    text: `Welcome${vars.name ? `, ${vars.name}` : ""}!\n\nThank you for signing up. We're excited to have you.`,
  }),

  custom: (vars) => ({
    subject: vars.subject || "Message",
    html: vars.html || `<p>${vars.text || ""}</p>`,
    text: vars.text || "",
  }),
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * EmailService
 * Handles email sending with multiple provider support
 */
export class EmailService {
  private config: EmailProviderConfig | null = null;
  private sentEmails: EmailMessage[] = []; // For mock provider testing

  /**
   * Configure the email service
   */
  configure(config: EmailProviderConfig): void {
    this.config = config;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Send an email
   */
  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.config) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      // Apply template if specified
      let finalMessage = message;
      if (message.template) {
        const templateFn = TEMPLATES[message.template];
        const templateResult = templateFn(message.templateVars || {});
        finalMessage = {
          ...message,
          subject: message.subject || templateResult.subject,
          html: message.html || templateResult.html,
          text: message.text || templateResult.text,
        };
      }

      // Route to appropriate provider
      switch (this.config.provider) {
        case "mock":
          return this.sendMock(finalMessage);
        case "sendgrid":
          return this.sendSendGrid(finalMessage);
        case "mailgun":
          return this.sendMailgun(finalMessage);
        case "resend":
          return this.sendResend(finalMessage);
        case "smtp":
          return this.sendSMTP(finalMessage);
        default:
          return { success: false, error: "Unknown email provider" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send form submission emails
   */
  async sendFormEmails(
    formId: string,
    formData: Record<string, unknown>,
    submitterEmail: string | undefined,
    options: FormEmailOptions
  ): Promise<{ confirmation?: EmailSendResult; notification?: EmailSendResult }> {
    const results: { confirmation?: EmailSendResult; notification?: EmailSendResult } = {};

    // Format form data for display (escape HTML to prevent XSS)
    const formDataHtml = Object.entries(formData)
      .map(([key, value]) => `<strong>${escapeHTML(key)}:</strong> ${escapeHTML(String(value))}`)
      .join("<br>");

    // Send confirmation to submitter
    if (options.sendConfirmation && submitterEmail) {
      results.confirmation = await this.send({
        to: { email: submitterEmail },
        subject: options.confirmationSubject || "Thank you for your submission",
        template: "form_confirmation",
        templateVars: {
          subject: options.confirmationSubject || "Thank you for your submission",
          details: formDataHtml,
        },
      });
    }

    // Send notification to site owner(s)
    if (options.sendNotification && options.notificationRecipients?.length) {
      const recipients = options.notificationRecipients.map((email) => ({ email }));
      results.notification = await this.send({
        to: recipients,
        subject: options.notificationSubject || `New submission: ${formId}`,
        template: "form_notification",
        templateVars: {
          subject: options.notificationSubject || `New submission: ${formId}`,
          formName: formId,
          formData: formDataHtml,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return results;
  }

  /**
   * Get sent emails (for mock provider testing)
   */
  getSentEmails(): EmailMessage[] {
    return [...this.sentEmails];
  }

  /**
   * Clear sent emails (for testing)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  // ============================================================================
  // PROVIDER IMPLEMENTATIONS
  // ============================================================================

  /**
   * Mock provider for testing
   */
  private async sendMock(message: EmailMessage): Promise<EmailSendResult> {
    this.sentEmails.push(message);
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * SendGrid provider
   * Calls are routed through the backend proxy at /api/email/send.
   * Direct browser→SendGrid calls are blocked by CORS and would expose API keys.
   */
  private async sendSendGrid(message: EmailMessage): Promise<EmailSendResult> {
    return this.sendViaBackendProxy("sendgrid", message);
  }

  /**
   * Mailgun provider
   * Calls are routed through the backend proxy at /api/email/send.
   * Direct browser→Mailgun calls are blocked by CORS and would expose API keys.
   */
  private async sendMailgun(message: EmailMessage): Promise<EmailSendResult> {
    return this.sendViaBackendProxy("mailgun", message);
  }

  /**
   * Resend provider
   * Calls are routed through the backend proxy at /api/email/send.
   * Direct browser→Resend calls are blocked by CORS and would expose API keys.
   */
  private async sendResend(message: EmailMessage): Promise<EmailSendResult> {
    return this.sendViaBackendProxy("resend", message);
  }

  /**
   * Route email through backend proxy.
   * The backend holds provider API keys and handles the actual delivery.
   * Implement POST /api/email/send in server/src/modules/email/ to activate.
   */
  private async sendViaBackendProxy(
    provider: string,
    _message: EmailMessage
  ): Promise<EmailSendResult> {
    throw new Error(
      `EmailService: backend proxy endpoint not yet configured. ` +
        `Implement POST /api/email/send in server/src/modules/email/ ` +
        `to enable ${provider} delivery.`
    );
  }

  /**
   * SMTP provider (placeholder - would need nodemailer in production)
   */
  private async sendSMTP(_message: EmailMessage): Promise<EmailSendResult> {
    // SMTP would require a backend service or nodemailer
    // For browser-based apps, use one of the API providers
    return {
      success: false,
      error: "SMTP not supported in browser. Use an API provider (sendgrid, mailgun, resend).",
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const emailService = new EmailService();

export default EmailService;
