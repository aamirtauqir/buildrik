"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({ name });
  };

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Create your workspace</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Name your workspace to get started. You can invite teammates later.
        </p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <AuthInput
          label="Workspace name"
          hideLabel
          type="text"
          icon={Briefcase}
          placeholder="Acme Studio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <AuthButton type="submit" disabled={!name} loading={createMutation.isPending}>
          Create workspace
        </AuthButton>
      </form>
    </AuthCard>
  );
}
