import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Buildrik",
};

export default function PrivacyPage() {
  return (
    <main
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <article className="max-w-2xl w-full px-6 py-16 text-[15px] leading-relaxed text-slate-700">
        <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: May 18, 2026</p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">What we collect</h2>
          <p>
            Account data (name, email, password hash), workspace and site
            content you create, billing identifiers from our payment processor,
            and operational logs (IP, user-agent, request timing) needed to
            run the service securely.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">How we use it</h2>
          <p>
            To provide the service, authenticate you, deliver email you
            requested, prevent abuse, and meet legal obligations. We do not
            sell personal data.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Sharing</h2>
          <p>
            We share data with subprocessors that operate the service: hosting,
            email delivery, error monitoring, and payment processing. Each is
            bound by a data-processing agreement.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Retention</h2>
          <p>
            Account and content data are retained while your account is active.
            On deletion, data is purged within 30 days, except where retention
            is required by law.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Your rights</h2>
          <p>
            You can access, export, correct, or delete your data from your
            account settings, or by emailing{" "}
            <a className="text-[var(--color-primary)] underline" href="mailto:privacy@buildrik.app">
              privacy@buildrik.app
            </a>
            . EU residents have additional rights under GDPR. California
            residents have additional rights under CCPA.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Cookies</h2>
          <p>
            We use essential cookies for authentication and security, and
            optional analytics cookies you can decline in the cookie banner.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Data protection inquiries: <a className="text-[var(--color-primary)] underline" href="mailto:privacy@buildrik.app">privacy@buildrik.app</a>
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
