# U7 · Media flow + F-A4 · Upload pipeline — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, 1440×900, real session, with a generated
64×64 PNG so the decoded size could be checked against a known value.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Media panel empty state | **PASS** — *"No images or files yet."* with **Upload** / **Browse stock**, and per-type counts (image 0 · video 0 · svg 0 · icon 0) that update live. |
| 2 | upload → auto-WebP | **PASS** — `walk-probe.png` landed as **`walk-probe.webp`**. The contract's auto-convert step is real. |
| 3 | server mirror | **PASS** — `POST /api/asset-upload` fired on upload. |
| 4 | insert onto the canvas | **PASS** — selecting the asset placed it: 9 → 10 elements. |
| 5 | **the image actually renders** | **PASS, and this is the one worth measuring** — the canvas `<img>` has `src: blob:http://localhost:3000/eee181db…` and **`naturalWidth: 64`**, matching the generated file exactly. It decoded; it is not a broken box. **Zero CSP complaints** in the console. |

Leg 5 is the point. `feedback_media_upload_unresolved` records this failing with
**three blocks stacked**: the CSP had no `blob:` in `img-src`, the sanitizer
dropped the attribute, and the rebuilt URL never reached the page. An `<img>`
being present proves none of that is fixed — `naturalWidth > 0` does. It is 64,
which is the width of the file I made.

## Not walked

Import-from-URL (whose modal tab is a documented ⛔ coming-soon stub), stock
search (Unsplash/Pexels/Pixabay), folders and smart folders, **Trash — which is
a `"Trash coming soon"` toast stub confirmed earlier this session**, bulk
move/delete, the alt-text detail rail and its AI generate, the Versions tab and
`replaceAcross`, the image editor (crop/adjust/resize), the optimizer, and the
369-icon Lucide picker.

Also not walked: the quota pre-check and its 80% / 95% warnings, the
`localOnly=true` retry queue when the mirror fails, the delete-during-upload
tombstone, and the FSM's intermediate states — the upload completed too fast to
observe `pending → uploading → optimizing → processing`.
