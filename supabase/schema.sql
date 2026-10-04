-- ============================================================================
-- BUILDVANTAGE LABOUR SUPPLY REGISTRY - SUPABASE DATABASE SCHEMA & SEED
-- ============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/thtqzhpvjlxiwsjsmfoc
-- 2. Click on "SQL Editor" in the left navigation sidebar.
-- 3. Click "New query", paste the entire contents of this file, and click "Run".
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    location TEXT NOT NULL,
    quota INTEGER NOT NULL DEFAULT 10,
    supervisor TEXT,
    shift_timing TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. WORKERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    trade TEXT NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    experience TEXT DEFAULT 'Journeyman',
    years_exp INTEGER DEFAULT 0,
    daily_rate NUMERIC(10, 2) DEFAULT 0.00,
    age INTEGER,
    blood_group TEXT,
    location TEXT,
    emergency_contact TEXT,
    kyc_verified BOOLEAN DEFAULT false,
    osha_certified BOOLEAN DEFAULT false,
    medical_cleared BOOLEAN DEFAULT false,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    status TEXT DEFAULT 'Available',
    assigned_site_id TEXT REFERENCES public.sites(id) ON DELETE SET NULL,
    shift_timing TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_date DATE NOT NULL,
    worker_id TEXT NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    site_id TEXT REFERENCES public.sites(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'P', -- 'P' (Present), 'OT' (Overtime), 'H' (Half-day), 'A' (Absent)
    ot_hours NUMERIC(4, 1) DEFAULT 0.0,
    notes TEXT DEFAULT '',
    punched_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_worker_date UNIQUE (shift_date, worker_id)
);

-- ============================================================================
-- 4. ADMIN USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT DEFAULT 'Operations',
    status TEXT DEFAULT 'Active',
    permissions JSONB DEFAULT '["view_roster"]'::jsonb,
    last_login TEXT DEFAULT 'Never',
    two_factor BOOLEAN DEFAULT false,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip TEXT DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read sites" ON public.sites;
    DROP POLICY IF EXISTS "Allow public write sites" ON public.sites;
    DROP POLICY IF EXISTS "Allow public read workers" ON public.workers;
    DROP POLICY IF EXISTS "Allow public write workers" ON public.workers;
    DROP POLICY IF EXISTS "Allow public read attendance" ON public.attendance_records;
    DROP POLICY IF EXISTS "Allow public write attendance" ON public.attendance_records;
    DROP POLICY IF EXISTS "Allow public read admin_users" ON public.admin_users;
    DROP POLICY IF EXISTS "Allow public write admin_users" ON public.admin_users;
    DROP POLICY IF EXISTS "Allow public read audit_logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Allow public write audit_logs" ON public.audit_logs;
END $$;

-- Policy definitions (Permit select/insert/update/delete for anon and authenticated)
CREATE POLICY "Allow public read sites" ON public.sites FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write sites" ON public.sites FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read workers" ON public.workers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write workers" ON public.workers FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read attendance" ON public.attendance_records FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write attendance" ON public.attendance_records FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read admin_users" ON public.admin_users FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write admin_users" ON public.admin_users FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write audit_logs" ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable Realtime for live multi-user collaboration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'workers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sites'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
    END IF;
