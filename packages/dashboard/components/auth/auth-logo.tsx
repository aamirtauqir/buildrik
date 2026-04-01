import { LayoutGrid } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      <LayoutGrid className="w-8 h-8 text-auth-cta" />
      <span className="text-xl font-bold text-auth-text-primary">Buildrik</span>
    </div>
  );
}
