"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function AccessRemovedContent() {
  const workspace = useSearchParams().get("workspace") ?? "the";

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
      title="Your access was removed"
      subtitle={`An admin removed your access to the ${workspace} workspace. Contact them if you think this is a mistake.`}
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Back to log in</AuthButton>
    </AuthMessage>
  );
}

export default function AccessRemovedPage() {
  return <Suspense fallback={null}><AccessRemovedContent /></Suspense>;
}
