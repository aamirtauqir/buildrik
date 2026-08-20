import { Clock } from "lucide-react";

/**
 * The link is valid; the site behind it has never been published, so there is
 * nothing to show yet. Replaces a redirect to `/<slug>` — a route that does not
 * exist — which handed the visitor a bare 404.
 */
export function ShareNotPublished({ siteName }: { siteName: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-bg-page)" }}
    >
      <div className="w-full max-w-sm mx-auto px-4">
        <div
          className="bg-white rounded-lg p-8 shadow-sm text-center"
          style={{ border: "1px solid var(--color-border-default)" }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-bg-subtle)" }}
            >
              <Clock className="w-6 h-6" style={{ color: "var(--color-text-secondary)" }} />
            </div>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {/* One string, not `{siteName}` + text: JSX dropped the space
                between them and it rendered as "sitenameisn’t published yet". */}
            {`${siteName} isn\u2019t published yet`}
          </h1>
          <p className="mt-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
            This link works — there&rsquo;s just nothing to show until the site is published. Keep
            it; it opens the site as soon as that happens.
          </p>
        </div>
      </div>
    </div>
  );
}
