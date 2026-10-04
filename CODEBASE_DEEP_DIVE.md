# BuildVantage Labour Supply Registry — Codebase Deep Dive

> For AI agents and new developers onboarding to this project. Read this before touching any code.

---

## What This Project Is

**BuildVantage** is a construction workforce management platform — a "Labour Supply Registry" that tracks workers, project sites, attendance, and compliance across a construction operation. It has two user-facing surfaces:

- **`/`** — Main workforce registry app (worker directory, KPI dashboard, site management, attendance, ID badge/compliance generator)
- **`/backend-admin`** — Admin portal (user management, role matrix, audit trail, Supabase diagnostics)

The system is designed for field use where internet connectivity may be intermittent, so it operates offline-first with cloud sync via Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS, `"type": "commonjs"`) |
| HTTP server | Raw `node:http` — no Express or any framework |
| Frontend | Vanilla HTML5 / CSS3 / ES6 — no bundler, no build step, no TypeScript |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` v2.117.2 |
| Local fallback | JSON flat files in `data/` |
| Config | `dotenv` v18 |
| Dev server | `node --watch server.js` (Node 18+ built-in file watcher) |

**No frameworks. No transpilers. No test runner. No linter.** The frontend is loaded directly by the browser as-is.

---

## Project Structure

```
knowthyplant/
├── server.js               # Entry point — wires DI, registers routes, starts HTTP server
├── supabase-client.js      # Supabase client singleton + health check
├── index.html              # Main app (50 KB single-file frontend)
├── script.js               # Main app logic (~2400 lines, IIFE)
├── admin.html              # Admin portal HTML (29 KB)
├── admin.js                # Admin portal logic (~850 lines, IIFE)
├── style.css               # All CSS — themes, components, layout (39 KB)
├── package.json
├── .env                    # Supabase credentials + PORT (git-ignored)
├── .env.example            # Credential template
│
├── data/                   # Local JSON fallback storage
│   ├── workers.json        # 18 seeded worker records (camelCase fields)
│   ├── sites.json          # 4 seeded project sites
│   ├── attendance.json     # Attendance records keyed by date
│   ├── admin_users.json    # Admin accounts
│   └── audit_logs.json     # Audit trail
│
├── src/                    # Backend server modules
│   ├── httpUtils.js        # CORS headers, sendJson(), parseRequestBody(), getClientIp()
│   ├── router.js           # Hand-rolled regex router (handles :param patterns)
│   ├── staticServer.js     # Static file server with path traversal protection
│   ├── storage/
│   │   ├── JsonFileStorage.js    # Flat-file JSON adapter
│   │   └── SupabaseStorage.js    # Supabase PostgreSQL adapter
│   ├── repositories/
│   │   ├── BaseRepository.js         # Abstract CRUD base — dual-storage logic lives here
│   │   ├── WorkerRepository.js       # Worker entity + field mapping
│   │   ├── SiteRepository.js         # Site entity + field mapping
│   │   ├── AttendanceRepository.js   # Attendance (keyed by date)
│   │   ├── AdminUserRepository.js    # Admin user entity
│   │   └── AuditLogRepository.js     # Audit log + .log() convenience method
│   └── routes/
│       ├── workerRoutes.js       # GET/POST/PUT/PATCH/DELETE /api/workers[/:id]
│       ├── siteRoutes.js         # GET/POST/PUT/PATCH/DELETE /api/sites[/:id]
│       ├── attendanceRoutes.js   # GET/POST /api/attendance
│       ├── adminRoutes.js        # CRUD /api/admin/users[/:id], /api/admin/audit-logs, /api/admin/stats
│       ├── authRoutes.js         # POST /api/auth/login
│       └── statusRoutes.js       # GET /api/supabase/status, /api/status
│
└── supabase/
    └── schema.sql          # Full PostgreSQL schema, RLS policies, seed data, realtime config
```

---

## Architecture

### Dual-Storage (Offline-First)

The most important pattern in the codebase. Every entity has two storage backends:

```
Request → Repository → tries SupabaseStorage first
                     → falls back to JsonFileStorage if Supabase unreachable
```

**Key rule in `BaseRepository`**:
- `getAll()` — reads from Supabase if available, else JSON files
- `create()` / `update()` — writes to **JSON files first**, then attempts Supabase
- Supabase availability is cached for 10 seconds via a timestamp guard in `isSupabaseAvailable()`

This means the JSON files in `data/` are not just seeds — they are the live local cache and must stay in sync.

### Repository Pattern

```
src/storage/JsonFileStorage.js   ─┐
src/storage/SupabaseStorage.js   ─┤→ BaseRepository (abstract CRUD)
                                   └→ WorkerRepository (entity-specific mapping)
                                   └→ SiteRepository
                                   └→ AttendanceRepository
                                   └→ AdminUserRepository
                                   └→ AuditLogRepository
