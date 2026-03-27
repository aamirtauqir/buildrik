import { cn } from "@/lib/utils";

interface SocialButtonProps {
  provider: "google" | "github";
  onClick?: () => void;
  disabled?: boolean;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.8h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.32Z" fill="#4285F4" />
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20Z" fill="#34A853" />
      <path d="M4.42 11.9a6.01 6.01 0 0 1 0-3.8V5.5H1.07a9.99 9.99 0 0 0 0 8.98l3.35-2.6Z" fill="#FBBC05" />
      <path d="M10 3.98c1.47 0 2.78.5 3.81 1.5l2.85-2.85A9.99 9.99 0 0 0 1.07 5.5L4.42 8.1C5.2 5.74 7.4 3.98 10 3.98Z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0 1 10 4.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10Z" />
    </svg>
  );
}

export function SocialButton({ provider, onClick, disabled }: SocialButtonProps) {
  const label = provider === "google" ? "Continue with Google" : "Continue with GitHub";
  const Icon = provider === "google" ? GoogleIcon : GitHubIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-auth-btn rounded-auth-btn text-sm font-medium",
        "text-auth-text-secondary bg-white",
        "border border-auth-input-border hover:bg-gray-50 transition-colors",
        "flex items-center justify-center gap-3",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      <Icon />
      {label}
    </button>
  );
}
