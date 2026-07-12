import { LayoutGrid } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-2">
      <LayoutGrid className="w-9 h-9 text-auth-cta" />
      <span className="text-2xl font-bold tracking-tight text-auth-text-primary">Buildrick</span>
    </div>
  );
}
