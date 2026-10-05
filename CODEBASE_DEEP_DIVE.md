# Codebase Deep Dive — LocalHands Marketplace + BuildVantage Registry

> For AI agents and new developers onboarding to this project. Read this before touching any code.

---

## What This Project Is

This repository hosts **two products**, shipped as one **static site** (built by Vite) that talks
**directly to Supabase** (database + auth + storage, guarded by Row-Level Security). There is **no
backend server** — no Node process, no `/api/*`.

1. **LocalHands** — a public, consumer-facing **local workforce marketplace** connecting customers
   with workers (plumbers, electricians, carpenters, cleaners, drivers, daily-wage workers, …). Real
   Supabase Auth. This is the **home page** (`/`).
2. **BuildVantage** — the internal **construction workforce-management dashboard** ("Labour Supply
   Registry"): worker directory, KPIs, site management, attendance/wages, ID-badge generator, plus an
   admin portal. Served under **`/app`** (+ **`/backend-admin`**) and gated by an **admin login**.

| Surface | URL | Entry file |
|---|---|---|
| Marketplace landing | `/` | `public/landing.html` |
| Browse workers | `/find-workers` | `public/workers.html` |
| Worker onboarding | `/onboarding` | `public/onboarding.html` |
| Workforce dashboard | `/app` | `app/index.html` |
| Admin portal | `/backend-admin` | `app/admin.html` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build | **Vite** (multi-page) → `dist/` |
| Hosting | **Netlify** (static CDN + clean-URL rewrites) |
| Database / Auth / Storage | **Supabase** (PostgreSQL + Auth + Storage), accessed from the browser |
| Security | **Supabase RLS** (`is_admin()` for the dashboard; owner/public policies for the marketplace) |
| Client SDK | `@supabase/supabase-js` — **bundled** by Vite (not a CDN script) |
| Marketplace frontend | Vanilla HTML/CSS + native ES modules (`public/js/*`) |
| Dashboard frontend | Vanilla HTML/CSS + IIFE entry scripts (`app/script.js`, `app/admin.js`) that import ES-module helpers (`app/js/*`) |
| Config | Vite env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |

**No framework, no Node server, no custom router.** Dev and prod are identical (static files + Supabase).

---

## Project Structure

```
knowthyplant/
├── index: none — pages live under public/ and app/ (routed by rewrites)
├── style.css                 # Shared design tokens + dashboard components (warm theme)
├── vite.config.mjs           # Vite config: publicDir:false, 5 HTML inputs, dev clean-URL rewrites
├── netlify.toml              # Build command + publish dir + clean-URL rewrites (prod)
├── package.json              # type:module; scripts: dev / build / preview
├── .env                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (git-ignored)
│
├── shared/
│   └── supabaseClient.js     # THE browser client (createClient from bundled SDK + Vite env)
│
├── public/                   # ── LocalHands marketplace (public) ──
│   ├── landing.html / workers.html / onboarding.html
│   ├── landing.css
│   └── js/                   # native ES modules (one responsibility each)
│       ├── data.js  ui.js  components.js  authModal.js
│       ├── supabaseClient.js # thin re-export of shared/supabaseClient.js
│       ├── auth.js           # auth facade: signUp/signIn/getSession/getProfile/requireAuth
│       ├── landing.js  workers.js  onboarding.js
│
├── app/                      # ── BuildVantage dashboard + admin (internal) ──
│   ├── index.html  script.js # dashboard (IIFE) — imports app/js/*
│   ├── admin.html  admin.js  # admin portal (IIFE) — imports app/js/*
│   └── js/                   # dashboard data layer (ES modules)
│       ├── mappers.js        # camelCase <-> snake_case + attendance object<->rows
│       ├── dataClient.js     # façade: workers/sites/attendance/adminUsers/auditLogs + health()
│       └── adminGate.js      # requireAdmin() + inline login overlay + signOutAdmin()
│
└── supabase/                 # SQL migrations (run in the Supabase SQL Editor, in order)
    ├── schema.sql            # dashboard tables + seed (+ realtime)
    ├── auth-profiles.sql     # marketplace profiles, signup trigger, RLS, worker-photos bucket
    └── go-live.sql           # id-generation triggers, is_admin(), admin-only RLS, bootstrap notes
```

---

## Routing

There is no server router. **Clean URLs are rewrites**:
- **Dev:** `vite.config.mjs` has a `clean-urls` plugin mapping `/` → `/public/landing.html`,
  `/find-workers` → `/public/workers.html`, `/app` → `/app/index.html`, etc.
- **Prod:** `netlify.toml` has the equivalent `status = 200` redirects against the built `dist/`.

Because pages are served via rewrite (the browser URL stays clean), their HTML references assets with
**absolute paths** (`/style.css`, `/app/script.js`, …); Vite rewrites these to hashed `/assets/*`
files at build time. ES-module cross-imports stay **relative** (`./data.js`, `../../shared/...`).

To add a page: drop the file under `public/` or `app/`, add it to `rollupOptions.input` in
`vite.config.mjs`, add a rewrite in both `vite.config.mjs` and `netlify.toml`, reference assets by
absolute path, and load an ES-module entry script.

---

## Marketplace Architecture (public/)

- **Client-side Supabase Auth**, entirely in the browser (anon key is public; RLS guards data).
- **`shared/supabaseClient.js`** creates the memoised client from `import.meta.env.VITE_*`.
  `public/js/supabaseClient.js` re-exports it, so every marketplace module keeps importing
  `getSupabase` unchanged.
- **Auth facade (`auth.js`)** — everything depends on this, not raw `supabase.auth.*`.
- **Role selection (`authModal.js`)** — customer vs worker; after auth, workers → `/onboarding`,
  customers → `/find-workers`.
- **Data-driven UI** — services/steps/principles/icons live in `data.js`.
- **Profiles + photos** — `onboarding.js` upserts the worker's `profiles` row and uploads to the
  `worker-photos` Storage bucket; `workers.js` lists `profiles` where `role='worker'`.

---

## Dashboard Architecture (app/)

- **Admin gate (`app/js/adminGate.js`).** `init()` awaits `requireAdmin()`, which boots the dashboard
  only once the visitor is signed in **and** present in `admin_users` with `status='Active'`. Otherwise
  it shows a minimal inline login overlay (`supabase.auth.signInWithPassword`). Sign-out lives in the
  DB-status modal.
- **Data layer (`app/js/dataClient.js` + `mappers.js`).** The single place that talks to Supabase.
  The IIFE UI depends on this abstraction (not on supabase-js or fetch). It mirrors the old REST
  methods: `workers/sites/attendance/adminUsers/auditLogs` with `getAll/create/update/delete` (+
  `attendance.getByDate/save`, `auditLogs.log`, and `health()`). Field mapping is ported from the
  former server repositories, so the proven conversion logic is reused.
- **Client-side audit logging.** Create/update/delete in `dataClient` write a rich `audit_logs` row,
  stamped with the real signed-in admin (`setActor`, set by the gate).
- **IDs come from the DB.** `go-live.sql` triggers assign `LAB-/SITE-/ADM-/LOG-` ids; create flows use
  `.insert().select().single()` to read the assigned id back.
- **Offline-first cache.** `localStorage` + a hard-coded seed remain as a read cache/fallback; Supabase
  is the source of truth when reachable.

---

## Database

Run the three migrations in order in the Supabase SQL Editor:

1. **`schema.sql`** — `workers`, `sites`, `attendance_records`, `admin_users`, `audit_logs` (+ seed,
   + realtime publication).
2. **`auth-profiles.sql`** — `profiles` (one row per auth user), signup trigger, RLS, `worker-photos`
   bucket. Separate from the dashboard tables.
3. **`go-live.sql`** — id-generation triggers, `workers.updated_at` trigger, `is_admin()`, and
   **admin-only RLS** replacing the old permissive policies. Ends with the **first-admin bootstrap**
   instructions.

> Marketplace tables (`profiles`) and dashboard tables (`workers`, …) are **disjoint**. The public site
> reads `profiles`; the dashboard reads the operational tables. Locking the dashboard tables to admins
> does not affect the marketplace.

---

## Authentication & Security

- **Marketplace:** real Supabase Auth; role (`worker`/`customer`) on the `profiles` row, enforced by RLS.
- **Dashboard:** real Supabase Auth **plus** admin authorization. `is_admin()` (SECURITY DEFINER) is
  true when the caller's auth email matches an Active `admin_users` row. Every dashboard table is
  `USING (is_admin()) WITH CHECK (is_admin())`; `audit_logs` is read + append only.
- **Bootstrap the first admin** (see `go-live.sql`): create the auth user, then
  `INSERT INTO admin_users (…, status) VALUES (…, 'Active')` from the SQL Editor (service role bypasses
  RLS). Seeded `@buildvantage.internal` admins have no auth account and cannot sign in.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (local) / Netlify env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (local) / Netlify env | Supabase anon key (public by design) |

Vite inlines `VITE_`-prefixed vars into the bundle at build time.

---

## Running the Project

```bash
npm install
npm run dev       # Vite dev server (clean URLs), default http://localhost:8080
npm run build     # -> dist/
npm run preview   # serve the built dist/ locally
```

**First-time Supabase setup** (SQL Editor): run `schema.sql`, then `auth-profiles.sql`, then
`go-live.sql`; enable Auth → Providers → Email; bootstrap the first admin (see `go-live.sql`).

**Deploy (Netlify):** connect the repo; build `npm run build`, publish `dist`; set `VITE_SUPABASE_URL`
and `VITE_SUPABASE_ANON_KEY` as environment variables; add the site URL to Supabase Auth Site/Redirect
URLs.

---

## Conventions to Follow

1. **Dashboard data access goes through `app/js/dataClient.js`** — never call `supabase.from(...)`
   directly from `script.js`/`admin.js`. Add field mapping in `mappers.js`.
2. **Pass full objects to `dataClient` create/update** so `toDb*` mappers don't clobber columns with
   defaults (updates merge onto the existing record first).
3. **Marketplace: one responsibility per ES module**; depend on the `auth.js` facade; content lives in
   `data.js`.
4. **One Supabase client** — import from `shared/supabaseClient.js` (dashboard) or
   `public/js/supabaseClient.js` (marketplace re-export). Never hardcode URL/key.
5. **Theme via tokens** (`--color-*` / `--accent-*`), no raw hex in components.
6. **Absolute asset paths in HTML**; relative specifiers for ES-module imports.

---

## Known Limitations / Technical Debt

| Area | Issue |
|---|---|
| Admin provisioning | First admin must be bootstrapped via SQL; no self-service admin signup |
| Marketplace | No ratings/reviews, messaging, payments, or saved jobs yet |
| No-JS | Pages are JS-rendered; require JavaScript |
| Tests | Zero automated test coverage |
| Realtime | Tables are published to realtime, but the dashboard does not subscribe yet |
