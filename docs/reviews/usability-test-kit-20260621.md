# Buildrik Editor — Usability Test Kit

**Maqsad:** redesign se PEHLE, exact pain points nikalna. Kaun si screen, kaun sa step, kya galat hua — frequency + severity ke saath ranked. Yeh ranked list hi **redesign ka brief** banegi.

**Asool (sabse zaroori):** yeh test "kya users ko product pasand hai" janne ke liye NAHI. Yeh "users KAHAN atakte hain" janne ke liye. Tum sirf dekhte ho — madad nahi karte. Jitna user atkega, utna behtar data.

> "Users pain report karte hain, fix design nahi karte." Hum yahan pain ki **exact jagah** dhoond rahe hain — fix baad mein.

---

## 0. Ek dafa setup (test se pehle)

- **Users:** wahi 3-5 log jinhone "hard hai" feedback diya. (Ya jitne mil jayein, kam-az-kam 3.)
- **Recording:** har session screen + audio record karo (Zoom/Loom/QuickTime — jo bhi). Baad mein dobara dekhne ke liye. User se permission lo: *"Main screen record kar raha hoon taakey baad mein dekh sakoon — theek hai?"*
- **Jagah:** in-person ya remote (screen-share) — dono chalta hai. Remote ho to user APNA screen share kare, tumhara nahi.
- **Time:** har session ~15-20 min. Ek din mein 2-3 se zyada mat karo (dimaag thak jaata hai, notes kharab hote hain).

### Har session se pehle (fresh start, sab equal):
1. Dashboard → **New Site** → **Start from Scratch** → ek blank site banao (har user ke liye nayi). Name: `Test - <user ka naam>`.
2. **Edit** dabao → editor khulna chahiye `/edit/<id>` pe (ab yeh fix ho chuka — agar 5050 pe jaye to `NEXT_PUBLIC_UNIFIED_EDITOR=true` check karo).
3. Editor khula, blank canvas, ready. **User ko abhi kuch mat dikhao/samjhao.**

---

## 1. Task script (user ko VERBATIM padho — kuch add mat karo)

> "Maan lo tum apne business ke liye ek chhoti website bana rahe ho. Main chahta hoon tum **ek page banao jis mein ho:**
> **(1) ek heading, (2) thoda sa text, aur (3) ek button** — phir us page ko **publish** kar do (live kar do).
>
> Main tumhari koi madad nahi karunga — bas dekhna chahta hoon tum khud kaise karte ho. Aur **jo bhi dimaag mein aa raha hai, zor se bolte raho** — 'yeh dhoond raha hoon', 'samajh nahi aaya', 'yeh kya hai' — sab bolo. Koi galat jawab nahi. Tum shuru karo jab ready ho."

Bas. Iske baad **chup**.

---

## 2. Facilitator rules (yeh card saamne rakho)

### ❌ Yeh NAHI karna:
- Madad mat karo. User atke to mat batao kahan click kare.
- "Yeh button yahan hai" / "wahan dekho" — NAHI.
- User ka stress kam karne ke liye answer mat do. Awkward silence theek hai.
- Apne product ki safai mat do ("haan yeh thoda confusing hai kyunki...").

### ✅ Sirf yeh 3 sawaal allowed (jab user ruke/atke):
1. *"Abhi kya soch rahe ho?"*
2. *"Tum kya expect kar rahe the ke hoga?"*
3. *"Yeh kyun click kiya / yeh kyun dhoond rahe ho?"*

### Agar user poore atak jaye (1-2 min, give up kar raha):
- Pehle poocho: *"Agar main na hota, to tum ab kya karte?"*
- Phir hi (data mil gaya) aage badhne ke liye chhota hint do, aur **note karo ke yeh step fail hua (severity 4).**

---

## 3. Observation sheet (har user ke liye ek copy)

User: `__________`  Date: `________`  Recording: `________`

Spine ke 7 sub-steps. Har step pe likho: kitna atka, kahan confuse, uske **exact alfaaz**, aur **severity (1-4)**.

| # | Step | Atka/Time | Kahan confuse hua | User ke exact alfaaz | Sev (1-4) |
|---|------|-----------|-------------------|----------------------|-----------|
| 1 | Heading add karna | | | | |
| 2 | Heading ka text edit karna | | | | |
| 3 | Text block add karna | | | | |
| 4 | Button add karna | | | | |
| 5 | Page/structure samajhna (kya bana, kahan hai) | | | | |
| 6 | Preview dekhna | | | | |
| 7 | **Publish karna** | | | | |

**Severity scale:**
- **1** — chhoti jhijhak, khud sambhal gaya (e.g. 2 sec ruka phir mil gaya).
- **2** — clearly confuse hua, ghalat jagah dhoonda, magar end mein kar liya.
- **3** — bara struggle, ghalat raasta liya, frustrate hua, mushkil se kiya.
- **4** — **task hi nahi hua** — give up, ya tumhe hint dena pada.

**Niche (free notes):** AI slop / UI "acha nahi lagta" / "yeh kya hai" type comments — jo bhi user bole jo kisi specific step se na judta ho, yahan likho with uske alfaaz:
```
_______________________________________________
_______________________________________________
```

---

## 4. 5 sessions ke baad — analysis (yeh main karunga)

Saari sheets + recordings mujhe do. Main yeh banaunga:

### A) Pain-point cluster + rank
Har unique issue ko ek row: **kitne users ne hit kiya (reach) × max severity = priority score.**

| Issue | Screen/Step | Reach (kitne users) | Max Sev | Priority |
|-------|-------------|---------------------|---------|----------|
| (misal) "Button kahan se add karun samajh nahi aaya" | Insert panel | 4/5 | 3 | **HIGH** |

**Rule:** jo issue **3+ users** ko mila + **severity 3-4** = woh **pehle redesign hoga**. Yehi spine ke asli toot.

### B) Abstract complaints → concrete jagah
"IA wrong / UI bad / AI slop" — har ek ko ab ek **specific screen + step** se jod denge. Misal:
- "IA wrong" → asal mein: "4/5 users ne button 'Insert' ke bajaye 'Components' mein dhoonda."
- "AI slop" → asal mein: "AI ne jo page banaya woh [specific] dikhta tha, 3 users ne 'fake/generic' bola."

### C) Redesign brief
Top 3-5 ranked pain points → ek brief. **Sirf yehi surfaces redesign hongi**, evidence ke saath. Boil-the-ocean nahi. Yeh `docs/reviews/` mein next artifact banegा.

---

## Kaun kya karega — summary

| Kaam | Kaun |
|------|------|
| Yeh kit (ban gayi) | Claude ✓ |
| Fresh blank test-site per session | Tum (New Site → Start from Scratch) |
| 3-5 sessions chalana + record + sheet bharna | **Tum** |
| Sheets/recordings se ranked pain-list + redesign brief | Claude |
| Redesign (sirf top pain surfaces, evidence se) | Phir shuru |

---

*Banaya 2026-06-21 — recovery roadmap Phase 4 (re-test) → Phase 5 (redesign by pain) ka pul. Connected: `buildrik-recovery-roadmap-20260621.md`, `user-feedback-fixplan-20260621.md`.*
