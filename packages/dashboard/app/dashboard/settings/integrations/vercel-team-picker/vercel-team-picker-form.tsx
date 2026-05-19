"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";

interface Props {
  workspaceId: string;
  defaultTeamId: string | null;
  candidateTeams: Array<{ id: string; name: string; slug: string }>;
}

export function VercelTeamPickerForm({
  workspaceId,
  defaultTeamId,
  candidateTeams,
}: Props) {
  const [selected, setSelected] = useState<string | null>(defaultTeamId);
  const router = useRouter();
  const finish = trpc.integrations.vercel.finishConnect.useMutation({
    onSuccess: () =>
      router.push("/dashboard/settings/integrations?connected=1"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        finish.mutate({ workspaceId, teamId: selected });
      }}
      className="space-y-2"
    >
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-neutral-50 ${
          selected === null ? "border-black" : "border-neutral-200"
        }`}
      >
        <input
          type="radio"
          name="team"
          checked={selected === null}
          onChange={() => setSelected(null)}
        />
        <span className="text-sm font-medium">Personal account</span>
      </label>

      {candidateTeams.map((t) => (
        <label
          key={t.id}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-neutral-50 ${
            selected === t.id ? "border-black" : "border-neutral-200"
          }`}
        >
          <input
            type="radio"
            name="team"
            checked={selected === t.id}
            onChange={() => setSelected(t.id)}
          />
          <span className="text-sm">
            <span className="font-medium">{t.name}</span>{" "}
            <span className="text-neutral-500">({t.slug})</span>
          </span>
        </label>
      ))}

      <div className="pt-2">
        <button
          type="submit"
          disabled={finish.isPending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {finish.isPending ? "Connecting…" : "Connect"}
        </button>
      </div>

      {finish.error && (
        <p className="text-sm text-red-600">{finish.error.message}</p>
      )}
    </form>
  );
}