```

Each entity repository implements:
- `toClientFormat(row)` — DB/file row → JS camelCase object
- `toDbFormat(obj)` — JS object → DB snake_case row

The mapping handles both naming variants for compat with both backends:
```js
yearsExp: row.years_exp ?? row.yearsExp
```

### Dependency Injection (Manual)

`server.js` wires everything explicitly at startup:
```
supabaseClient
  → SupabaseStorage instances (one per table)
  → JsonFileStorage instances (one per file)
  → Repository instances (injected with both storages)
  → Route handler registrations (injected with repositories)
```

There is no IoC container. All wiring is in `server.js`.

### Custom Router

`src/router.js` converts `/api/workers/:id` patterns into named-capture-group regexes. Route handlers receive `(req, res, params)` where `params` holds extracted path segments. There is no middleware stack.

### Frontend Architecture

Both `script.js` and `admin.js` are large IIFEs (Immediately Invoked Function Expressions) with a single module-level `state` object — essentially a manual Flux/Redux store pattern without a library.

**`script.js` state flow:**
1. On page load: read workers/sites/attendance from `localStorage`
2. Render immediately from cache (fast initial paint)
3. Background fetch from `/api/workers`, `/api/sites`, `/api/attendance`
4. On success: update `state` + `localStorage` cache + re-render

DOM updates are all imperative `innerHTML` string templates — no virtual DOM, no reactivity.

---

## REST API Reference

All responses use the envelope: `{ success: true/false, data: ..., message: "..." }`

| Method | Path | Description |
|---|---|---|
| GET | `/api/workers` | List all workers |
| POST | `/api/workers` | Create worker |
| GET | `/api/workers/:id` | Get single worker |
| PUT | `/api/workers/:id` | Replace worker |
| PATCH | `/api/workers/:id` | Update worker fields |
| DELETE | `/api/workers/:id` | Delete worker |
| GET | `/api/sites` | List all sites |
| POST | `/api/sites` | Create site |
| PUT | `/api/sites/:id` | Replace site |
| PATCH | `/api/sites/:id` | Update site fields |
| DELETE | `/api/sites/:id` | Delete site |
| GET | `/api/attendance` | Get attendance (query: `?date=YYYY-MM-DD`) |
| POST | `/api/attendance` | Record attendance |
| POST | `/api/auth/login` | Admin login (email only) |
| GET | `/api/admin/users` | List admin users |
| POST | `/api/admin/users` | Create admin user |
| PUT | `/api/admin/users/:id` | Update admin user |
| DELETE | `/api/admin/users/:id` | Delete admin user |
| GET | `/api/admin/audit-logs` | Get audit trail |
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/supabase/status` | Supabase connection health |
| GET | `/api/status` | Server uptime/status |

---

## Database Schema

### `public.workers`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Format: `LAB-{number}` e.g. `LAB-801` |
| `name`, `phone`, `trade` | TEXT | |
| `skills` | JSONB | Array of skill strings |
| `experience` | TEXT | e.g. `"5 years"` |
| `years_exp` | INTEGER | |
| `daily_rate` | NUMERIC(10,2) | |
| `age`, `blood_group` | INT/TEXT | |
| `location`, `emergency_contact` | TEXT | |
| `kyc_verified`, `osha_certified`, `medical_cleared` | BOOLEAN | Compliance flags |
| `rating` | NUMERIC(3,2) | |
| `status` | TEXT | `'Active'` \| `'Inactive'` |
| `assigned_site_id` | TEXT FK→sites.id | |
| `shift_timing`, `avatar` | TEXT | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

### `public.sites`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Format: `SITE-{padded}` |
| `name`, `client`, `location` | TEXT | |
| `quota` | INTEGER | Target worker count |
| `supervisor`, `shift_timing` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### `public.attendance_records`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `shift_date` | DATE | |
| `worker_id` | TEXT FK→workers.id CASCADE | |
| `site_id` | TEXT FK→sites.id | |
| `status` | TEXT | `'P'` Present, `'OT'` Overtime, `'H'` Holiday, `'A'` Absent |
| `ot_hours` | NUMERIC(4,1) | |
| `notes` | TEXT | |
| `punched_at` | TIMESTAMPTZ | |
| **Unique** | `(shift_date, worker_id)` | One record per worker per day |

### `public.admin_users`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Format: `ADM-{padded}` |
| `name`, `email` (UNIQUE), `role`, `department` | TEXT | |
| `status` | TEXT | `'Active'` \| `'Suspended'` |
| `permissions` | JSONB | Permission map |
| `last_login` | TEXT | |
| `two_factor` | BOOLEAN | |
| `avatar` | TEXT | |

### `public.audit_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Format: `LOG-{last4 of timestamp}` |
| `timestamp` | TEXT | ISO string |
| `user_name`, `role`, `action`, `details`, `ip` | TEXT | |

**RLS**: Enabled on all tables but policies use `USING (true)` — effectively public access under the anon key.

**Realtime**: `workers`, `sites`, `attendance_records` are published.

