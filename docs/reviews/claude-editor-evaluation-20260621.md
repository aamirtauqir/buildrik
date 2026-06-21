# Claude's Editor Evaluation — parallel to the usability test

**Maqsad:** Main (Claude) ne wahi task khud chala kar, expert nazar se, editor evaluate kiya — **same 7 steps, same severity scale (1-4)** jo `usability-test-kit-20260621.md` mein hai. Taakey tum **users ki sheets ke saath side-by-side** rakh ke compare kar sako: kahan hum dono agree karte hain (= pakka problem), kahan differ (= dilchasp).

---

## Pehle — imaandari (yeh zaroori hai)

1. **Main naya user NAHI hoon.** Main product andar se jaanta hoon. Iska matlab: jahan ek pehli-baar wala user atkega, main shayad seedha kar loon — to **main beginner ki confusion ko KAM aankunga.** Yehi wajah hai ke real-user test zaroori hai; mera kaam uska replacement nahi, **comparison** hai.
2. **Yeh expert/heuristic evaluation hai** (NN/g 10 heuristics), live walk-through (is session mein editor + dashboard maine khud chala) + actual code padh ke grounded. Browser tool beech mein mar gaya, to fresh blank-site walk dobara nahi kar saka — magar isi session mein editor extensively chala chuka hoon.
3. **AI slop** — yeh main code se poori tarah judge nahi kar sakta (AI ka GENERATED output dekhna padega). Us pe meri rai weak hai; **woh user test behtar pakdega.**

---

## 🔴 HEADLINE finding (sabse bara — code se pakka)

**Tumhari IA simplification (11 tabs → 4 tools) BANI hui hai, magar users ke liye ON nahi.**

- Code: `tabsConfig.ts:296` — *"Pure data; no behaviour wired yet (the live rail still renders from GROUPED_TABS_CONFIG)."*
- `LeftSidebar.tsx:4` — *"Rail: 60px icon navigation with **3 zones**"*; line 498 default render = 3 zones.
- `LeftSidebar.tsx:168` — clean **4-tool rail flag-gated behind `?rail=4`** (URL param). **Default OFF.**

**Matlab:** users abhi bhi **~11 icon ka rail, 3 zones** mein dekhte hain:
- *Creation:* Insert, AI, Templates, Media, Components (5)
- *Structure:* Layers, Pages (2)
- *Config:* Design, Settings, Publish, History (4)

Ek banda jo bas "ek page banao" chahta hai, usko **11 navigation choices** ghoorni padti hain. Yeh **bilkul "IA wrong / overwhelming / hard"** wali shikayat ke mutabiq hai.

**Iska matlab redesign-from-scratch ZAROORI nahi ho sakta** — kyunke saaf 4-tool IA **already code mein BANA + chal raha hai**, sirf flag ke peeche. Maine code verify kiya:
- `FourToolRail` — 4 tools (Insert/Pages/Styles/Site) rail buttons render karta hai.
- `ToolSubNav` — jab ek tool 1 se zyada tab fold kare (Insert → Add/Templates/Components/Media; Site → Settings/Publish/History), panel ke upar ek sub-tab row deta hai, taakey **har purana tab apni reach na khoye** (stub nahi, poora wired).
- AI already topbar mein (✨), Structure already footer mein — woh hisse LIVE hain. Sirf RAIL khud default pe 11-icon hai, 4-tool nahi.

Pehla kadam: `?rail=4` ka ek **completeness QA pass + default ON karo**, phir user test mein woh dekho. **Yeh ek high-value, sasta lever hai — pura redesign nahi.** (Yeh tha jo maine pehle ghalti se socha "ship ho chuka" — rail ke liye ho NAHI chuka.)

*Bonus finding:* default 11-icon mode mein "AI" rail icon AUR topbar ✨ — **AI do jagah** dikhta hai (redundant). `?rail=4` mein yeh bhi theek (AI sirf topbar).

---

## Task walk — 7 steps (severity 1-4, mirror of the kit)

| # | Step | Meri Sev | Kyun (heuristic + reasoning) |
|---|------|----------|------------------------------|
| 1 | Heading add | **2** | Empty canvas "Click + in the sidebar" kehta hai — magar `+` ek RAIL icon hai, button nahi jo seedha add kare. Panel khulta hai 53 blocks / 6 categories ke saath = "bas heading chahiye" wale ko zyada. Aur "drag to canvas" tip => click vs drag ambiguous. |
| 2 | Heading text edit | **1-2** | Double-click inline edit standard hai; inspector "YOU ARE EDITING this heading" achi guidance. Pehli baar wale ko double-click pata hona chahiye — warna sev 2. |
| 3 | Text block add | **2** | Same as #1 — 53 blocks mein "Text" dhoondhna. Heading vs Text vs Label vs List — chhote farq confuse kar sakte. |
| 4 | Button add | **2** | "Button" BASIC mein hai, theek. Magar add karne ke baad style/link karna alag flow. |
| 5 | Page/structure samajhna | **2-3** | "Structure" footer + Layers rail dono structure dikhate (do jagah = confusing). Nesting/parent samajhna pehli baar mushkil. |
| 6 | Preview | **2** | Topbar "Preview" clear. Magar new window/popup khulta hai — **popup block ho sakta** ("Preview blocked, allow pop-ups" toast). First-timer popup-block pe atak sakta. |
| 7 | **Publish** | **3** | **Dev mein topbar "Export HTML" dikhata hai (zip download), "Publish" nahi** (publish flag OFF). User jo site LIVE karna chahta hai usko zip milta hai = goal mismatch. *Test se pehle `VITE_FEATURE_PUBLISH=true` karo* warna yeh step jhooti severity dega. |

