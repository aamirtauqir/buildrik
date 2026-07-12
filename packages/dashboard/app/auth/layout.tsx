export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-auth-layout className="min-h-dvh bg-auth-page flex flex-col items-center justify-center px-4 py-8">
      {children}
    </div>
  );
}
