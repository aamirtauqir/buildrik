/**
 * useFormHandler tests — delegation to composer.forms and FORM_* event
 * subscription lifecycle.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormHandler } from "../useFormHandler";
import { EVENTS } from "../../constants";
import type { Composer } from "../../../engine";
import type { FormConfig, FormState } from "../../../engine/forms/FormHandler";

type Handler = (payload?: unknown) => void;

function createMockComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((event: string, cb: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      listeners.get(event)?.delete(cb);
    }),
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    forms: {
      registerForm: vi.fn(),
      unregisterForm: vi.fn(),
      getFormConfig: vi.fn((): FormConfig | undefined => undefined),
      getFormState: vi.fn((): FormState | undefined => undefined),
      submitForm: vi.fn().mockResolvedValue(undefined),
      setFieldValue: vi.fn(),
      resetForm: vi.fn(),
    },
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

const config: FormConfig = { formId: "form-1", action: "submit" };

describe("useFormHandler", () => {
  it("delegates every operation to composer.forms", async () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useFormHandler(asComposer(composer)));

    result.current.registerForm(config);
    expect(composer.forms.registerForm).toHaveBeenCalledWith(config);

    result.current.unregisterForm("form-1");
    expect(composer.forms.unregisterForm).toHaveBeenCalledWith("form-1");

    result.current.getFormConfig("form-1");
    expect(composer.forms.getFormConfig).toHaveBeenCalledWith("form-1");

    result.current.getFormState("form-1");
    expect(composer.forms.getFormState).toHaveBeenCalledWith("form-1");

    await result.current.submitForm("form-1");
    expect(composer.forms.submitForm).toHaveBeenCalledWith("form-1");

    result.current.setFieldValue("form-1", "email", "a@b.co");
    expect(composer.forms.setFieldValue).toHaveBeenCalledWith("form-1", "email", "a@b.co");

    result.current.resetForm("form-1");
    expect(composer.forms.resetForm).toHaveBeenCalledWith("form-1");
  });

  it("returns pass-through values from the manager", () => {
    const composer = createMockComposer();
    const state: FormState = {
      values: { email: "a@b.co" },
      errors: {},
      isSubmitting: false,
      isSubmitted: true,
    };
    composer.forms.getFormConfig.mockReturnValue(config);
    composer.forms.getFormState.mockReturnValue(state);

    const { result } = renderHook(() => useFormHandler(asComposer(composer)));
    expect(result.current.getFormConfig("form-1")).toBe(config);
    expect(result.current.getFormState("form-1")).toBe(state);
  });

  it("null composer → every call is a safe no-op", async () => {
    const { result } = renderHook(() => useFormHandler(null));

    expect(() => result.current.registerForm(config)).not.toThrow();
    expect(() => result.current.unregisterForm("x")).not.toThrow();
    expect(result.current.getFormConfig("x")).toBeUndefined();
    expect(result.current.getFormState("x")).toBeUndefined();
    await expect(result.current.submitForm("x")).resolves.toBeUndefined();
    expect(() => result.current.setFieldValue("x", "f", 1)).not.toThrow();
    expect(() => result.current.resetForm("x")).not.toThrow();
  });

  it("subscribes to the four FORM_* events and unsubscribes on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useFormHandler(asComposer(composer)));

    const events = [
      EVENTS.FORM_REGISTERED,
      EVENTS.FORM_UNREGISTERED,
      EVENTS.FORM_SUBMITTED,
      EVENTS.FORM_RESET,
    ];
    for (const event of events) expect(composer.listenerCount(event)).toBe(1);

    unmount();
    for (const event of events) expect(composer.listenerCount(event)).toBe(0);
  });
});
