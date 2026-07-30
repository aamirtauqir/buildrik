import Link from "next/link";
import { PrivacyContent } from "@/components/legal/legal-content";

export const metadata = {
  title: "Privacy Policy — Buildrick",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex justify-center" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <article className="max-w-2xl w-full px-6 py-16">
        <PrivacyContent />
        <p className="mt-12 text-body">
          <Link href="/auth" className="text-[var(--color-primary)] underline">
            ← Back to sign in
          </Link>
        </p>
      </article>
    </main>
  );
}
