# cPanel deploy runbook — 205-commit ship (2026-07-03)

Server: vortyoyz cPanel user (2 Node apps: buildrick + ranklur — **pkill kabhi blind na chalana**, sirf apni app ke PID).

## Pehle push (local, main machine)
```bash
git push origin main   # 205 commits — safe, deploy manual hai
```

## cPanel pe, is order mein

### 1. Pull + deps
```bash
cd <buildrik app dir>
git pull origin main
npm ci
```

### 2. Prisma — PEHLE status, phir deploy (42P10 trap)
```bash
npx prisma migrate status    # drift dikhaye to yahin ruk kar dekho
npx prisma migrate deploy    # nayi tables: SiteVersion · SiteComponent · UserTemplate (+ jo pending hon)
```
Trap yaad rakhna: `42P10` error = migration-process drift, app bug nahi.

### 3. Env — BUILD SE PEHLE (baked-at-build trap)
`.env.production.local` mein (build isi ko bake karta hai — bina iske "Edit" purana dead demo kholta hai):
```
NEXT_PUBLIC_UNIFIED_EDITOR=true
```
Baqi zaroori env pehle se set hone chahiye: DATABASE_URL · NEXTAUTH_SECRET · RESEND_API_KEY (sign-off emails ab live jayengi!) · ENCRYPTION_KEY · VERCEL_OAUTH_* (publish ke liye).

### 4. Build
```bash
rm -rf packages/dashboard/.next   # stale-server trap
npm run build   # ya jo dashboard build script hai
```
Note: is stack mein `theme.applyPreset` fix shamil hai — purane code mein `apply` reserved-word BUILD tor deta tha; ab nahi torega.

### 5. Restart — orphan-node trap
```bash
# apni app ke workers dhoondo (ranklur ke NAHI):
for pid in $(pgrep -u $USER node); do ls -l /proc/$pid/cwd 2>/dev/null | grep -q buildrik && echo $pid; done
# unhi PIDs ko kill karo, phir:
cloudlinux-selector restart --json --interpreter nodejs --app-root <app-root>
```
Yaad: cloudlinux-selector workers ko khud kill NAHI karta — pehle manually maro warna crashloop.

### 6. Live smoke (5 min)
- [ ] Login chalti hai (tRPC 500 nahi — applyPreset fix ka sabot)
- [ ] Dashboard → site → **Edit** → unified editor khulta hai (demo nahi)
- [ ] Editor rail = **Insert · Pages · Styles · Site** (4-tool)
- [ ] Kuch edit karo → save pill "Saved" dikhta hai
- [ ] CMS record pe Publish/Unpublish button
- [ ] Send-for-review popover (note + what-changed)
- [ ] Feature flags: Saqib workspace pe agency_layer + client_mode ON hain (DB rows) — Clients/Reviews nav

### Rollback (agar kuch toote)
```bash
git reset --hard <purana-sha>   # push se pehle ka origin sha
rm -rf packages/dashboard/.next && npm run build && restart
```
Migrations additive hain (nayi tables) — rollback pe drop ki zaroorat nahi.
