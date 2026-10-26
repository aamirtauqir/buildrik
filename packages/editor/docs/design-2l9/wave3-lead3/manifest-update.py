import json
p='scripts/conformance/boards-2l9.json'
raw=open(p).read()
d=json.loads(raw)
D='2026-10-27'
upd={
'497:99433': dict(verified='drift-fixed', authority='code:publish-toggle', note="probe-compared "+D+" (lead3, case topbar-shell, 1440×56, getBoundingClientRect vs board boxes): Exit 13/48 · site name plain text 69/176 · 'Site settings' gear+label 253/140 → Site settings · History 401/68 · Preview 1215/82 · Publish 1305/82 · ⋯ 1395/32 — all ±0. Review status is text 110 wide (no pill/dot/chevron); it sits at 1017 not 977 because the board's 'users' button is presence, drawn only with the collab flag (code:collab-flag). Save status left the bar (497:99485). Publish stays the tray toggle on the tray board (OD-1/Task 1.7, code:publish-toggle); label 'Publish' (lifecycle's 'Publish changes' stays the tray CTA)."),
'497:99485': dict(verified='drift-fixed', note="probe-compared "+D+" (lead3, case bottom-bar, 1440×32, states saved/error/not-loaded/saving + resource=1): left switcher chip (gray-100) + count; right '✓ Saved just now' at 1119 (board ~1121) in a 248 column, Ghost 'Details' 1367–1424 → History (the old save-pill click). States: 'Couldn’t save — Retry' (error tone, retries), 'Saving…', 'Not loaded · nothing saved yet' (loader glyph). Resource-area variant ends with the same pair. ⌘P → ⇧⌘O stays code:shortcut-cmd-p-is-preview."),
'7:18654': dict(note_prefix="lead3 "+D+": shell parts probe-compared — canvas bar moved to the top of the canvas column (case canvas-bar, 797 wide: readout · devices at 409 (board 409) on blue-100 · 1440 px chip 581/68 · 52% ⌄ 655/83 · View 744), bottom bar 'Saved just now · Details' (497:99485). Row stays open for the inspector Container-content part (lane B). | "),
'10:2199': dict(verified='drift-fixed', authority='owner:one-error-surface', note="probe-compared "+D+" (lead3, cases banner-save-failed + bottom-bar state=error): owner 2026-10-26 — one error surface. The failure is ONE bar in the global slot under the topbar ('✕ Couldn’t save <site> · <page>. Your changes are kept.' + Retry; full width, 40 tall — the board draws the strip in the canvas column, the owner routed it through the slot), the bottom bar says 'Couldn’t save — Retry', no toast (autosave + ⌘S toasts removed), the topbar carries no save label, and the bar shares the connection id so 'Reconnecting…'/'Can’t reach' replace it instead of stacking. SaveFailedBanner.tsx deleted; copy (refusal, page limit, deleted site, never loaded, foreign page, save-and-leave) in globalBanners.saveFailedBanner. context=publish copy not carried (F-18 open)."),
'225:3353': dict(note_prefix="lead3 "+D+": the save-failed strip that sat above the scrim is gone — a signed-out save raises no save-failed bar, and the slot is in flow under the modal's scrim. Not compared live (needs the session-expired modal in a running editor). | "),
'225:3888': dict(note_prefix="lead3 "+D+": the extra 'Couldn’t save… Retry · Keep editing' strip no longer shows for a signed-out save; the slot is drawn under the topbar (flex order, REQUESTS F-11 for the DOM move). Not compared live. | "),
'225:2821': dict(note_prefix="lead3 "+D+": slot now drawn under the topbar (y 56) via flex order from the shell; bar flat full width 40 tall with a leading ✕ (BANNER_BAR); save status 'Not loaded · nothing saved yet' in the bottom bar. Not compared live; Copy details / ✕ dismiss are LoadErrorBanner (L-F). | "),
'500:342702': dict(note_prefix="lead3 "+D+": banner under the topbar (shell flex order) and the status in the bottom bar ('Not loaded · nothing saved yet' · Details, probe bottom-bar state=not-loaded). Canvas/layers emptiness and Copy details are not shell. Not compared live. | "),
}
n=0
for r in d['boards']:
  u=upd.get(r.get('nodeId'))
  if not u: continue
  n+=1
  if 'verified' in u: r['verified']=u['verified']
  if 'authority' in u: r['authority']=u['authority']
  if 'note' in u: r['verifiedNote']=u['note']
  if 'note_prefix' in u: r['verifiedNote']=u['note_prefix']+r['verifiedNote']
print(n)
indent = 1 if raw.startswith('{\n "') else 2
open(p,'w').write(json.dumps(d,indent=indent,ensure_ascii=False)+'\n')
