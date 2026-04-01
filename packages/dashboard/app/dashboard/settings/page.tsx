"use client";

import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { ProfileForm } from "@/components/settings/profile-form";

export default function SettingsProfilePage() {
  const { addToast } = useToast();
  const profileQuery = trpc.account.profile.get.useQuery();
  const updateMutation = trpc.account.profile.update.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Profile updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (profileQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  if (!profileQuery.data) return null;

  const { fullName, displayName, email, bio, language, timezone, avatar } = profileQuery.data;
  return (
    <ProfileForm
      initialData={{ fullName, email, bio: bio ?? undefined, language, timezone, displayName: displayName ?? undefined, avatarUrl: avatar ?? undefined }}
      onSave={(data) => updateMutation.mutate(data)}
      saving={updateMutation.isPending}
    />
  );
}
