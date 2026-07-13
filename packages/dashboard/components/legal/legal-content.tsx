/**
 * Legal copy, shared by the /terms and /privacy pages AND the signup modal so
 * the text lives in exactly one place (SSOT). Self-contained styling so it
 * renders identically inside a full page or a dialog.
 */

const email = (addr: string) => (
  <a className="text-[var(--color-primary)] underline" href={`mailto:${addr}`}>
    {addr}
  </a>
);

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="text-[15px] leading-relaxed text-slate-700">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: May 18, 2026</p>
      <section className="mt-6 space-y-4">{children}</section>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-slate-900">{children}</h2>
);

export function TermsContent() {
  return (
    <Wrap title="Terms of Service">
      <H>1. Acceptance</H>
      <p>
        By creating an account or using Buildrick, you agree to these terms. If you do not agree, do
        not use the service.
      </p>
      <H>2. Account</H>
      <p>
        You are responsible for the activity on your account and for keeping your credentials secure.
        Notify us immediately if you suspect unauthorized use.
      </p>
      <H>3. Acceptable use</H>
      <p>
        Do not use Buildrick to publish unlawful, infringing, or harmful content. Do not interfere
        with the service or other users.
      </p>
      <H>4. Content ownership</H>
      <p>
        You retain ownership of the sites and content you create. You grant Buildrick a limited
        license to host, transform, and serve that content as required to operate the service.
      </p>
      <H>5. Termination</H>
      <p>
        You may close your account at any time. We may suspend or terminate accounts that violate
        these terms.
      </p>
      <H>6. Disclaimer</H>
      <p>The service is provided &quot;as is&quot; without warranty of any kind.</p>
      <H>7. Contact</H>
      <p>Questions about these terms: {email("legal@buildrick.io")}</p>
    </Wrap>
  );
}

export function PrivacyContent() {
  return (
    <Wrap title="Privacy Policy">
      <H>What we collect</H>
      <p>
        Account data (name, email, password hash), workspace and site content you create, billing
        identifiers from our payment processor, and operational logs (IP, user-agent, request
        timing) needed to run the service securely.
      </p>
      <H>How we use it</H>
      <p>
        To provide the service, authenticate you, deliver email you requested, prevent abuse, and
        meet legal obligations. We do not sell personal data.
      </p>
      <H>Sharing</H>
      <p>
        We share data with subprocessors that operate the service: hosting, email delivery, error
        monitoring, and payment processing. Each is bound by a data-processing agreement.
      </p>
      <H>Retention</H>
      <p>
        Account and content data are retained while your account is active. On deletion, data is
        purged within 30 days, except where retention is required by law.
      </p>
      <H>Your rights</H>
      <p>
        You can access, export, correct, or delete your data from your account settings, or by
        emailing {email("privacy@buildrick.io")}. EU residents have additional rights under GDPR.
        California residents have additional rights under CCPA.
      </p>
      <H>Cookies</H>
      <p>
        We use essential cookies for authentication and security, and optional analytics cookies you
        can decline in the cookie banner.
      </p>
      <H>Contact</H>
      <p>Data protection inquiries: {email("privacy@buildrick.io")}</p>
    </Wrap>
  );
}
