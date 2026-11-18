# Mission: Apni Figma file ka audit khud karna

## Why
Buildrick ka editor prototype (~1,400 boards, Figma page "Editor v3 · IA") aap ka
product hai, aur har audit ab tak agent ne kiya hai. Aap khud, 20 minute mein,
kisi bhi flow par faisla karna chahte hain: chal raha hai ya nahi, user-friendly
hai ya nahi, aasaan hai ya nahi — evidence ke saath, taake redesign aur code ki
priority aap khud set karein, agent ki report ka intezaar kiye baghair.

## Success looks like
- Kisi bhi ek job (e.g. "primary colour badlo") par 20 min mein cognitive
  walkthrough: har step par 4 sawal, Pass/Fail, aur ek line evidence.
- Presentation mode mein 5 min mein dead click / dead end / phansa hua overlay
  pakadna — "Show hints on click" aur R se.
- Har finding ko P0/P1/P2 rank karna aur "observed problem" ko "design
  suggestion" se alag rakhna.
- Ek issue table (Module | Action | Expected | Actual | Fix | Priority) khud
  likhna jo agent wali QA report jaisi ho.

## Constraints
- Roman Urdu; terse; drive, do not quiz. Ek recommendation + cost.
- Lessons ek baithak (≤ 20 min) mein khatam hon. Practice ground = apni file.
- Audit ke dauran design change nahi — pehle dekho, phir fix.
- Worked example pehle, phir practice.

## Out of scope
- Visual polish (spacing/type/colour critique) — flow aur usability sirf.
- Figma tooling basics (components, auto layout) — sirf prototype/presentation.
- Code implementation — audit se nikle findings alag plan mein jaate hain.
