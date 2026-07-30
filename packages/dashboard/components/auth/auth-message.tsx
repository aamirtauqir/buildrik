import { AuthCard } from "./auth-card";

interface AuthMessageProps {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  noArt?: boolean;
  /** Status glyph above the title — the mockup's 48px neutral tile. */
  icon?: React.ReactNode;
}

/**
 * Craftwork status/message screen: centered title + subtitle, then CTAs.
 * Used by all auth error and confirmation screens for a single consistent shape.
 */
export function AuthMessage({ title, subtitle, children, noArt, icon }: AuthMessageProps) {
  return (
    <AuthCard noArt={noArt}>
      {icon && (
        <span className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-auth-btn-secondary">
          {icon}
        </span>
      )}
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">{title}</h1>
        {subtitle && <p className="text-auth-subtitle text-auth-text-muted mt-2">{subtitle}</p>}
      </div>
      {children != null && (
        <>
          <div className="h-6" />
          <div className="w-full flex flex-col items-center gap-3">{children}</div>
        </>
      )}
    </AuthCard>
  );
}
