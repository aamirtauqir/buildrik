/**
 * FormHandler - Core form handling logic for the Composer engine
 * @module engine/forms/FormHandler
 * @license BSD-3-Clause
 */

import { type FormEmailOptions } from "../../services/EmailService";
import {
  FormSubmissionService,
  type FormSubmissionData,
  type FormValidation,
  type SubmissionResult,
} from "../../services/FormSubmissionService";
import { EVENTS } from "../../shared/constants";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { emailMarketingService } from "../integrations";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Form element configuration
 */
export interface FormConfig {
  /** Unique form identifier */
  formId: string;
  /** Form action type */
  action: "submit" | "store" | "webhook" | "email";
  /** Webhook URL for 'webhook' action */
  webhookUrl?: string;
  /** Email options for 'email' action */
  emailOptions?: FormEmailOptions;
  /** Redirect URL after successful submission */
  successRedirect?: string;
  /** Success message to display */
  successMessage?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Validation rules */
  validation?: FormValidation;
  /** Field name containing submitter email */
  submitterEmailField?: string;
}

/**
 * Form field definition
 */
export interface FormFieldDef {
  /** Field element ID */
  elementId: string;
  /** Field name attribute */
  name: string;
  /** Field type */
  type: "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "radio";
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  defaultValue?: string;
  /** Options for select/radio */
  options?: { label: string; value: string }[];
}

/**
 * Form state
 */
export interface FormState {
  /** Current field values */
  values: Record<string, unknown>;
  /** Current validation errors */
  errors: Record<string, string>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form was submitted successfully */
  isSubmitted: boolean;
  /** Submission result */
  result?: SubmissionResult;
}

/**
 * Form handler events
 */
export interface FormHandlerEvents {
  "form:submit": { formId: string; data: Record<string, unknown> };
  "form:success": { formId: string; result: SubmissionResult };
  "form:error": { formId: string; errors: Record<string, string> };
  "form:reset": { formId: string };
}

// ============================================================================
// FORM HANDLER CLASS
// ============================================================================

/**
 * FormHandler
 * Manages form configurations and submissions within the Composer
 */
export class FormHandler {
  private composer: Composer;
  private submissionService: FormSubmissionService;
  private forms: Map<string, FormConfig> = new Map();
  private formStates: Map<string, FormState> = new Map();
  private formFields: Map<string, FormFieldDef[]> = new Map();

  constructor(composer: Composer) {
    this.composer = composer;
    this.submissionService = new FormSubmissionService();
  }

  // ============================================================================
  // FORM REGISTRATION
  // ============================================================================

  /**
   * Register a form configuration
   */
  registerForm(config: FormConfig): void {
    this.forms.set(config.formId, config);
    this.formStates.set(config.formId, this.createInitialState());
    this.formFields.set(config.formId, []);

    this.composer.emit(EVENTS.FORM_REGISTERED, { formId: config.formId, config });
  }

  /**
   * Unregister a form
   */
  unregisterForm(formId: string): void {
    this.forms.delete(formId);
    this.formStates.delete(formId);
    this.formFields.delete(formId);

    this.composer.emit(EVENTS.FORM_UNREGISTERED, { formId });
  }

  /**
   * Get form configuration
   */
  getFormConfig(formId: string): FormConfig | undefined {
    return this.forms.get(formId);
  }

  /**
   * Update form configuration
   */
  updateFormConfig(formId: string, updates: Partial<FormConfig>): void {
    const config = this.forms.get(formId);
    if (config) {
      this.forms.set(formId, { ...config, ...updates });
      this.composer.emit(EVENTS.FORM_UPDATED, { formId, updates });
    }
  }

  // ============================================================================
  // FIELD MANAGEMENT
  // ============================================================================

  /**
   * Register a form field
   */
  registerField(formId: string, field: FormFieldDef): void {
    const fields = this.formFields.get(formId) ?? [];
    const existingIndex = fields.findIndex((f) => f.name === field.name);

    if (existingIndex >= 0) {
      fields[existingIndex] = field;
    } else {
      fields.push(field);
    }

    this.formFields.set(formId, fields);
  }

  /**
   * Unregister a form field
   */
  unregisterField(formId: string, fieldName: string): void {
    const fields = this.formFields.get(formId) ?? [];
    this.formFields.set(
      formId,
      fields.filter((f) => f.name !== fieldName)
    );
  }

