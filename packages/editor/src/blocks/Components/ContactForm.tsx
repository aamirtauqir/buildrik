/**
 * Aquibra Contact Form Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  width?: "full" | "half";
}

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  fields?: FormField[];
  submitText?: string;
  successMessage?: string;
  onSubmit?: (data: Record<string, string | boolean>) => Promise<void>;
}

const defaultFields: FormField[] = [
  {
    id: "name",
    type: "text",
    label: "Full Name",
    placeholder: "John Doe",
    required: true,
    width: "half",
  },
  {
    id: "email",
    type: "email",
    label: "Email Address",
    placeholder: "john@example.com",
    required: true,
    width: "half",
  },
  {
    id: "phone",
    type: "phone",
    label: "Phone Number",
    placeholder: "+1 (555) 000-0000",
    width: "half",
  },
  {
    id: "subject",
    type: "select",
    label: "Subject",
    options: ["General Inquiry", "Support", "Sales", "Partnership"],
    width: "half",
  },
  {
    id: "message",
    type: "textarea",
    label: "Message",
    placeholder: "How can we help you?",
    required: true,
    width: "full",
  },
  {
    id: "newsletter",
    type: "checkbox",
    label: "Subscribe to our newsletter",
    width: "full",
  },
];

export const ContactForm: React.FC<ContactFormProps> = ({
  title = "Get in Touch",
  subtitle = "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  fields = defaultFields,
  submitText = "Send Message",
  successMessage = "Thank you! Your message has been sent successfully.",
  onSubmit,
}) => {
  const [formData, setFormData] = React.useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleChange = (id: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      const emailValue = formData[field.id];
      if (
        field.type === "email" &&
        emailValue &&
        typeof emailValue === "string" &&
        !/\S+@\S+\.\S+/.test(emailValue)
      ) {
        newErrors[field.id] = "Please enter a valid email";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      setIsSuccess(true);
      setFormData({});
    } catch {
      // Form submission error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="aqb-contact-form" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h3
          style={{
            fontSize: 24,
            color: "var(--aqb-text-primary, #f8fafc)",
            marginBottom: 12,
          }}
        >
          Message Sent!
        </h3>
        <p
          style={{
            color: "var(--aqb-text-secondary, #cbd5e1)",
            marginBottom: 24,
          }}
        >
          {successMessage}
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          style={{
            padding: "12px 24px",
            background: "var(--aqb-primary, #00d4aa)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="aqb-contact-form" style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      {title && (
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--aqb-text-primary, #f8fafc)",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          style={{
            color: "var(--aqb-text-secondary, #cbd5e1)",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {subtitle}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {fields.map((field) => (
            <div
              key={field.id}
              style={{
                width: field.width === "half" ? "calc(50% - 8px)" : "100%",
              }}
            >
              {field.type !== "checkbox" && (
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--aqb-text-primary, #f8fafc)",
                  }}
                >
                  {field.label}
                  {field.required && <span style={{ color: "var(--aqb-error, #ef4444)" }}> *</span>}
                </label>
              )}

              {field.type === "textarea" ? (
                <textarea
                  value={String(formData[field.id] || "")}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--aqb-bg-dark, #0d0d1a)",
                    border: `1px solid ${
                      errors[field.id] ? "var(--aqb-error, #ef4444)" : "var(--aqb-border, #334155)"
                    }`,
                    borderRadius: 8,
                    color: "var(--aqb-text-primary, #f8fafc)",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={String(formData[field.id] || "")}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--aqb-bg-dark, #0d0d1a)",
                    border: `1px solid ${
                      errors[field.id] ? "var(--aqb-error, #ef4444)" : "var(--aqb-border, #334155)"
                    }`,
                    borderRadius: 8,
                    color: "var(--aqb-text-primary, #f8fafc)",
                    fontSize: 14,
                  }}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.id])}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--aqb-text-secondary, #cbd5e1)",
                    }}
                  >
                    {field.label}
                  </span>
                </label>
              ) : (
                <input
                  type={field.type}
                  value={String(formData[field.id] || "")}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--aqb-bg-dark, #0d0d1a)",
                    border: `1px solid ${
                      errors[field.id] ? "var(--aqb-error, #ef4444)" : "var(--aqb-border, #334155)"
                    }`,
                    borderRadius: 8,
                    color: "var(--aqb-text-primary, #f8fafc)",
                    fontSize: 14,
                  }}
                />
              )}

              {errors[field.id] && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--aqb-error, #ef4444)",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  {errors[field.id]}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            marginTop: 24,
            padding: "14px 24px",
            background: "var(--aqb-primary, #00d4aa)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: isSubmitting ? "wait" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Sending..." : submitText}
        </button>
      </form>
    </div>
  );
};

export const contactFormBlockConfig = {
  id: "contact-form",
  label: "Contact Form",
  category: "Forms",
  elementType: "form" as const,
  icon: "📧",
  content:
    '<form class="aqb-contact-form" data-aqb-type="form">' +
    '<div class="aqb-contact-field"><label>Name</label><input type="text" placeholder="Your name"/></div>' +
    '<div class="aqb-contact-field"><label>Email</label><input type="email" placeholder="you@example.com"/></div>' +
    '<div class="aqb-contact-field"><label>Message</label><textarea placeholder="How can we help?"></textarea></div>' +
    '<button type="submit" class="aqb-contact-submit">Send Message</button>' +
    "</form>",
};

export default ContactForm;
