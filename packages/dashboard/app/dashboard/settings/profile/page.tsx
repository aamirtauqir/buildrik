"use client";

import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { ProfileForm } from "@/components/settings/profile-form";
import { ErrorState } from "@/components/states";

/** Personal › Profile (IA v2 D6 card mapping). Reuses the shared ProfileForm +
 *  its account.profile handlers; the settings layout owns the section header. */
export default function ProfilePage() {
  const { addToast } = useToast();
  const profileQuery = trpc.account.profile.get.useQuery();
  const profileUpdate = trpc.account.profile.update.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Profile updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (profileQuery.isLoading) return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!profileQuery.data) return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;

  const profile = profileQuery.data;

  return (
    <ProfileForm
      initialData={{
        fullName: profile.fullName,
        email: profile.email,
        bio: profile.bio ?? undefined,
        language: profile.language,
        timezone: profile.timezone,
        displayName: profile.displayName ?? undefined,
        avatarUrl: profile.avatar ?? undefined,
      }}
      onSave={(data) => profileUpdate.mutate(data)}
      saving={profileUpdate.isPending}
    />
  );
}
