import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-auth-card bg-white rounded-auth-card shadow-auth-card p-8 flex flex-col items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
