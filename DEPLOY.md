# Deploying the Talent3X frontend (frozen build)

This is the **frozen frontend**: it runs entirely in the browser (localStorage) and needs
**no backend and no secrets**. That means it deploys to any static/edge host — Vercel below —
with **zero environment variables**. Nothing sensitive is committed or configured; the company's
"API keys in `.env`" concern does not apply, because there are none.

## Deploy to Vercel (no env vars)

Prereqs: a (free) Vercel account and Node installed.

```bash
# from the repo root, on the branch you want to ship (e.g. feature/fe-no-supabase)
npx vercel            # first run: log in + link the project (accept the Next.js defaults)
npx vercel --prod     # promote to a public production URL
```

That's it — do **not** add any environment variables. Vercel auto-detects Next.js and builds it.

### Confirm the live deploy
Open the production URL and check:
- `/demo` → **Load demo profile** → lands on `/s/profile` with capabilities.
- `/demo` → **Org analytics (viewer)** → `/org/overview`, `/org/analytics` (toggle a package;
  see `<5` k-anon masking), `/org/reports` (Export PDF prints).
- `/demo` → **Org admin** → scores are hidden (admin ≠ analyst).

The whole loop (create Action → request evaluation → open the `/evaluate/<token>` link **in the
same browser** → score → profile) works single-device — expected for the frozen build.

## Reconnecting a real backend later (optional)

The real client is behind an explicit opt-in, so a leftover URL can never silently re-enable it.
When the backend is live, in **Vercel → Project → Settings → Environment Variables** (encrypted,
never in the repo) set:

```
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only routes
```

Then redeploy. See `docs/Backend-Seams-Handoff.md` for exactly what the backend must expose —
the localStorage stubs at the `TODO(cyprian)` seams become API calls with no UI change.

> Note: this frozen deploy is **our side's finish line, not the shippable product** — the real
> capability engine + APIs (Cyprian), rubric calibration (Steve) and the open product rulings
> (André) are owned by others and still outstanding. This proves the frontend + model works.