---

## Authentication

**Warning: The auth system is not secure.** It is email-only (no password check). The generated session token is never validated on subsequent requests. There is no server-side route protection.

**Login flow** (`POST /api/auth/login`):
1. Receive `{ email }` in body
2. Look up email in admin_users
3. If suspended → 403; if not found → 401
4. Update `lastLogin`, write audit log entry
5. Return user object + cosmetic token: `session_${base64(email + ':' + Date.now())}`

Token is stored in `sessionStorage` on the admin page. Client-side checks exist but any request to `/api/admin/*` succeeds without a valid token.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon JWT key |
| `PORT` | No | Server port (default: `3000`) |

Copy `.env.example` to `.env` and fill in the values. The `.env` file is git-ignored.

---

## Running the Project

```bash
# Install dependencies
npm install

# Development (hot-reload on file change, Node 18+)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3000` (or `PORT` from `.env`).

**First-time Supabase setup**: Run `supabase/schema.sql` in your Supabase project's SQL Editor to create tables, RLS policies, seed data, and realtime config.

---

## ID Conventions

| Entity | Format | Example |
|---|---|---|
| Worker | `LAB-{number}` | `LAB-801` |
| Site | `SITE-{padded number}` | `SITE-001` |
| Admin user | `ADM-{padded number}` | `ADM-001` |
| Audit log | `LOG-{last 4 digits of epoch ms}` | `LOG-7823` |
| Attendance | UUID (Supabase auto) | `gen_random_uuid()` |

---

## Conventions and Patterns to Follow

1. **API responses always use the envelope**: `{ success: true, data: ..., message: "..." }` via `sendJson()` from `src/httpUtils.js`.

2. **All mutating operations should audit-log**: Call `auditLogRepo.log(action, details, userName, role, ip)` after every create/update/delete.

3. **camelCase in JS, snake_case in DB**: Handle the translation in `toClientFormat()` / `toDbFormat()` in the entity's repository. Do not let snake_case leak into frontend state.

4. **Never break the dual-storage contract**: Any new entity needs both a `JsonFileStorage` (pointing to a new file in `data/`) and a `SupabaseStorage` (pointing to the Supabase table), both injected into a new `Repository` subclass.

5. **Inject, don't import directly**: Route handlers receive repositories as arguments. Repositories receive storage adapters as constructor arguments. Avoid `require`-ing storage adapters or Supabase directly in route files.

6. **Route registration functions**: Each route file exports a `registerXxxRoutes(router, repo, ...)` function. Register it in `server.js`.

7. **CORS is wide open**: `Access-Control-Allow-Origin: *` is applied to all API responses. Don't tighten this without testing the frontend's fetch calls.

8. **localStorage is the frontend cache key**: The main app's `script.js` uses `localStorage` to persist state across page loads. Any change to the state shape needs a migration guard or a cache-clear.

---

## Known Limitations / Technical Debt

| Area | Issue |
|---|---|
| Auth | Email-only login; tokens are not validated on the server |
| Auth | No server-side route protection on `/api/admin/*` |
| Tests | Zero test coverage |
| Error handling | `create()` / `update()` write to JSON locally even if Supabase write fails — no eventual-consistency retry |
| Frontend | Both `script.js` and `admin.js` are monolith IIFEs — hard to modularize without a bundler |
| RLS | Supabase RLS is enabled but uses open `USING (true)` policies — the anon key has full table access |
| Concurrency | JSON file writes are not atomic — concurrent requests could corrupt `data/*.json` |
| Secrets | `.env` holds live Supabase credentials; ensure it is never committed |

---

## Quick-Start Checklist for New Developers

- [ ] `cp .env.example .env` and fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] `npm install`
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor (first time only)
- [ ] `npm run dev` — server at `http://localhost:3000`
- [ ] Main app: `http://localhost:3000/`
- [ ] Admin portal: `http://localhost:3000/backend-admin`
- [ ] Supabase health: `http://localhost:3000/api/supabase/status`
- [ ] Understand `BaseRepository.js` before adding a new entity
- [ ] Read `server.js` top-to-bottom to understand the DI wiring

---

## Quick-Start for AI Agents

- **Entry point**: `server.js` — read this first to understand the full dependency graph
- **To add a feature to the main app**: edit `script.js` (state + render) and `index.html` (markup)
- **To add an API endpoint**: create/edit a file in `src/routes/`, export a `registerXxxRoutes` function, register it in `server.js`
- **To add a new entity**: create storage files in `data/`, add `SupabaseStorage` + `JsonFileStorage` instances in `server.js`, subclass `BaseRepository`, implement `toClientFormat`/`toDbFormat`, add routes
- **Auth is not enforced server-side** — don't assume any request is authenticated
- **The `data/*.json` files are live state** — modifying them changes what the app serves when Supabase is offline
- **No build step** — edits to `.html`/`.css`/`.js` files in the root take effect immediately on the next browser reload
