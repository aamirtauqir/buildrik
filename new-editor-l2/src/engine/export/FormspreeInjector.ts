/**
 * Formspree Injector
 * Handles form action URL injection for Formspree submissions
 *
 * @module engine/export/FormspreeInjector
 * @license BSD-3-Clause
 */

import type { FormSettings } from "../../shared/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const FORMSPREE_BASE_URL = "https://formspree.io/f";

// ============================================================================
// TYPES
// ============================================================================

export interface FormElement {
  /** Element ID */
  id: string;
  /** Form settings */
  formSettings?: FormSettings;
}

// ============================================================================
// FORMSPREE INJECTOR
// ============================================================================

export class FormspreeInjector {
  /**
   * Get the form action URL for an element
   */
  getFormAction(formSettings?: FormSettings): string | null {
    if (!formSettings) return null;

    if (formSettings.provider === "formspree" && formSettings.formId) {
      return `${FORMSPREE_BASE_URL}/${formSettings.formId}`;
    }

    if (formSettings.provider === "custom" && formSettings.actionUrl) {
      return formSettings.actionUrl;
    }

    return null;
  }

  /**
   * Generate hidden fields for Formspree
   */
  getHiddenFields(formSettings?: FormSettings): string {
    if (!formSettings || formSettings.provider !== "formspree") {
      return "";
    }

    const fields: string[] = [];

    // Success redirect
    if (formSettings.successRedirect) {
      fields.push(
        `<input type="hidden" name="_next" value="${this.escape(formSettings.successRedirect)}">`
      );
    }

    // Custom email subject
    if (formSettings.emailSubject) {
      fields.push(
        `<input type="hidden" name="_subject" value="${this.escape(formSettings.emailSubject)}">`
      );
    }

    return fields.join("\n");
  }

  /**
   * Process HTML and inject form settings
   */
  processHTML(html: string, forms: FormElement[]): string {
    let result = html;

    for (const form of forms) {
      if (!form.formSettings) continue;

      const actionUrl = this.getFormAction(form.formSettings);
      if (!actionUrl) continue;

      // Find the form element by ID and update its attributes
      const formPattern = new RegExp(`(<form[^>]*id=["']${form.id}["'][^>]*)>`, "gi");

      result = result.replace(formPattern, (_match, formTag) => {
        // Remove existing action and method attributes
        let updated = formTag
          .replace(/\s+action=["'][^"']*["']/gi, "")
          .replace(/\s+method=["'][^"']*["']/gi, "");

        // Add new action and method
        updated += ` action="${actionUrl}" method="POST"`;

        return updated + ">";
      });

      // Inject hidden fields after form opening tag
      const hiddenFields = this.getHiddenFields(form.formSettings);
      if (hiddenFields) {
        const formOpenPattern = new RegExp(`(<form[^>]*id=["']${form.id}["'][^>]*>)`, "gi");
        result = result.replace(formOpenPattern, `$1\n${hiddenFields}`);
      }
    }

    return result;
  }

  /**
   * Generate form attributes as object
   */
  getFormAttributes(formSettings?: FormSettings): Record<string, string> {
    const attrs: Record<string, string> = {};

    const actionUrl = this.getFormAction(formSettings);
    if (actionUrl) {
      attrs.action = actionUrl;
      attrs.method = "POST";
    }

    return attrs;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export default FormspreeInjector;