  /**
   * Get all fields for a form
   */
  getFormFields(formId: string): FormFieldDef[] {
    return this.formFields.get(formId) ?? [];
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Get form state
   */
  getFormState(formId: string): FormState | undefined {
    return this.formStates.get(formId);
  }

  /**
   * Update field value
   */
  setFieldValue(formId: string, fieldName: string, value: unknown): void {
    const state = this.formStates.get(formId);
    if (state) {
      state.values[fieldName] = value;
      // Clear error when value changes
      delete state.errors[fieldName];
      this.formStates.set(formId, { ...state });
    }
  }

  /**
   * Get field value
   */
  getFieldValue(formId: string, fieldName: string): unknown {
    return this.formStates.get(formId)?.values[fieldName];
  }

  /**
   * Reset form to initial state
   */
  resetForm(formId: string): void {
    this.formStates.set(formId, this.createInitialState());
    this.composer.emit(EVENTS.FORM_RESET, { formId });
  }

  // ============================================================================
  // SUBMISSION
  // ============================================================================

  /**
   * Submit a form
   */
  async submitForm(formId: string): Promise<SubmissionResult> {
    const config = this.forms.get(formId);
    const state = this.formStates.get(formId);

    if (!config || !state) {
      return {
        success: false,
        errors: [{ field: "_form", message: "Form not found" }],
      };
    }

    // Set submitting state
    this.formStates.set(formId, { ...state, isSubmitting: true });
    this.composer.emit(EVENTS.FORM_SUBMITTING, { formId, data: state.values });

    try {
      // Build submission data
      const submissionData: FormSubmissionData = {
        formId,
        data: state.values,
        validation: config.validation,
        webhookUrl: config.webhookUrl,
        emailOptions: config.emailOptions,
        submitterEmailField: config.submitterEmailField,
      };

      // Submit via service
      const result = await this.submissionService.submit(submissionData);

      // Handle email list subscription if configured
      if (
        result.success &&
        config.action === "email" &&
        config.emailOptions?.subscribeToList &&
        emailMarketingService.isConfigured()
      ) {
        const emailField = state.values["email"] as string | undefined;
        const nameField = state.values["name"] as string | undefined;

        if (emailField) {
          // Subscribe to mailing list - fire and forget, don't block form submission
          await emailMarketingService.subscribe({
            email: emailField,
            name: nameField,
          });
        }
      }

      // Update state based on result
      const newState: FormState = {
        ...state,
        isSubmitting: false,
        isSubmitted: result.success,
        result,
        errors: result.success ? {} : this.errorsToMap(result.errors ?? []),
      };

      this.formStates.set(formId, newState);

      // Emit appropriate event
      if (result.success) {
        this.composer.emit(EVENTS.FORM_SUBMITTED, { formId, result });
      } else {
        this.composer.emit(EVENTS.FORM_ERROR, {
          formId,
          errors: newState.errors,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Submission failed";
      const result: SubmissionResult = {
        success: false,
        errors: [{ field: "_form", message: errorMessage }],
      };

      this.formStates.set(formId, {
        ...state,
        isSubmitting: false,
        errors: { _form: errorMessage },
        result,
      });

      this.composer.emit(EVENTS.FORM_ERROR, {
        formId,
        errors: { _form: errorMessage },
      });

      return result;
    }
  }

  /**
   * Get all submissions for a form
   */
  async getSubmissions(formId: string) {
    return this.submissionService.getSubmissions(formId);
  }

  // ============================================================================
  // FORM ELEMENT HELPERS
  // ============================================================================

  /**
   * Find form element by ID
   */
  findFormElement(formId: string): Element | null {
    // Search all elements in the active page for one with matching formId data
    const activePage = this.composer.elements.getActivePage();
    if (!activePage?.root) return null;

    const rootElement = this.composer.elements.getElement(activePage.root.id);
    if (!rootElement) return null;

    const searchTree = (element: Element): Element | null => {
      const elementFormId = element.getCustomData("formId");
      if (elementFormId === formId) {
        return element;
      }
      for (const child of element.getChildren()) {
        const found = searchTree(child);
        if (found) return found;
      }
      return null;
    };

    return searchTree(rootElement);
  }

  /**
   * Find all form fields within a form element
   */
  findFormFields(formElement: Element): Element[] {
    const fields: Element[] = [];
    const inputTypes = ["input", "textarea", "select"];

    const searchChildren = (element: Element) => {
      const tagName = element.getTagName()?.toLowerCase();
      if (tagName && inputTypes.includes(tagName)) {
        fields.push(element);
      }
      element.getChildren().forEach(searchChildren);
    };

    searchChildren(formElement);
    return fields;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Create initial form state
   */
  private createInitialState(): FormState {
    return {
      values: {},
      errors: {},
      isSubmitting: false,
      isSubmitted: false,
    };
  }

  /**
   * Convert validation errors array to map
   */
  private errorsToMap(errors: { field: string; message: string }[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const error of errors) {
      map[error.field] = error.message;
    }
    return map;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Destroy the handler
   */
  destroy(): void {
    this.forms.clear();
    this.formStates.clear();
    this.formFields.clear();
  }
}

export default FormHandler;
