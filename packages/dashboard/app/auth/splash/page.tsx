import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
  return (
    <AuthCard noArt>
      <div className="flex flex-col items-center gap-5 py-6">
        <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
        <p className="text-auth-subtitle text-auth-text-muted">Loading Buildrick…</p>
      </div>
    </AuthCard>
  );
}
