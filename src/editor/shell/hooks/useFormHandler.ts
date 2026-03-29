/**
 * Form Handler Hook
 * Provides form handling capabilities from composer's FormHandler
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { FormConfig, FormState } from "../../../engine/forms/FormHandler";
import { EVENTS } from "../../../shared/constants";

export interface UseFormHandlerResult {
  /** Register a form with configuration */
  registerForm: (config: FormConfig) => void;
  /** Unregister a form */
  unregisterForm: (formId: string) => void;
  /** Get form configuration */
  getFormConfig: (formId: string) => FormConfig | undefined;
  /** Get form state */
  getFormState: (formId: string) => FormState | undefined;
  /** Submit a form */
  submitForm: (formId: string) => Promise<void>;
  /** Set form field value */
  setFieldValue: (formId: string, fieldName: string, value: unknown) => void;
  /** Reset form to initial state */
  resetForm: (formId: string) => void;
}

export function useFormHandler(composer: Composer | null): UseFormHandlerResult {
  // Subscribe to form events via composer
  React.useEffect(() => {
    if (!composer) return;

    const handleFormEvent = () => {
      // Force re-render to get updated form states
    };

    composer.on(EVENTS.FORM_REGISTERED, handleFormEvent);
    composer.on(EVENTS.FORM_UNREGISTERED, handleFormEvent);
    composer.on(EVENTS.FORM_SUBMITTED, handleFormEvent);
    composer.on(EVENTS.FORM_RESET, handleFormEvent);

    return () => {
      composer.off(EVENTS.FORM_REGISTERED, handleFormEvent);
      composer.off(EVENTS.FORM_UNREGISTERED, handleFormEvent);
      composer.off(EVENTS.FORM_SUBMITTED, handleFormEvent);
      composer.off(EVENTS.FORM_RESET, handleFormEvent);
    };
  }, [composer]);

  const registerForm = React.useCallback(
    (config: FormConfig) => {
      composer?.forms?.registerForm(config);
    },
    [composer]
  );

  const unregisterForm = React.useCallback(
    (formId: string) => {
      composer?.forms?.unregisterForm(formId);
    },
    [composer]
  );

  const getFormConfig = React.useCallback(
    (formId: string): FormConfig | undefined => {
      return composer?.forms?.getFormConfig(formId);
    },
    [composer]
  );

  const getFormState = React.useCallback(
    (formId: string): FormState | undefined => {
      return composer?.forms?.getFormState(formId);
    },
    [composer]
  );

  const submitForm = React.useCallback(
    async (formId: string) => {
      await composer?.forms?.submitForm(formId);
    },
    [composer]
  );

  const setFieldValue = React.useCallback(
    (formId: string, fieldName: string, value: unknown) => {
      composer?.forms?.setFieldValue(formId, fieldName, value);
    },
    [composer]
  );

  const resetForm = React.useCallback(
    (formId: string) => {
      composer?.forms?.resetForm(formId);
    },
    [composer]
  );

  return {
    registerForm,
    unregisterForm,
    getFormConfig,
    getFormState,
    submitForm,
    setFieldValue,
    resetForm,
  };
}

export default useFormHandler;