END $$;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- 1. Insert Sites
INSERT INTO public.sites (id, name, client, location, quota, supervisor, shift_timing)
VALUES
('SITE-01', 'Metro Rail Extension - Line 3 Viaduct', 'Metropolitan Transit Authority', 'North Corridor, Zone 4', 15, 'Eng. Viktor Vance (+1 555-883-9102)', 'Morning Shift (07:00 - 15:30)'),
('SITE-02', 'Skyline Residency Tower B', 'Apex Urban Developers Ltd', 'Waterfront Sector 12', 18, 'Supervisor Marcus Reed (+1 555-492-8811)', 'Morning Shift (07:00 - 15:30)'),
('SITE-03', 'Apex Logistics Multi-Hub Terminal', 'Global Cargo Logistics', 'Highway Interchange Sector 9', 12, 'Foreman Dave Gallagher (+1 555-201-9494)', 'Evening Shift (15:00 - 23:30)'),
('SITE-04', 'Solar Energy Substation Grid 2', 'SunPower Renewable Utilities', 'East Desert Basin, Lot 44', 10, 'Chief Tech Sarah Chen (+1 555-731-0988)', 'Morning Shift (07:00 - 15:30)')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Workers
INSERT INTO public.workers (id, name, phone, trade, skills, experience, years_exp, daily_rate, age, blood_group, location, emergency_contact, kyc_verified, osha_certified, medical_cleared, rating, status, assigned_site_id, shift_timing, avatar)
VALUES
('LAB-801', 'Alejandro Morales', '+1 (555) 349-8201', 'Welding & Fabrication', '["SMAW/MIG/TIG Certified", "Pressure Vessel Welding", "Blueprint Reading", "Confined Space Safe"]'::jsonb, 'Master Craftsman', 9, 230, 38, 'O+', 'Metro District, North', 'Carmen Morales (Wife) +1 555-349-8209', true, true, true, 4.9, 'Deployed', 'SITE-01', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('LAB-802', 'Tariq Al-Mansoor', '+1 (555) 782-1940', 'Heavy Equipment Operator', '["Hydraulic Excavator", "Tower Crane Grade II", "Bulldozer GPS Grade", "Trench Safety"]'::jsonb, 'Master Craftsman', 11, 250, 42, 'A+', 'Industrial Belt East', 'Zahra Al-Mansoor (Sister) +1 555-782-9900', true, true, true, 5.0, 'Deployed', 'SITE-01', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('LAB-803', 'Rohan Sharma', '+1 (555) 621-4493', 'Electrical & Wiring', '["Industrial Switchboards", "High Voltage Substation", "Conduit Bending", "PLC Automation"]'::jsonb, 'Site Supervisor', 13, 260, 45, 'B+', 'Metro Sector 8', 'Pooja Sharma (Wife) +1 555-621-9988', true, true, true, 4.95, 'Deployed', 'SITE-04', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),
('LAB-804', 'Mateo Hernandez', '+1 (555) 438-9902', 'Carpentry & Formwork', '["Doka Formwork Systems", "Bridge Decking", "Timber Framing", "Rough Carpentry"]'::jsonb, 'Master Craftsman', 8, 195, 34, 'O+', 'Southside Valley', 'Rosa Hernandez (Mother) +1 555-438-1122', true, true, true, 4.8, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'),
('LAB-805', 'Kwame Osei', '+1 (555) 912-7744', 'Masonry & Brickwork', '["Precision AAC Blocks", "Reinforced Retaining Walls", "Stone Cladding", "Mortar Batching"]'::jsonb, 'Journeyman', 5, 175, 29, 'AB+', 'Central Heights', 'Abena Osei (Sister) +1 555-912-3321', true, true, true, 4.85, 'Deployed', 'SITE-02', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('LAB-806', 'Liam Gallagher', '+1 (555) 238-6611', 'Scaffolding & Rigging', '["Cuplok & Layher Systems", "Suspended Scaffolds", "Rigging Load Calculation", "Fall Protection Leader"]'::jsonb, 'Master Craftsman', 10, 215, 37, 'O-', 'Port Terminal District', 'Clara Gallagher (Wife) +1 555-238-4400', true, true, true, 4.9, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'),
('LAB-807', 'Chen Wei', '+1 (555) 803-4921', 'Steel Fixing & Rebar', '["Heavy Rebar Tying", "PT Cable Tensioning", "Bar Bending Schedule (BBS)", "Foundation Mat Reinforcement"]'::jsonb, 'Journeyman', 4, 170, 28, 'A+', 'East Corridor', 'Mei Wei (Mother) +1 555-803-0099', true, true, true, 4.75, 'Deployed', 'SITE-02', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&auto=format&fit=crop&q=80'),
('LAB-808', 'Gabriel Santos', '+1 (555) 512-8833', 'Plumbing & Pipefitting', '["CPVC & Cast Iron Drainage", "Fire Hydrant Piping", "Hydrostatic Pressure Testing", "Sanitary Rough-in"]'::jsonb, 'Master Craftsman', 7, 190, 33, 'B+', 'South River Zone', 'Luisa Santos (Wife) +1 555-512-2211', true, true, true, 4.88, 'Deployed', 'SITE-03', 'Evening Shift (15:00 - 23:30)', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'),
('LAB-809', 'Darius Vance', '+1 (555) 670-3490', 'General Construction Helper', '["Site Debris Clearance", "Concrete Vibrator Operation", "Material Staging", "Trench Shoring Assistance"]'::jsonb, 'Apprentice', 1, 120, 22, 'O+', 'North Hill Community', 'Reginald Vance (Father) +1 555-670-8800', true, true, true, 4.65, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'),
('LAB-810', 'Ananya Deshmukh', '+1 (555) 902-6134', 'Electrical & Wiring', '["Industrial Control Panels", "Cable Tray Layout", "Low Voltage Systems", "Megger Insulation Testing"]'::jsonb, 'Journeyman', 6, 195, 30, 'B-', 'Metro Sector 4', 'Kunal Deshmukh (Brother) +1 555-902-5500', true, true, true, 4.92, 'Deployed', 'SITE-04', 'Morning Shift (07:00 - 15:30)', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
('LAB-811', 'Bogdan Kovalenko', '+1 (555) 334-1188', 'Welding & Fabrication', '["Structural Beam Welding", "Flux-Cored Arc (FCAW)", "Plasma Torch Cutting", "Overhead Position"]'::jsonb, 'Master Craftsman', 12, 240, 44, 'A+', 'Harbor Gate Sector 3', 'Oksana Kovalenko (Wife) +1 555-334-9922', true, false, true, 4.8, 'Pending', NULL, NULL, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80'),
('LAB-812', 'Samuel Kiprop', '+1 (555) 720-9944', 'Masonry & Brickwork', '["Exposed Brick Facade", "Curved Arch Masonry", "Tile Bedding", "Waterproof Plastering"]'::jsonb, 'Journeyman', 4, 165, 27, 'O+', 'East Valley Point', 'Faith Kiprop (Sister) +1 555-720-3322', true, true, true, 4.7, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'),
('LAB-813', 'Jean-Luc Dubois', '+1 (555) 441-2850', 'Painter & Finisher', '["Airless Spray Painting", "Epoxy Floor Coating", "Fireproofing Paint (Intumescent)", "Drywall Finishing"]'::jsonb, 'Master Craftsman', 8, 175, 35, 'AB-', 'West Commercial Hub', 'Camille Dubois (Wife) +1 555-441-9900', true, true, true, 4.85, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'),
('LAB-814', 'Rajendra Prasad', '+1 (555) 880-1234', 'Heavy Equipment Operator', '["Motor Grader", "Backhoe Loader", "Soil Compactor Roller", "Grade Laser Leveling"]'::jsonb, 'Master Craftsman', 14, 245, 48, 'A-', 'North Arterial Road', 'Sunita Prasad (Wife) +1 555-880-4321', true, true, true, 4.95, 'Deployed', 'SITE-03', 'Evening Shift (15:00 - 23:30)', 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80'),
('LAB-815', 'Carlos Mendez', '+1 (555) 551-7890', 'General Construction Helper', '["Forklift Certified", "Safety Barricade Setup", "Aggregate Loading", "Site Housekeeping"]'::jsonb, 'Apprentice', 2, 130, 24, 'O+', 'South District Gate', 'Maria Mendez (Sister) +1 555-551-3344', true, true, true, 4.7, 'On Leave', NULL, NULL, 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80'),
('LAB-816', 'Kenji Takahashi', '+1 (555) 619-3382', 'Carpentry & Formwork', '["Architectural Woodwork", "Precision Joinery", "Curved Shuttering", "Acoustic Wall Panels"]'::jsonb, 'Master Craftsman', 15, 220, 46, 'B+', 'Harbor Gateway', 'Yoko Takahashi (Wife) +1 555-619-8800', true, true, true, 4.98, 'Available', NULL, NULL, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Admin Users
INSERT INTO public.admin_users (id, name, email, role, department, status, permissions, last_login, two_factor, avatar)
VALUES
('ADM-001', 'Marcus Vance', 'marcus.vance@buildvantage.internal', 'Super Admin', 'Executive Operations', 'Active', '["all_access", "manage_users", "deploy_crew", "edit_wages", "compliance_audit", "export_data"]'::jsonb, '2026-10-04 14:15', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),
('ADM-002', 'Sarah Jenkins', 's.jenkins@buildvantage.internal', 'Dispatch Coordinator', 'Field Allocations', 'Active', '["deploy_crew", "view_roster", "site_requisitions", "attendance_mark"]'::jsonb, '2026-10-04 13:40', true, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
('ADM-003', 'David Ortiz', 'd.ortiz@buildvantage.internal', 'Compliance & Safety Officer', 'Quality & Standards', 'Active', '["compliance_audit", "kyc_verify", "osha_clearance", "medical_audit"]'::jsonb, '2026-10-04 11:22', false, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('ADM-004', 'Priya Nair', 'priya.nair@buildvantage.internal', 'Payroll & Accounts Lead', 'Finance & Payouts', 'Active', '["edit_wages", "approve_payouts", "export_financials", "attendance_audit"]'::jsonb, '2026-10-04 14:55', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
('ADM-005', 'Kenji Sato', 'k.sato@buildvantage.internal', 'Site Operations Auditor', 'Regional Site Supervision', 'Suspended', '["view_roster", "attendance_mark"]'::jsonb, '2026-09-28 09:12', false, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Audit Logs
INSERT INTO public.audit_logs (id, timestamp, user_name, role, action, details, ip)
VALUES
('LOG-1092', '2026-10-04 14:55:12', 'Priya Nair', 'Payroll & Accounts Lead', 'APPROVED_PAYROLL_BATCH', 'Validated daily wage calculation for 12 crew members at Metro Rail Extension - Line 3 ($2,640 total)', '192.168.1.42'),
('LOG-1091', '2026-10-04 14:20:05', 'Sarah Jenkins', 'Dispatch Coordinator', 'DISPATCH_CREW', 'Allocated worker #LAB-801 (Alejandro Morales) to Skyline Residency Tower B', '192.168.1.18'),
('LOG-1090', '2026-10-04 13:12:44', 'David Ortiz', 'Compliance & Safety Officer', 'KYC_VERIFICATION_PASS', 'Approved biometric identity & OSHA-30 clearance for #LAB-803 (Rohan Sharma)', '192.168.1.33'),
('LOG-1089', '2026-10-04 11:45:00', 'Marcus Vance', 'Super Admin', 'USER_ROLE_UPDATED', 'Modified system privileges for Kenji Sato (Role updated to Site Operations Auditor)', '192.168.1.10'),
('LOG-1088', '2026-10-04 09:30:19', 'Marcus Vance', 'Super Admin', 'SYSTEM_BACKUP', 'Automated snapshot of workforce registry, site assignments, and shift ledgers generated', '192.168.1.10')
ON CONFLICT (id) DO NOTHING;
