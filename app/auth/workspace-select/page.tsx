"use client";

import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthCard } from "@/components/auth/auth-card";

const workspaces = [
  { name: "Acme Corp", role: "Owner", members: "5 members" },
  { name: "Design Studio", role: "Editor", members: "3 members" },
  { name: "Freelance", role: "Owner", members: "1 member" },
];

export default function WorkspaceSelectPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <h1 className="text-auth-title font-semibold text-center">Select a workspace</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center">
        Choose a workspace to continue
      </p>
      <div className="h-6" />
      <div className="flex flex-col gap-3 w-full">
        {workspaces.map((workspace) => (
          <button
            key={workspace.name}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors w-full text-left"
          >
            <p className="font-semibold">{workspace.name}</p>
            <p className="text-sm text-gray-500">
              {workspace.role} · {workspace.members}
            </p>
          </button>
        ))}
      </div>
      <div className="h-4" />
      <button className="text-auth-link text-center hover:underline w-full">
        Create new workspace
      </button>
    </AuthCard>
  );
}
