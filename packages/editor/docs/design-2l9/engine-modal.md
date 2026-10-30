# Engine model · Modal trigger↔dialog link (B-17)

Boards: C07 `245:39899` (local trigger and page-root dialog), C10 `245:41419`
(explicit local insertion result), C18 `252:46927` (dialog behaviour / exact
return). Owner approval 2026-10-30.

## Data shape — attributes on the elements

| Element | Attribute | Meaning |
|---|---|---|
| dialog root (`role="dialog"`, `aria-modal="true"`) | `data-modal-key="<key>"` | its identity |
| | `data-modal-escape="true\|false"` | Close on Escape (default true) |
| | `data-modal-backdrop="true\|false"` | Close on backdrop click (default true) |
| | `data-modal-initial="closed\|open"` | state on page load (default closed) |
| trigger (any element; the block's is a button) | `data-modal-target="<key>"` | the dialog it opens |
| close control inside the dialog | `data-modal-close` | closes it (the block's ×) |

`<key>` is stable (`modal-…`), independent of element ids (which duplicate
remaps). Several triggers may target one dialog; a dialog with no trigger is
legal ("Delete trigger keeps its dialog").

## Engine (`src/engine/widgets/modalModel.ts`)

Each a history step:

- `readModal(composer, id)` — from a trigger or a dialog: `{ trigger, dialog,
  placement }` where placement says "Dialog is a direct child of {page}" and
  where the trigger sits ("Trigger is inside {Hero}") — C07's sentence.
- `linkModal(triggerId, dialogId)` — "Link existing dialog" (writes the key on
  the dialog if it has none).
- `duplicateModal(triggerId)` — "Duplicate modal": copies trigger and dialog
  (dialog stays at the page root), gives the copy a NEW key and points the new
  trigger at it ("creates both roots and remaps their link").
- `setDialogBehavior(dialogId, { escape?, backdrop?, initial? })` — C18.
- `ensureModalLink(triggerId)` — legacy: links a `.modal-trigger` to the
  `.modal-overlay` the old block placed after it.

## Editor UI

- The Modal block now adds the dialog at the **page root** (C07/C10: "Trigger
  and dialog were added at Home's root") with the key, behaviour defaults and
  `data-modal-close` on its ×; the trigger carries `data-modal-target`.
- Inspector "Modal relationship" / "Edit Contact dialog" / "Link existing
  dialog" / "Duplicate modal" / "Dialog behavior" are L-B's, on these
  functions (REQUESTS B-17 reply).

## Canvas

`useTabsModalRuntime` runs the runtime with `interactive: false`: dialogs stay
closed **unless** the selection is the dialog or inside it — then it is
revealed while selected (C18: "Editor reveal and visitor open state are
temporary"; nothing is saved). A selected trigger does NOT reveal it: the
dialog is a full-page overlay and would cover the canvas the moment a modal is
inserted; "Edit Contact dialog" (L-B) selects the dialog to reveal it.

## Published / export

`src/engine/export/modalRuntime.ts` (`initModalRuntime`), import-free,
serialized by `lib/publish-widgets.ts` on pages containing `role="dialog"`.
It acts only on the Modal block's dialogs (`[data-modal-key]` or the legacy
`.modal-overlay`), never on another `role="dialog"` the page carries:

- trigger click (and Enter/Space on a non-button trigger) opens its dialog;
  the trigger gets `aria-haspopup="dialog"`, `aria-controls`, `aria-expanded`;
- open: the dialog shows (`display` restored from `data-modal-display`, default
  `flex`), focus moves to the first focusable inside (else the dialog, given
  `tabindex="-1"`), Tab / Shift+Tab are trapped inside, every sibling branch of
  the dialog's path to `<body>` is made `inert` (+ `aria-hidden`);
- close: Escape (if allowed), a click whose target **is** the backdrop (the
  dialog root itself; if allowed), or any `[data-modal-close]` / `.modal-close`;
  inertness is undone and focus returns to the trigger that opened it;
- `data-modal-initial="open"` opens on load;
- idempotent per dialog, returns a cleanup.

## Existing projects

No migration. A legacy modal (a `.modal-trigger` and a `.modal-overlay` with
`role="dialog"`, no keys) loads unchanged and now works on the published page:
the runtime links each un-keyed trigger to the first un-keyed dialog that
follows it in document order, and its `.modal-close` closes it. The first
editor edit of the relationship (`ensureModalLink`) writes keys.
