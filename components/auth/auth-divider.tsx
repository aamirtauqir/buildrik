export function AuthDivider({ text = "or continue with" }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px bg-auth-input-border" />
      <span className="text-auth-subtitle text-auth-text-placeholder whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-auth-input-border" />
    </div>
  );
}
