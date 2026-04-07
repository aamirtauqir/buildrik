import { cn } from "@lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-[calc(100vw-32px)] max-w-auth-card bg-white rounded-auth-card shadow-auth-card p-8 max-[480px]:p-5 flex flex-col items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
