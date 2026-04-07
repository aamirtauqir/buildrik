interface InlineErrorProps {
  message?: string;
}

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;
  return (
    <p className="text-auth-error text-auth-cta mt-1">{message}</p>
  );
}
