-- ============================================================================
-- LOCAL WORKFORCE MARKETPLACE - AUTH PROFILES, RLS & STORAGE
-- ============================================================================
-- This is SEPARATE from schema.sql (the construction dashboard registry).
-- It adds the consumer marketplace identity layer on top of Supabase Auth.
--
-- Instructions:
-- 1. Open your Supabase Dashboard -> SQL Editor -> New query.
-- 2. Paste the entire contents of this file and click "Run".
-- 3. Auth -> Providers: make sure "Email" is enabled. For instant login
--    during testing, turn OFF "Confirm email"; turn it ON for production.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE  (one row per auth user, holds their marketplace identity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('worker', 'customer')),
    full_name   TEXT,
    phone       TEXT,
    location    TEXT,
    trade       TEXT,                               -- workers only
    skills      JSONB NOT NULL DEFAULT '[]'::jsonb, -- workers only
    bio         TEXT,
    daily_rate  NUMERIC(10, 2),
    photo_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. keep updated_at fresh on every update
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. auto-create a profile row when a user signs up
--    role / full_name / phone arrive via signUp(options.data) as raw_user_meta_data
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    - anyone may read WORKER profiles (public marketplace listings)
--    - a user may always read / insert / update their OWN row
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "profiles read workers"  ON public.profiles;
    DROP POLICY IF EXISTS "profiles read own"      ON public.profiles;
    DROP POLICY IF EXISTS "profiles insert own"    ON public.profiles;
    DROP POLICY IF EXISTS "profiles update own"    ON public.profiles;
END $$;

CREATE POLICY "profiles read workers" ON public.profiles
    FOR SELECT USING (role = 'worker');

CREATE POLICY "profiles read own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles insert own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 5. STORAGE: worker profile photos
--    public read; a user may only write inside a folder named after their uid
--    e.g. worker-photos/<uid>/avatar.jpg
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-photos', 'worker-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "worker photos public read"  ON storage.objects;
    DROP POLICY IF EXISTS "worker photos owner insert" ON storage.objects;
    DROP POLICY IF EXISTS "worker photos owner update" ON storage.objects;
END $$;

CREATE POLICY "worker photos public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'worker-photos');

CREATE POLICY "worker photos owner insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'worker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "worker photos owner update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'worker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
