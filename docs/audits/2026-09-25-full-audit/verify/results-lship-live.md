# Lane Lship: live verification on :3100

- Checkout: `buildrik-af-verify` @ `078e2d915`, which contains `f2eef3553`, `ad227554b` and `f17dc8d7e`.
- App: `http://192.168.100.5:3100`. DB: `buildrik_verify`.
- Scripts: `scripts/audit/verify/lship-live/` (`api-1c.mjs`, `api-i2.mjs`, `ui-1a.mjs`, `ui-i2.mjs`, `ui-pub.mjs`, `lib.mjs`). The rows were backed up first to `backup/`.
- One headless chromium ran at a time, at 1440×900.

| ID | Verdict | Evidence | Notes |
|---|---|---|---|
| I-1a (new tab) | PASS | See the evidence notes below. Shots: `shots/I-1a-valid-1-dialog.png`, `I-1a-valid-2-newtab.png`, `I-1a-inject-1-dialog.png`, `I-1a-inject-2-newtab.png`. | To reach the preview, `cms_collections.pageTemplatePath` for Posts was set to `about.html` for the run. It was then restored to NULL. |
| I-1a (injection at save) | PASS | `sites.saveProject` as owner with GA `x');window.__pwned=1;//` returned 200. The DB then held `googleAnalytics:{enabled:true, measurementId:""}` with `verifiedAt` dropped. The Clarity id `abc123` in the same save kept its `verifiedAt`, and `seo` was unchanged. | `api-1c.mjs` |
| I-1c | PASS | `saveProject` returned 200. The DB kept GA `G-ABCD1234`, GTM `GTM-ABCD` and Clarity `abc123`, each with `verifiedAt` `2026-09-20T10:00:00.000Z` unchanged. | Restored afterwards. `projectSettings` compared equal to the backup. |
| I-2 (API) | PASS | As editor@, a `saveProject` for S1 that carried S2's page `cmui3swig001cji7wf3plwif8` (renamed "HIJACKED", with new blocks) got HTTP 400 `BAD_REQUEST` "This save includes a page that belongs to another site…". Before and after, these were identical: S2's page md5 and `updatedAt`, the S2 site row md5 (`62373ad8…`), S1's pages, and S1's `lastEditedAt`. The page stayed "Services" with siteId S2. | `api-i2.mjs`. The captured body is `i2-body.json`. |
| I-2 (UI) | PASS | editor@ on S1, with `sites.saveProject` intercepted to return the captured 400 body (stack removed), then Ctrl+S. The toast read "Save failed / This save included a page from another site and was refused. Reload the site before editing. / Retry". The header chip read "Save failed — retry". The URL stayed `/edit/<S1>` with no `view=readonly`, at 4s and again at 8s, and no read-only or role copy appeared. Shot: `shots/I-2-ui-1-save-failed.png`. | The DB was untouched (the request was intercepted). |
| Published analytics | PASS | See the evidence notes below. Shot: `shots/PUB-analytics-after-publish.png`. | The body is saved as `pub-body.json`. S2 was restored to DRAFT with no publishedUrl. |

### Evidence notes

**I-1a (new tab).** Path: editor as owner, S1, CMS, Posts, "Verify Post 1", record menu, "Preview saved record", "Open in new tab". The popup had:
- `location.href` = `about:blank`.
- `window.opener === null`.
- Exactly 1 iframe, `hasAttribute('sandbox')`=true and `sandbox=""`.
- srcdoc identical to the dialog's frame.
- The tab's own document had 0 `<script>`, and its body children were `[IFRAME]` only.
- `self.origin` inside the frame was `"null"`.
- Chrome logged "Blocked script execution in 'about:srcdoc'… sandboxed".

Two runs:
- **Valid GA:** the id reached the page as `gtag('config', "G-ABCD1234", …)`.
- **Injection planted directly in the DB** (bypassing the save boundary), GA and Clarity set to `x');window.__pwned=1;//</script><script>window.__pwned=2</script>`: the srcdoc carried `"x');window.__pwned=1;//</script><script>…"` and the loader src was percent-encoded. No raw breakout appeared. `window.__pwned` was null in both the app page and the new tab.

**Published analytics.** Owner published S2 (simulation) through the editor's "Publish anyway", then "Publish now". The response was 200 QUEUED, the job was `cmuinctbk000bzwc3qldglut4` (COMPLETED), and the URL was `…dev-simulated.invalid`. S2's settings were planted in the DB beforehand: GA `G-ABCD1234`, with Pixel and Clarity set to the injection string. The captured `sites.publish` payload, for both `index.html` and `services.html`, contained:
- `gtag('config', "G-ABCD1234", …)`.
- `fbq('init', "x');…</script><script>…")`.
- `"clarity","script","x');…</script>…"`.
- The pixel `img` src percent-encoded.
- `<script` and `</script` counts balanced at 4 and 4, with no raw `'x');window` or `</script><script>window.__pwned` anywhere.

## Found on the way

1. **Two contradictory messages for the I-2 save refusal.** Besides the correct toast, the canvas banner said "Couldn't save Verify Site One · Home — Your changes are still here. **Check your connection**, then retry saving." That is generic network copy, and it contradicts the toast. Retrying cannot succeed either, since the toast says to reload. See `shots/I-2-ui-1-save-failed.png`.
2. **Published head is cut short (pre-existing, minor).** In the published HTML the Pixel's `<noscript><img …></noscript>` is re-serialized as `<noscript></noscript></head><body><img …>`. The HTML is parsed with scripting off, where an `<img>` inside head-noscript closes the head. Everything after it, including the Clarity script, lands at the top of `<body>`. It still runs, but the head is cut short.
3. **CSP blocks the tracker loader in the editor.** The editor's CSP `script-src 'self' 'unsafe-inline' 'unsafe-eval'` blocked `https://www.googletagmanager.com/gtag/js?id=G-ABCD1234` in the app page during the publish run. It is a console error only; the canvas renders the site's head. This is expected for a dashboard origin.
4. **Dev server returns stack traces.** The tRPC error bodies include the full server stack. This is `NODE_ENV=development`; confirm prod strips it.

## Not verified and why

- **Real Vercel deploy:** only the simulation publish path ran, so the check covers what the editor sends, not a live deployed page.
- **Popup blocker:** not exercised; headless Playwright allows popups.
- **CSS rendering in the new-tab frame:** checked only by the shot, not measured.
- **Autosave on the I-2 error:** only the manual Ctrl+S path was driven.
- **Leftover state:** the publish job row `cmuinctbk000bzwc3qldglut4` (and any rows it created) stays in `buildrik_verify`. All `sites` and `pages` rows for S1 and S2 were restored and diffed field by field against the backup (0 differing fields). Posts `pageTemplatePath` was restored to NULL.
