/**
 * EmailService tests — provider routing (cloud providers surface the
 * backend-proxy-not-configured error), mock provider capture, template
 * rendering + escaping, and sendFormEmails composition. The custom
 * template's raw-HTML pass-through is encoded as current behavior + it.todo.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  EmailService,
  type EmailMessage,
  type EmailProviderConfig,
} from "../EmailService";

let service: EmailService;

const mockConfig: EmailProviderConfig = {
  provider: "mock",
  fromEmail: "noreply@site.test",
};

const baseMessage: EmailMessage = {
  to: { email: "user@example.com" },
  subject: "Hello",
  text: "Plain body",
};

beforeEach(() => {
  service = new EmailService();
});

describe("EmailService provider selection", () => {
  it("fails fast when not configured", async () => {
    expect(service.isConfigured()).toBe(false);
    await expect(service.send(baseMessage)).resolves.toEqual({
      success: false,
      error: "Email service not configured",
    });
  });

  it.each(["sendgrid", "mailgun", "resend"] as const)(
    "%s maps the 'backend proxy not configured' throw to a structured {success:false, error}",
    async (provider) => {
      service.configure({ provider, apiKey: "k", fromEmail: "noreply@site.test" });

      // FIXED: send() awaits the provider dispatch inside its try, so the async
      // throw is caught and mapped to a structured result — not a raw rejection.
      const res = await service.send(baseMessage);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(
        new RegExp(
          `backend proxy endpoint not yet configured.*to enable ${provider} delivery`,
          "s"
        )
      );
    }
  );

  it("BUG FIXED: an async provider throw is caught by send() (no raw rejection reaches the caller)", async () => {
    service.configure({ provider: "sendgrid", apiKey: "k", fromEmail: "noreply@site.test" });
    // The promise resolves (never rejects) — the failure is inside the result.
    await expect(service.send(baseMessage)).resolves.toMatchObject({ success: false });
  });

  it("smtp is unsupported in the browser", async () => {
    service.configure({
      provider: "smtp",
      fromEmail: "noreply@site.test",
      smtp: { host: "h", port: 587, secure: false, user: "u", password: "p" },
    });

    const res = await service.send(baseMessage);
    expect(res.success).toBe(false);
    expect(res.error).toContain("SMTP not supported in browser");
  });

  it("an unknown provider is rejected", async () => {
    service.configure({
      provider: "carrier-pigeon",
      fromEmail: "noreply@site.test",
    } as unknown as EmailProviderConfig);

    await expect(service.send(baseMessage)).resolves.toEqual({
      success: false,
      error: "Unknown email provider",
    });
  });
});

describe("EmailService mock provider", () => {
  beforeEach(() => {
    service.configure(mockConfig);
  });

  it("records the sent email and returns a mock message id", async () => {
    const res = await service.send(baseMessage);

    expect(res.success).toBe(true);
    expect(res.messageId).toMatch(/^mock-/);
    expect(service.getSentEmails()).toHaveLength(1);
    expect(service.getSentEmails()[0]).toMatchObject({
      to: { email: "user@example.com" },
      subject: "Hello",
    });
  });

  it("getSentEmails returns a copy; clearSentEmails empties the log", async () => {
    await service.send(baseMessage);

    const copy = service.getSentEmails();
    copy.pop();
    expect(service.getSentEmails()).toHaveLength(1);

    service.clearSentEmails();
    expect(service.getSentEmails()).toEqual([]);
  });
});

describe("EmailService template rendering", () => {
  beforeEach(() => {
    service.configure(mockConfig);
  });

  it("form_confirmation fills subject/html/text; caller-provided subject wins", async () => {
    await service.send({
      to: { email: "user@example.com" },
      subject: "",
      template: "form_confirmation",
      templateVars: { details: "<strong>name:</strong> Ada" },
    });

    const sent = service.getSentEmails()[0];
    expect(sent.subject).toBe("Thank you for your submission"); // template default
    expect(sent.html).toContain("<strong>name:</strong> Ada"); // details slot is trusted pre-escaped HTML
    expect(sent.text).toContain("We've received your submission");

    await service.send({
      to: { email: "user@example.com" },
      subject: "Custom subject",
      template: "form_confirmation",
    });
    expect(service.getSentEmails()[1].subject).toBe("Custom subject");
  });

  it("form_notification escapes the caller-supplied formName in HTML", async () => {
    await service.send({
      to: { email: "owner@site.test" },
      subject: "",
      template: "form_notification",
      templateVars: { formName: "<img src=x onerror=alert(1)>" },
    });

    const sent = service.getSentEmails()[0];
    expect(sent.subject).toBe("New Form Submission");
    expect(sent.html).toContain("Form: &lt;img src=x onerror=alert(1)&gt;");
    expect(sent.html).not.toContain("<img src=x");
  });

  it("welcome escapes the name in HTML but leaves the plain-text body raw", async () => {
    await service.send({
      to: { email: "user@example.com" },
      subject: "",
      template: "welcome",
      templateVars: { name: "<b>Sam</b>" },
    });

    const sent = service.getSentEmails()[0];
    expect(sent.subject).toBe("Welcome!");
    expect(sent.html).toContain("Welcome, &lt;b&gt;Sam&lt;/b&gt;!");
    expect(sent.text).toContain("Welcome, <b>Sam</b>!"); // text is not markup
  });

  it("custom template escapes vars.text when used as HTML fallback", async () => {
    await service.send({
      to: { email: "user@example.com" },
      subject: "",
      template: "custom",
      templateVars: { text: "<b>hi</b>" },
    });

    const sent = service.getSentEmails()[0];
    expect(sent.html).toBe("<p>&lt;b&gt;hi&lt;/b&gt;</p>");
    expect(sent.text).toBe("<b>hi</b>");
  });

  it("CURRENT BEHAVIOR: custom template passes vars.html through UNESCAPED", async () => {
    const hostile = '<img src=x onerror="steal()">';
    await service.send({
      to: { email: "user@example.com" },
      subject: "",
      template: "custom",
      templateVars: { html: hostile },
    });

    expect(service.getSentEmails()[0].html).toBe(hostile);
  });

  it.todo(
    "SECURITY: the custom template renders caller-supplied HTML unescaped into the email body — any upstream surface that lets a site visitor reach templateVars.html can inject markup into outbound mail"
  );

  it("explicit message html/text/subject override the template output", async () => {
    await service.send({
      to: { email: "user@example.com" },
      subject: "Mine",
      html: "<p>mine</p>",
      text: "mine",
      template: "welcome",
      templateVars: { name: "Sam" },
    });

    const sent = service.getSentEmails()[0];
    expect(sent.subject).toBe("Mine");
    expect(sent.html).toBe("<p>mine</p>");
    expect(sent.text).toBe("mine");
  });
});

describe("EmailService.sendFormEmails", () => {
  beforeEach(() => {
    service.configure(mockConfig);
  });

  it("sends confirmation to the submitter and notification to the owners, escaping form data", async () => {
    const results = await service.sendFormEmails(
      "contact-form",
      { name: "<Bob>", message: "hi & bye" },
      "visitor@example.com",
      {
        sendConfirmation: true,
        sendNotification: true,
        notificationRecipients: ["owner@site.test", "admin@site.test"],
      }
    );

    expect(results.confirmation?.success).toBe(true);
    expect(results.notification?.success).toBe(true);

    const [confirmation, notification] = service.getSentEmails();
    expect(confirmation.to).toEqual({ email: "visitor@example.com" });
    expect(confirmation.subject).toBe("Thank you for your submission");
    expect(confirmation.template).toBe("form_confirmation");
    expect(confirmation.templateVars?.details).toBe(
      "<strong>name:</strong> &lt;Bob&gt;<br><strong>message:</strong> hi &amp; bye"
    );

    expect(notification.to).toEqual([
      { email: "owner@site.test" },
      { email: "admin@site.test" },
    ]);
    expect(notification.subject).toBe("New submission: contact-form");
    expect(notification.template).toBe("form_notification");
    expect(notification.templateVars?.formName).toBe("contact-form");
  });

  it("skips confirmation without a submitter email, notification without recipients", async () => {
    const results = await service.sendFormEmails("contact-form", { a: 1 }, undefined, {
      sendConfirmation: true,
      sendNotification: true,
      notificationRecipients: [],
    });

    expect(results.confirmation).toBeUndefined();
    expect(results.notification).toBeUndefined();
    expect(service.getSentEmails()).toEqual([]);
  });

  it("honors custom subjects for both emails", async () => {
    await service.sendFormEmails("f1", { a: 1 }, "v@x.com", {
      sendConfirmation: true,
      confirmationSubject: "Got it!",
      sendNotification: true,
      notificationRecipients: ["o@x.com"],
      notificationSubject: "Lead in",
    });

    const [confirmation, notification] = service.getSentEmails();
    expect(confirmation.subject).toBe("Got it!");
    expect(notification.subject).toBe("Lead in");
  });
});
