/**
 * FormSubmissionService - Handle form submissions with validation and storage
 * @module services/FormSubmissionService
 * @license BSD-3-Clause
 */

import { emailService, type FormEmailOptions } from "./EmailService";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Field validation rules
 */
export interface FormField {
  /** Whether the field is required */
  required?: boolean;
  /** Field type for format validation */
  type?: "text" | "email" | "phone" | "number";
  /** Minimum character length */
  minLength?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Custom regex pattern */
  pattern?: string;
}

/**
 * Validation rules for form fields
 */
export interface FormValidation {
  [fieldName: string]: FormField;
}

/**
 * Form submission input data
 */
export interface FormSubmissionData {
  /** Unique form identifier */
  formId: string;
  /** Form field values */
  data: Record<string, unknown>;
  /** Optional validation rules */
  validation?: FormValidation;
  /** Optional webhook URL for notifications */
  webhookUrl?: string;
  /** Email notification options */
  emailOptions?: FormEmailOptions;
  /** Submitter email field name (for confirmation emails) */
  submitterEmailField?: string;
}

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Stored form submission record
 */
export interface FormSubmission {
  /** Unique submission ID */
  id: string;
  /** Form identifier */
  formId: string;
  /** Submitted data */
  data: Record<string, unknown>;
  /** Submission timestamp */
  submittedAt: number;
}

/**
 * Result of a form submission attempt
 */
export interface SubmissionResult {
  /** Whether submission was successful */
  success: boolean;
  /** Submission ID if successful */
  submissionId?: string;
  /** Validation errors if unsuccessful */
  errors?: ValidationError[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * FormSubmissionService
 * Handles form submissions with validation, storage, and webhook delivery
 */
export class FormSubmissionService {
  private submissions: Map<string, FormSubmission[]> = new Map();

  /**
   * Submit form data with optional validation and webhook
   */
  async submit(submission: FormSubmissionData): Promise<SubmissionResult> {
    // Validate fields
    const errors = this.validate(submission.data, submission.validation);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Create submission record
    const record: FormSubmission = {
      id: this.generateId(),
      formId: submission.formId,
      data: submission.data,
      submittedAt: Date.now(),
    };

    // Store submission
    const existing = this.submissions.get(submission.formId) ?? [];
    existing.push(record);
    this.submissions.set(submission.formId, existing);

    // Call webhook if configured
    if (submission.webhookUrl) {
      await this.callWebhook(submission.webhookUrl, record);
    }

    // Send email notifications if configured
    if (submission.emailOptions && emailService.isConfigured()) {
      const submitterEmail = submission.submitterEmailField
        ? String(submission.data[submission.submitterEmailField] || "")
        : undefined;
      await emailService.sendFormEmails(
        submission.formId,
        submission.data,
        submitterEmail,
        submission.emailOptions
      );
    }

    return { success: true, submissionId: record.id };
  }

  /**
   * Retrieve all submissions for a specific form
   */
  async getSubmissions(formId: string): Promise<FormSubmission[]> {
    return this.submissions.get(formId) ?? [];
  }

  /**
   * Validate form data against validation rules
   */
  private validate(data: Record<string, unknown>, validation?: FormValidation): ValidationError[] {
    if (!validation) return [];
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(validation)) {
      const value = data[field];

      // Required validation
      if (rules.required && (!value || value === "")) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Email format validation
      if (rules.type === "email" && value && !this.isValidEmail(String(value))) {
        errors.push({ field, message: "Invalid email format" });
      }

      // Phone format validation
      if (rules.type === "phone" && value && !this.isValidPhone(String(value))) {
        errors.push({ field, message: "Invalid phone format" });
      }

      // Number validation
      if (rules.type === "number" && value && isNaN(Number(value))) {
        errors.push({ field, message: "Must be a valid number" });
      }

      // Min length validation
      if (rules.minLength && value && String(value).length < rules.minLength) {
        errors.push({
          field,
          message: `Minimum length is ${rules.minLength} characters`,
        });
      }

      // Max length validation
      if (rules.maxLength && value && String(value).length > rules.maxLength) {
        errors.push({
          field,
          message: `Maximum length is ${rules.maxLength} characters`,
        });
      }

      // Custom pattern validation
      if (rules.pattern && value) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(String(value))) {
          errors.push({ field, message: "Invalid format" });
        }
      }
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate phone format (basic validation)
   */
  private isValidPhone(phone: string): boolean {
    return /^[\d\s\-+()]{7,}$/.test(phone);
  }

  /**
   * Call webhook with submission data
   */
  private async callWebhook(url: string, data: FormSubmission): Promise<void> {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Webhook failures are logged but don't affect submission success
      // In production, this could be sent to an error tracking service
    }
  }

  /**
   * Generate unique submission ID
   */
  private generateId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default FormSubmissionService;
