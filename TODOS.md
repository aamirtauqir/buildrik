# TODOS

Deferred work with a reason. Items land here when they were considered and
consciously not done, not when they were forgotten.

## Security

- [ ] **CSP: remove `'unsafe-inline'` from `script-src`.** `next.config.mjs` now
  drops `'unsafe-eval'` in production (nothing shipped needs it — there is no
  `eval(` or `new Function(` in `packages/editor/src`). `'unsafe-inline'` is the
  harder half: Next inlines hydration bootstrap scripts, so removing it needs a
  nonce middleware that does not exist. Ship
  `Content-Security-Policy-Report-Only` with a report endpoint first, watch for a
  week, then enforce — tightening a CSP by guessing is how you take a site down.

- [ ] **Sanitize AI-generated HTML at the worker boundary.** `ExportEngine` now
  sanitizes `contentFormat: "html"` content before publishing it, so published
  sites are safe. The canvas still mounts the AI worker's raw output un-escaped
  (`Canvas.tsx:511`), on an authenticated same-origin route, and the worker
  bypasses the `HTMLParser` sanitize path entirely. That is a real XSS surface,
  narrowed but not closed. Sanitize in `ai-generate/[jobId]/route.ts` before the
  content is ever stored.

- [ ] **Audit the token-authenticated surface.** The 2026-07-20 `/cso` pass found
  the session-authenticated surface clean, and the one real hole of the day was
  on the token side (`listClientComments`, fixed in `29670bf4`). Client review,
  share links and API tokens have not had the same treatment.

## Testing

- [ ] **Run the full Playwright suite in CI, not just the smoke floor.**
  `.github/workflows/dashboard-tests.yml` runs `dashboard.spec.ts` against a
  Postgres service. The other 100 tests (a11y, responsive, link-integrity,
  settings drill-in, onboarding) still only run by hand.

- [ ] **Decide whether BrowserStack earns its keep.** `playwright.config.ts:13`
  derives `isBS` from the presence of `BROWSERSTACK_USERNAME` /
  `BROWSERSTACK_ACCESS_KEY`, both of which sit in `.env.local`. Every local
  `npx playwright test` therefore ran against the paid cloud grid, silently,
  while CI ran no browser tests at all. Either gate it behind an explicit
  `PW_BS=1`, or drop the projects. Never derive an expensive default from a
  credential being present.

## Product (surfaced by the 2026-07-20 CEO review, not yet scheduled)

- [ ] **No product analytics.** `sidebarAnalytics.ts` is a console.log stub.
  Nothing measures activation, drop-off, or whether the Vercel-OAuth publish step
  costs users. Decisions about what to build next are currently unmeasurable.

- [ ] **J5 client sign-off has no client-facing screen.** Founder-locked as the
  #1 priority on 2026-07-18 (`docs/prd/editor/14-screen-specs.md:338`). The
  comment backend exists; `app/review/[token]/` does not. `app/share/[token]/`
  already ships the pattern to copy. Either build it or revoke the lock — do not
  let it decay by neglect.
