import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Buildrik",
};

export default function TermsPage() {
  return (
    <main
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <article className="max-w-2xl w-full px-6 py-16 text-[15px] leading-relaxed text-slate-700">
        <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: May 18, 2026</p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">1. Acceptance</h2>
          <p>
            By creating an account or using Buildrik, you agree to these terms.
            If you do not agree, do not use the service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">2. Account</h2>
          <p>
            You are responsible for the activity on your account and for keeping
            your credentials secure. Notify us immediately if you suspect
            unauthorized use.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">3. Acceptable use</h2>
          <p>
            Do not use Buildrik to publish unlawful, infringing, or harmful
            content. Do not interfere with the service or other users.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">4. Content ownership</h2>
          <p>
            You retain ownership of the sites and content you create. You grant
            Buildrik a limited license to host, transform, and serve that
            content as required to operate the service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">5. Termination</h2>
          <p>
            You may close your account at any time. We may suspend or terminate
            accounts that violate these terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">6. Disclaimer</h2>
          <p>
            The service is provided &quot;as is&quot; without warranty of any kind.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">7. Contact</h2>
          <p>
            Questions about these terms: <a className="text-[var(--color-primary)] underline" href="mailto:legal@buildrik.app">legal@buildrik.app</a>
          </p>
        </section>

        <p className="mt-12 text-sm">
          <Link href="/auth" className="text-[var(--color-primary)] underline">
            ← Back to sign in
          </Link>
        </p>
      </article>
    </main>
  );
}
