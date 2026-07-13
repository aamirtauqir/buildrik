"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@lib/utils";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { Briefcase } from "lucide-react";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.account.workspace.create.useMutation({
    onSuccess: async (ws) => {
      await update({ workspaceId: ws.workspaceId });
      router.push("/dashboard");
      router.refresh();
    },
    // Workspace.name has no unique constraint and createWorkspace auto-dedupes
    // the slug, so the mockup's "That workspace name is taken" state can never
    // fire. The only error this mutation actually throws is the plan limit
    // ("Free plan is limited to one workspace"), which we surface verbatim.
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({ name });
  };

  const pending = createMutation.isPending;

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Create your workspace</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          This is where you and your team will build and manage sites.
        </p>
      </div>

      <div className="h-5" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
        <div className={cn(pending && "pointer-events-none opacity-50")}>
          <AuthInput
            label="Workspace name"
            hideLabel
            type="text"
            icon={Briefcase}
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={error ? "border-auth-input-error bg-white" : undefined}
            disabled={pending}
            required
            autoFocus
          />
        </div>
        <AuthButton type="submit" disabled={!name} loading={pending}>
          {pending ? "Creating workspace…" : "Create workspace"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