**Mera predicted total:** spine "kaam karti hai" magar har step pe chhoti-chhoti friction + IA clutter overlay = "overall hard."

---

## Heuristic findings (NN/g) — ranked

| # | Finding | Heuristic | Sev | Note |
|---|---------|-----------|-----|------|
| H1 | **11-icon / 3-zone rail; clean 4-tool gated off** | Recognition over recall; Aesthetic-minimalist | **3 (top)** | Headline. Fix already in code behind `?rail=4`. |
| H2 | **Do navigation layers** — left icon rail + panel ke andar horizontal tabs (Insert/Templates/Media/Components) | Consistency; Minimalist | **3** | Ek hi cheez (content add) do jagah se = mental load. |
| H3 | **Publish vs Export confusion** (goal step) | Match system & real world | **3** | "Publish my site live" ≠ "Export HTML zip". Naming/goal clarity. |
| H4 | **Add element: click vs drag ambiguous**, 53 blocks for simple needs | Flexibility; Minimalist | **2** | Default "click to add" highlight + progressive disclosure. |
| H5 | **Layers + Structure dono** (do jagah structure) | Consistency | **2** | Ek structure home. |
| H6 | **Feedback** — abhi P1 mein theek kiya (silent actions). | Visibility of status | **1 (improving)** | Pehle bara tha; ab paste/duplicate/component report karte hain. |
| H7 | **AI slop** (generated output quality) | — | **?** | Code se judge nahi kar sakta; user test pakdega. Yahan main blind hoon. |

---

## Meri ranked rai — agar MAIN decide karta, pehle yeh:

1. **IA: 4-tool rail ON karo** (`?rail=4` ko complete-check + default). Sabse bara "overwhelming" lever, already built. **#1.**
2. **Do-nav-layer collapse** — icon rail + panel-tabs ka overlap khatam. Ek clear nav.
3. **Publish goal clarity** — "Publish / Go Live" ka ek saaf rasta (dev mein flag on + naming).
4. **Add-element simplify** — "click to add" default + top 6 blocks pehle, baqi "more".
5. **AI output** — yeh user-evidence ke baad (main judge nahi kar sakta).

**Magar — yeh meri prediction hai. Asli order USER test set karega.** Jo 3+ users ko sev 3-4 mile = woh #1, chahe meri list kuch bhi kahe.

---

## 🎯 Comparison gold — kahan main USERS se DIFFER karunga (yeh dhyan se dekhna)

Yeh sab se kaam ki cheez hai. Jahan mera rating aur users ka rating ALAG ho, wahan seekhne ko sabse zyada hai:

| Cheez | Mera rating | Users ka likely rating | Kyun gap |
|-------|-------------|------------------------|----------|
| "Insert panel dhoondhna" (`+` icon) | **1 (aasaan)** | **2-3 (mushkil)** | Main jaanta hoon `+` = add. First-timer ko `+` "add element" nahi lagta. **Main under-rate karunga.** |
| 11-icon rail clutter | **3** | **3-4?** | Yahan hum agree karenge — magar users ka visceral "too much" mujhse zyada strong. |
| Visual "cheap/AI-jaisa lagta hai" (UI slop) | **1-2** | **3?** | Main function dekhta hoon, gut-feel nahi. Users "acha nahi lagta" feel karte hain jo main miss karunga. |
| AI generated output slop | **? (blind)** | **3-4?** | Main judge nahi kar sakta. **Yahan poori tarah users pe depend.** |
| Inline text edit (double-click) | **1** | **2-3?** | Mujhe pata hai double-click; user ko nahi pata, atak sakta. |

**Rule:** jahan main "aasaan" aur users "mushkil" bolein — **users sahi hain.** Woh gap = mera blind spot = redesign ki asli jagah.

---

## Kaise use karo

1. Users ki 7-step sheets bharo (real sessions).
2. Yeh doc ke "Task walk" table ke saath rakho — har step pe **mera vs users** severity.
3. Jahan dono high (3-4) = **pakka, foran fix.**
4. Jahan main low + users high = **mera blind spot, sabse zyada seekhne wala — yeh bhi fix.**
5. Jahan main high + users low = shayad main over-thinking; deprioritize.

Yeh "do raaye" merge karke = sabse honest redesign brief.

---

*Banaya 2026-06-21 by Claude (expert/heuristic eval). Pair: `usability-test-kit-20260621.md` (real users). Code-grounded: `tabsConfig.ts`, `LeftSidebar.tsx`. NO UI built.*
