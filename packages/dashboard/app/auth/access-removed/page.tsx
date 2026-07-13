"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserX } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function AccessRemovedContent() {
  // /auth/redirect sends users here with no `?workspace`, and the old default
  // of "the" rendered "…access to the the workspace." Name the workspace only
  // when we were actually given one.
  const workspace = useSearchParams().get("workspace");
  const where = workspace ? `the ${workspace} workspace` : "this workspace";

  // The member has been removed — clear their session so "Back to log in"
  // actually lands on the signin page (not bounced back into the dashboard by
  // the still-valid cookie), and their access is genuinely revoked now.
  useEffect(() => {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
  }, []);

  return (
    <AuthMessage
      icon={<UserX size={26} strokeWidth={1.7} className="text-[#B7791F]" />}
      title="Your access was removed"
      subtitle={`An admin removed your access to ${where}. If you think this was a mistake, reach out to the workspace owner.`}
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Back to log in</AuthButton>
    </AuthMessage>
  );
}

export default function AccessRemovedPage() {
  return <Suspense fallback={null}><AccessRemovedContent /></Suspense>;
}
