import { AuthLogo } from "@/components/auth/auth-logo";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <AuthLogo />
      <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
      <p className="text-auth-subtitle text-auth-text-muted">Completing sign in...</p>
    </div>
  );
}
