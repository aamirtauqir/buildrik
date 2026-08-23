# U6 · Review / share — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session for the owner, a **clean
anonymous context** for the client.

The CEO review of 2026-08-24 called this flow the product's wedge and noted it
had never been walked once. This is that walk, for the share half.

## The doors

| door | where |
|---|---|
| Review panel | ⌘K → **"Open Review panel · R"** |
| Share preview link | site menu → **"Share preview link"**, which opens a NEW TAB at `/dashboard/sites/<id>?share=1` — the editor hands off to the dashboard's ShareDraftModal |

The site menu itself is dense and legible: Site settings, Version history,
Publish panel, Publish history, Export code, Site health, Activity log,
Templates, Components, Design system, Plugins, Enter view mode, Share preview
link, Invite teammates, Account settings, Keyboard shortcuts.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Review panel empty state | **PASS** — *"No review yet — Send this site to a client and they get a link to comment on it."* with a **Send for review** action. One sentence, and it explains the differentiator. |
| 2 | Share Draft modal | **PASS, and unusually honest** — *"A private link to this site for clients or teammates. **It opens the published site — there is no server-side render of the draft** — and can carry a password and an expiry."* Link name, optional password (`Password links require PRO`), expiry chips (1 day / 7 days / 30 days (upgrade) / No expiry). |
| 3 | creating the link | **PASS** — produced `http://localhost:3000/share/3b00d2a7-…` with Copy / Done, and the modal's post-create copy states the limitation again: *"Until the site is published, the link says so rather than showing the draft."* |
| 4 | **what a client actually sees** | **PASS, and this is the leg that had never been run** — opened in a clean anonymous context. HTTP **200**, and the page reads: *"scratch-smoke isn't published yet — This link works — there's just nothing to show until the site is published. Keep it; it opens the site as soon as that happens."* No 404, no broken render, no dead end. It tells the client the link is good and what will happen. |

Leg 4 matters because this repo has the opposite on record: a `/share/<token>`
that returned 200 while the page said "This link doesn't work". Here the status
and the words agree, and the words are useful.

## NOT walked

- **The review ROUND** — `Send for review` → `reviews.submit` → the admin
  resolving APPROVED / CHANGES_REQUESTED, and `/review/<token>` as the client
  sees it. That is U6's other half and the part that actually closes the loop.
- The password and expiry options on a share link.
- Whether the share link opens the real published site once one exists — which
  cannot be walked until SHIP-gate item 3 (a real publish) is done.

## Disclosed

This walk created one real draft-link row on `scratch-smoke`
(`3b00d2a7-6143-4fa6-af73-61e5a3e24227`). It is a scratch site and the link is
harmless, but the row is mine and is not cleaned up.
