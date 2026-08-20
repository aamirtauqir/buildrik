export function AuthDivider({ text = "or continue with" }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px bg-auth-input-border" />
      {/* -muted, not -placeholder: the divider word measured 2.79:1 on white
          (axe, login and signup), well under AA. Placeholder grey is for text
          inside a field, where it sits behind a label; this is standalone. */}
      <span className="text-auth-subtitle text-auth-text-muted whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-auth-input-border" />
    </div>
  );
}
