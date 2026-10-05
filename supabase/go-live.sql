-- ============================================================================
-- GO-LIVE MIGRATION — serverless cutover for the BuildVantage dashboard
-- ============================================================================
-- Run AFTER schema.sql and auth-profiles.sql, in the Supabase SQL Editor.
-- Idempotent: safe to re-run.
--
-- What it does:
--   1. Moves sequential-ID generation (LAB-/SITE-/ADM-/LOG-) into DB triggers,
--      since the browser now inserts directly (no Node routes to assign ids).
--   2. Keeps workers.updated_at fresh.
--   3. Adds is_admin() and replaces the wide-open RLS with admin-only policies
--      on every dashboard table. (The marketplace uses `profiles`, which is
--      untouched here, so locking these tables does not affect the public site.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUTO-ID GENERATION (BEFORE INSERT) — only fills id when the client omits it
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS worker_id_seq    START 817;  -- after seed LAB-816
CREATE SEQUENCE IF NOT EXISTS site_id_seq      START 5;    -- after seed SITE-04
CREATE SEQUENCE IF NOT EXISTS admin_id_seq     START 6;    -- after seed ADM-005
CREATE SEQUENCE IF NOT EXISTS audit_log_id_seq START 1093; -- after seed LOG-1092

CREATE OR REPLACE FUNCTION public.generate_worker_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'LAB-' || nextval('worker_id_seq')::text;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_site_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'SITE-' || LPAD(nextval('site_id_seq')::text, 2, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_admin_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'ADM-' || LPAD(nextval('admin_id_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_audit_log_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'LOG-' || nextval('audit_log_id_seq')::text;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS auto_worker_id    ON public.workers;
CREATE TRIGGER auto_worker_id    BEFORE INSERT ON public.workers     FOR EACH ROW EXECUTE FUNCTION public.generate_worker_id();
DROP TRIGGER IF EXISTS auto_site_id      ON public.sites;
CREATE TRIGGER auto_site_id      BEFORE INSERT ON public.sites       FOR EACH ROW EXECUTE FUNCTION public.generate_site_id();
DROP TRIGGER IF EXISTS auto_admin_id     ON public.admin_users;
CREATE TRIGGER auto_admin_id     BEFORE INSERT ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.generate_admin_id();
DROP TRIGGER IF EXISTS auto_audit_log_id ON public.audit_logs;
CREATE TRIGGER auto_audit_log_id BEFORE INSERT ON public.audit_logs  FOR EACH ROW EXECUTE FUNCTION public.generate_audit_log_id();

-- ----------------------------------------------------------------------------
-- 2. workers.updated_at auto-refresh (set_updated_at() comes from auth-profiles.sql)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS workers_set_updated_at ON public.workers;
CREATE TRIGGER workers_set_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. is_admin(): true when the caller's auth email is an Active admin_users row.
--    SECURITY DEFINER so it bypasses RLS on admin_users (no policy recursion).
--    Email compared case-insensitively (Supabase lowercases auth emails).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users a
    JOIN auth.users u ON lower(u.email) = lower(a.email)
    WHERE u.id = auth.uid() AND a.status = 'Active'
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. RLS — drop the permissive policies from schema.sql, lock to admins.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- old open policies
  DROP POLICY IF EXISTS "Allow public read sites"       ON public.sites;
  DROP POLICY IF EXISTS "Allow public write sites"      ON public.sites;
  DROP POLICY IF EXISTS "Allow public read workers"     ON public.workers;
  DROP POLICY IF EXISTS "Allow public write workers"    ON public.workers;
  DROP POLICY IF EXISTS "Allow public read attendance"  ON public.attendance_records;
  DROP POLICY IF EXISTS "Allow public write attendance" ON public.attendance_records;
  DROP POLICY IF EXISTS "Allow public read admin_users" ON public.admin_users;
  DROP POLICY IF EXISTS "Allow public write admin_users" ON public.admin_users;
  DROP POLICY IF EXISTS "Allow public read audit_logs"  ON public.audit_logs;
  DROP POLICY IF EXISTS "Allow public write audit_logs" ON public.audit_logs;

  -- new admin-only policies (drop first so this block is re-runnable)
  DROP POLICY IF EXISTS "workers_admin_all"       ON public.workers;
  DROP POLICY IF EXISTS "sites_admin_all"         ON public.sites;
  DROP POLICY IF EXISTS "attendance_admin_all"    ON public.attendance_records;
  DROP POLICY IF EXISTS "admin_users_admin_all"   ON public.admin_users;
  DROP POLICY IF EXISTS "audit_logs_admin_read"   ON public.audit_logs;
  DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
END $$;

-- Full CRUD for admins on the operational tables.
CREATE POLICY "workers_admin_all" ON public.workers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "sites_admin_all" ON public.sites
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "attendance_admin_all" ON public.attendance_records
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_users_admin_all" ON public.admin_users
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Audit logs: admins read + append only (no update/delete — tamper-resistant trail).
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. FIRST-ADMIN BOOTSTRAP  (one-time, run manually after the steps below)
-- ============================================================================
-- RLS now blocks everyone from the dashboard until an admin exists. To create
-- the first one:
--
--   a) Create the person's auth account:
--        Supabase Dashboard -> Authentication -> Users -> Add user
--        (email + password), OR have them sign up once via the marketplace.
--
--   b) Promote that email to an active admin. This SQL Editor runs as the
--      service role (bypasses RLS), so it can seed the first row. Replace the
--      email (and name/role) with the real account, then run:
--
--      INSERT INTO public.admin_users (name, email, role, department, status, two_factor)
--      VALUES ('Your Name', 'you@example.com', 'Super Admin', 'Executive Operations', 'Active', false)
--      ON CONFLICT (email) DO UPDATE SET status = 'Active';
--
-- After that, sign in at /app (or /backend-admin) with that email/password.
-- The seeded demo admins (@buildvantage.internal) have no auth account, so they
-- appear in the roster but cannot sign in — expected.
-- ============================================================================
