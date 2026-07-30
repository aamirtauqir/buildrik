import Link from "next/link";
import { TermsContent } from "@/components/legal/legal-content";

export const metadata = {
  title: "Terms of Service — Buildrick",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen flex justify-center" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <article className="max-w-2xl w-full px-6 py-16">
        <TermsContent />
        <p className="mt-12 text-body">
          <Link href="/auth" className="text-[var(--color-primary)] underline">
            ← Back to sign in
          </Link>
        </p>
      </article>
    </main>
  );
}
