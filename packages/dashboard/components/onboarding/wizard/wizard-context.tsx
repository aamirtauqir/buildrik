"use client";

import { createContext, useContext, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import type { WizardData } from "@buildrik/shared/schemas/onboarding";

const LS_KEY = "buildrik_onboarding_wizard_v1";

interface WizardContextValue {
  data: WizardData;
  /** Merge a patch into the in-memory state (no navigation, no server write). */
  update: (patch: Partial<WizardData>) => void;
  /** Persist the state (+ optional patch, + this route) to the server, then navigate. */
  saveAndGo: (route: string, patch?: Partial<WizardData>) => Promise<void>;
  saving: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

function writeLocal(data: WizardData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota/private-mode */
  }
}

/**
 * Owns the M2 onboarding wizard state. `initial` comes from the SERVER
 * (OnboardingState.wizardData) — server is the source of truth on load. Every
 * step transition persists via saveWizard; localStorage is only a write-buffer
 * so a failed save isn't lost (never read-merged ahead of the server).
 */
export function WizardProvider({ initial, children }: { initial: WizardData; children: React.ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(initial);
  const save = trpc.onboarding.saveWizard.useMutation();

  // `saveAndGo` must keep a STABLE identity. It used to close over `data` and
  // list it as a dep, so every call — which setStates `data` — minted a new
  // `saveAndGo`. Any effect depending on it (A4 polls job status, then calls it
  // on COMPLETED) therefore re-fired on its own result, looping: each pass
  // queued another saveWizard until the batched request stalled and the
  // router.push behind it never ran, stranding the user on the spinner with a
  // finished site. Read `data` through a ref instead and depend on nothing that
  // changes per-render (`mutateAsync` and `router` are both stable).
  const dataRef = useRef(data);
  dataRef.current = data;
  const { mutateAsync } = save;

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      writeLocal(next);
      return next;
    });
  }, []);

  const saveAndGo = useCallback(
    async (route: string, patch?: Partial<WizardData>) => {
      const next: WizardData = { ...dataRef.current, ...patch, v: 1, route };
      setData(next);
      writeLocal(next);
      try {
        await mutateAsync(next);
      } catch {
        /* localStorage buffer retains it; server retry on next transition */
      }
      router.push(route);
    },
    [mutateAsync, router]
  );

  const value = useMemo<WizardContextValue>(
    () => ({ data, update, saveAndGo, saving: save.isPending }),
    [data, update, saveAndGo, save.isPending]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
